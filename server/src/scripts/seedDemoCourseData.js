import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../modules/auth/auth.utils.js';
import { env } from '../config/env.js';

const DEMO_CREATOR = {
  email: 'creator.demo@makteb.local',
  password: 'DemoPass123!',
  name: 'Demo Creator',
  role: 'CREATOR',
};

const DEMO_STUDENT = {
  email: 'student.demo@makteb.local',
  password: 'DemoPass123!',
  name: 'Demo Student',
  role: 'MEMBER',
};

const DEMO_COMMUNITY = {
  name: 'Editing Lair Demo',
  slug: 'editing-lair-demo',
  description: 'A demo course community for testing posts, tabs, members, and leaderboard.',
  visibility: 'PUBLIC',
  coverImage:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
};

const DEMO_COURSE = {
  title: 'Editing Mastery Bootcamp',
  description: 'Learn advanced editing systems and grow through community feedback loops.',
  coverImage:
    'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1400&q=80',
  published: true,
  order: 0,
};

const DEFAULT_LEVELS = [
  { name: 'Newcomer', minPoints: 0, order: 1 },
  { name: 'Active', minPoints: 50, order: 2 },
  { name: 'Contributor', minPoints: 150, order: 3 },
  { name: 'Expert', minPoints: 500, order: 4 },
  { name: 'Legend', minPoints: 1000, order: 5 },
];

async function upsertLocalUser({ email, password, name, role }) {
  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      provider: 'LOCAL',
      passwordHash,
    },
    create: {
      email,
      name,
      role,
      provider: 'LOCAL',
      passwordHash,
    },
  });
}

async function ensureCommunityMembership(userId, communityId, role = 'MEMBER') {
  return prisma.communityMember.upsert({
    where: {
      userId_communityId: { userId, communityId },
    },
    update: { role },
    create: { userId, communityId, role },
  });
}

async function seed() {
  const creator = await upsertLocalUser(DEMO_CREATOR);
  const student = await upsertLocalUser(DEMO_STUDENT);

  const community = await prisma.community.upsert({
    where: { slug: DEMO_COMMUNITY.slug },
    update: {
      name: DEMO_COMMUNITY.name,
      description: DEMO_COMMUNITY.description,
      visibility: DEMO_COMMUNITY.visibility,
      coverImage: DEMO_COMMUNITY.coverImage,
      creatorId: creator.id,
    },
    create: {
      ...DEMO_COMMUNITY,
      creatorId: creator.id,
    },
  });

  await ensureCommunityMembership(creator.id, community.id, 'OWNER');
  await ensureCommunityMembership(student.id, community.id, 'MEMBER');

  await prisma.level.deleteMany({ where: { communityId: community.id } });
  await prisma.level.createMany({
    data: DEFAULT_LEVELS.map((level) => ({
      ...level,
      communityId: community.id,
    })),
  });

  const existingCourse = await prisma.course.findFirst({
    where: {
      communityId: community.id,
      title: DEMO_COURSE.title,
    },
  });

  const course = existingCourse
    ? await prisma.course.update({
        where: { id: existingCourse.id },
        data: {
          ...DEMO_COURSE,
          communityId: community.id,
          creatorId: creator.id,
        },
      })
    : await prisma.course.create({
        data: {
          ...DEMO_COURSE,
          communityId: community.id,
          creatorId: creator.id,
        },
      });

  await prisma.module.deleteMany({ where: { courseId: course.id } });

  const moduleOne = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Foundation Systems',
      order: 0,
    },
  });

  const moduleTwo = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Advanced Community Growth',
      order: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: moduleOne.id,
        title: 'Welcome and Workflow Setup',
        order: 0,
        content: 'Set up your editing workflow and project standards.',
      },
      {
        moduleId: moduleOne.id,
        title: 'Revision Loops',
        order: 1,
        content: 'Run structured feedback loops to improve output quality fast.',
      },
      {
        moduleId: moduleTwo.id,
        title: 'Audience Positioning',
        order: 0,
        content: 'Design content and offers for a clearly defined niche.',
      },
      {
        moduleId: moduleTwo.id,
        title: 'Community-led Retention',
        order: 1,
        content: 'Use weekly rituals and prompts to drive recurring engagement.',
      },
    ],
  });

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      courseId: course.id,
    },
  });

  const demoPostTitles = [
    'My first win after joining',
    'Need feedback on client onboarding flow',
    'Weekly productivity checkpoint',
  ];
  await prisma.post.deleteMany({
    where: {
      communityId: community.id,
      title: { in: demoPostTitles },
    },
  });

  await prisma.post.createMany({
    data: [
      {
        communityId: community.id,
        authorId: student.id,
        title: 'My first win after joining',
        content: 'I finished 3 pending edits this week using the batching method.',
        type: 'DISCUSSION',
        category: 'WINS',
      },
      {
        communityId: community.id,
        authorId: creator.id,
        title: 'Need feedback on client onboarding flow',
        content: 'Share your best onboarding sequence for new editing clients.',
        type: 'DISCUSSION',
        category: 'BRANDING_CLIENTS',
      },
      {
        communityId: community.id,
        authorId: student.id,
        title: 'Weekly productivity checkpoint',
        content: 'What is one workflow habit that improved your speed this week?',
        type: 'DISCUSSION',
        category: 'WORKFLOW_PRODUCTIVITY',
      },
    ],
  });

  await prisma.pointEntry.deleteMany({
    where: {
      communityId: community.id,
      userId: { in: [creator.id, student.id] },
    },
  });

  await prisma.pointEntry.createMany({
    data: [
      { userId: creator.id, communityId: community.id, amount: 120, reason: 'Seed leaderboard' },
      { userId: student.id, communityId: community.id, amount: 95, reason: 'Seed leaderboard' },
      { userId: creator.id, communityId: community.id, amount: 35, reason: 'Seed leaderboard' },
      { userId: student.id, communityId: community.id, amount: 25, reason: 'Seed leaderboard' },
    ],
  });

  console.log('\nDemo course-community data seeded successfully.\n');
  console.log('Credentials');
  console.log(`- Student (enrolled): ${DEMO_STUDENT.email} / ${DEMO_STUDENT.password}`);
  console.log(`- Creator: ${DEMO_CREATOR.email} / ${DEMO_CREATOR.password}\n`);
  console.log('Quick URLs');
  console.log(`- Discover: ${env.clientUrl}/discover`);
  console.log(`- Course shell: ${env.clientUrl}/course/${course.id}`);
  console.log(`- Lesson player: ${env.clientUrl}/course/${course.id}/learn\n`);
}

seed()
  .catch((error) => {
    console.error('Failed to seed demo data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
