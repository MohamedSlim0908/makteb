import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../modules/auth/auth.utils.js';
import { env } from '../config/env.js';

const USERS = {
  owner: {
    email: 'owner.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Lina Owner',
    role: 'CREATOR',
    bio: 'Owner of the demo community.',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80',
  },
  admin: {
    email: 'admin.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Youssef Admin',
    role: 'ADMIN',
    bio: 'Community admin account.',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
  },
  moderator: {
    email: 'moderator.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Sara Moderator',
    role: 'MEMBER',
    bio: 'Moderates comments and events.',
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=320&q=80',
  },
  member: {
    email: 'member.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Amine Member',
    role: 'MEMBER',
    bio: 'Learner enrolled in demo courses.',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=320&q=80',
  },
  guest: {
    email: 'guest.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Nour Guest',
    role: 'MEMBER',
    bio: 'Guest account invited to the community.',
    avatar:
      'https://images.unsplash.com/photo-1542204625-de293a2b42d5?auto=format&fit=crop&w=320&q=80',
  },
};

const COMMUNITY = {
  name: 'Editing Lair Demo',
  slug: 'editing-lair-demo',
  description: 'A fake community covering feed, classroom, calendar, and gamification.',
  coverImage:
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
  visibility: 'PUBLIC',
};

const COURSE = {
  title: 'Editing Mastery Bootcamp',
  description: 'Learn editing workflow, storytelling, and client retention systems.',
  coverImage:
    'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1600&q=80',
  status: 'PUBLISHED',
  published: true,
  order: 0,
};

const LEVELS = [
  { name: 'Newcomer', minPoints: 0, levelNumber: 1, unlockDescription: 'Access community feed', order: 1 },
  { name: 'Active', minPoints: 50, levelNumber: 2, unlockDescription: 'Unlock priority Q&A', order: 2 },
  { name: 'Contributor', minPoints: 150, levelNumber: 3, unlockDescription: 'Featured contributor badge', order: 3 },
  { name: 'Expert', minPoints: 500, levelNumber: 4, unlockDescription: 'Access private workshops', order: 4 },
  { name: 'Legend', minPoints: 1000, levelNumber: 5, unlockDescription: 'Top leaderboard frame', order: 5 },
];

const POST_TITLES = [
  '[FAKE] My first win after joining',
  '[FAKE] Need feedback on onboarding flow',
  '[FAKE] Weekly productivity checkpoint',
];

function daysFromNow(days, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function upsertLocalUser({ email, password, name, role, avatar, bio }) {
  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      avatar,
      bio,
      provider: 'LOCAL',
      passwordHash,
    },
    create: {
      email,
      name,
      role,
      avatar,
      bio,
      provider: 'LOCAL',
      passwordHash,
    },
  });
}

async function upsertPaymentByProviderRef({
  userId,
  type,
  referenceId,
  subscriptionId,
  amount,
  currency,
  provider,
  status,
  providerTxId,
}) {
  const existing = await prisma.payment.findFirst({
    where: { providerTxId },
  });

  if (existing) {
    return prisma.payment.update({
      where: { id: existing.id },
      data: { userId, type, referenceId, subscriptionId, amount, currency, provider, status, providerTxId },
    });
  }

  return prisma.payment.create({
    data: { userId, type, referenceId, subscriptionId, amount, currency, provider, status, providerTxId },
  });
}

async function seed() {
  const [owner, admin, moderator, member, guest] = await Promise.all(
    Object.values(USERS).map((user) => upsertLocalUser(user))
  );

  const community = await prisma.community.upsert({
    where: { slug: COMMUNITY.slug },
    update: {
      name: COMMUNITY.name,
      description: COMMUNITY.description,
      coverImage: COMMUNITY.coverImage,
      visibility: COMMUNITY.visibility,
      creatorId: owner.id,
    },
    create: {
      ...COMMUNITY,
      creatorId: owner.id,
    },
  });

  await Promise.all([
    prisma.communityMember.upsert({
      where: { userId_communityId: { userId: owner.id, communityId: community.id } },
      update: { role: 'OWNER', status: 'ACTIVE' },
      create: { userId: owner.id, communityId: community.id, role: 'OWNER', status: 'ACTIVE' },
    }),
    prisma.communityMember.upsert({
      where: { userId_communityId: { userId: admin.id, communityId: community.id } },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: { userId: admin.id, communityId: community.id, role: 'ADMIN', status: 'ACTIVE' },
    }),
    prisma.communityMember.upsert({
      where: { userId_communityId: { userId: moderator.id, communityId: community.id } },
      update: { role: 'MODERATOR', status: 'ACTIVE' },
      create: { userId: moderator.id, communityId: community.id, role: 'MODERATOR', status: 'ACTIVE' },
    }),
    prisma.communityMember.upsert({
      where: { userId_communityId: { userId: member.id, communityId: community.id } },
      update: { role: 'MEMBER', status: 'ACTIVE' },
      create: { userId: member.id, communityId: community.id, role: 'MEMBER', status: 'ACTIVE' },
    }),
  ]);

  await prisma.invite.upsert({
    where: { token: 'invite-demo-guest-token' },
    update: {
      communityId: community.id,
      invitedEmail: guest.email,
      invitedById: admin.id,
      status: 'PENDING',
      expiresAt: daysFromNow(7),
    },
    create: {
      communityId: community.id,
      invitedEmail: guest.email,
      invitedById: admin.id,
      token: 'invite-demo-guest-token',
      status: 'PENDING',
      expiresAt: daysFromNow(7),
    },
  });

  await prisma.level.deleteMany({ where: { communityId: community.id } });
  await prisma.level.createMany({
    data: LEVELS.map((level) => ({ ...level, communityId: community.id })),
  });

  const monthlyPlan = await prisma.plan.upsert({
    where: {
      communityId_name: {
        communityId: community.id,
        name: 'Pro Monthly',
      },
    },
    update: {
      priceCents: 4900,
      currency: 'USD',
      interval: 'MONTH',
      isActive: true,
    },
    create: {
      communityId: community.id,
      name: 'Pro Monthly',
      priceCents: 4900,
      currency: 'USD',
      interval: 'MONTH',
      isActive: true,
    },
  });

  const ownerSubscription = await prisma.subscription.upsert({
    where: { planId_userId: { planId: monthlyPlan.id, userId: owner.id } },
    update: {
      status: 'ACTIVE',
      currentPeriodEnd: daysFromNow(30),
      canceledAt: null,
    },
    create: {
      planId: monthlyPlan.id,
      userId: owner.id,
      status: 'ACTIVE',
      currentPeriodEnd: daysFromNow(30),
    },
  });

  const memberSubscription = await prisma.subscription.upsert({
    where: { planId_userId: { planId: monthlyPlan.id, userId: member.id } },
    update: {
      status: 'TRIALING',
      currentPeriodEnd: daysFromNow(14),
      canceledAt: null,
    },
    create: {
      planId: monthlyPlan.id,
      userId: member.id,
      status: 'TRIALING',
      currentPeriodEnd: daysFromNow(14),
    },
  });

  const existingCourse = await prisma.course.findFirst({
    where: { communityId: community.id, title: COURSE.title },
  });

  const course = existingCourse
    ? await prisma.course.update({
        where: { id: existingCourse.id },
        data: { ...COURSE, communityId: community.id, creatorId: owner.id },
      })
    : await prisma.course.create({
        data: { ...COURSE, communityId: community.id, creatorId: owner.id },
      });

  await prisma.module.deleteMany({ where: { courseId: course.id } });

  const moduleFundamentals = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Foundation Systems',
      order: 0,
    },
  });
  const moduleAdvanced = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Advanced Growth Loops',
      order: 1,
    },
  });

  const lessons = await Promise.all([
    prisma.lesson.create({
      data: {
        moduleId: moduleFundamentals.id,
        title: 'Welcome and Workflow Setup',
        type: 'TEXT',
        content: 'Set up your editing workflow, folder structure, and checklist.',
        attachmentsJson: [{ type: 'pdf', name: 'workflow-checklist.pdf' }],
        order: 0,
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: moduleFundamentals.id,
        title: 'Revision Loops',
        type: 'VIDEO',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        content: 'Run structured feedback loops for better outputs.',
        order: 1,
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: moduleAdvanced.id,
        title: 'Audience Positioning',
        type: 'TEXT',
        content: 'Define positioning and outcomes for your audience.',
        order: 0,
      },
    }),
    prisma.lesson.create({
      data: {
        moduleId: moduleAdvanced.id,
        title: 'Retention Rituals',
        type: 'QUIZ',
        content: 'Quiz: weekly rhythm and retention loops.',
        order: 1,
      },
    }),
  ]);

  const [lesson1, lesson2, lesson3, lesson4] = lessons;

  await Promise.all([
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: member.id, courseId: course.id } },
      update: { progress: 50, completedLessons: [lesson1.id, lesson2.id] },
      create: {
        userId: member.id,
        courseId: course.id,
        progress: 50,
        completedLessons: [lesson1.id, lesson2.id],
      },
    }),
    prisma.enrollment.upsert({
      where: { userId_courseId: { userId: moderator.id, courseId: course.id } },
      update: { progress: 25, completedLessons: [lesson1.id] },
      create: {
        userId: moderator.id,
        courseId: course.id,
        progress: 25,
        completedLessons: [lesson1.id],
      },
    }),
  ]);

  const lessonProgressEntries = [
    { lessonId: lesson1.id, userId: member.id, status: 'COMPLETED', completedAt: daysFromNow(-3) },
    { lessonId: lesson2.id, userId: member.id, status: 'COMPLETED', completedAt: daysFromNow(-2) },
    { lessonId: lesson3.id, userId: member.id, status: 'IN_PROGRESS', completedAt: null },
    { lessonId: lesson1.id, userId: moderator.id, status: 'COMPLETED', completedAt: daysFromNow(-1) },
    { lessonId: lesson2.id, userId: moderator.id, status: 'IN_PROGRESS', completedAt: null },
    { lessonId: lesson4.id, userId: owner.id, status: 'NOT_STARTED', completedAt: null },
  ];

  await Promise.all(
    lessonProgressEntries.map((entry) =>
      prisma.lessonProgress.upsert({
        where: { lessonId_userId: { lessonId: entry.lessonId, userId: entry.userId } },
        update: {
          status: entry.status,
          completedAt: entry.completedAt,
        },
        create: entry,
      })
    )
  );

  await prisma.post.deleteMany({
    where: {
      communityId: community.id,
      title: { in: POST_TITLES },
    },
  });

  const postA = await prisma.post.create({
    data: {
      communityId: community.id,
      authorId: member.id,
      title: POST_TITLES[0],
      content: 'I finished 3 pending edits this week using batching and time-boxing.',
      type: 'POST',
      category: 'WINS',
    },
  });
  const postB = await prisma.post.create({
    data: {
      communityId: community.id,
      authorId: owner.id,
      title: POST_TITLES[1],
      content: 'Share your best onboarding sequence for new editing clients.',
      type: 'QUESTION',
      category: 'BRANDING_CLIENTS',
      pinned: true,
    },
  });
  const postC = await prisma.post.create({
    data: {
      communityId: community.id,
      authorId: moderator.id,
      title: POST_TITLES[2],
      content: 'What workflow habit improved your speed this week?',
      type: 'DISCUSSION',
      category: 'WORKFLOW_PRODUCTIVITY',
    },
  });

  const commentA = await prisma.comment.create({
    data: {
      postId: postA.id,
      authorId: owner.id,
      content: 'Great progress. Keep this cadence for next week.',
    },
  });
  const commentB = await prisma.comment.create({
    data: {
      postId: postA.id,
      authorId: member.id,
      parentId: commentA.id,
      content: 'Will do, thank you!',
    },
  });
  const commentC = await prisma.comment.create({
    data: {
      postId: postB.id,
      authorId: moderator.id,
      content: 'Start with scope, timeline, revision policy, then communication channel.',
    },
  });

  await Promise.all([
    prisma.like.upsert({
      where: { postId_userId: { postId: postA.id, userId: owner.id } },
      update: {},
      create: { postId: postA.id, userId: owner.id },
    }),
    prisma.like.upsert({
      where: { postId_userId: { postId: postA.id, userId: moderator.id } },
      update: {},
      create: { postId: postA.id, userId: moderator.id },
    }),
    prisma.like.upsert({
      where: { postId_userId: { postId: postB.id, userId: member.id } },
      update: {},
      create: { postId: postB.id, userId: member.id },
    }),
  ]);

  await Promise.all([
    prisma.reaction.upsert({
      where: {
        userId_targetType_targetId_emoji: {
          userId: owner.id,
          targetType: 'POST',
          targetId: postA.id,
          emoji: '🔥',
        },
      },
      update: { postId: postA.id, commentId: null },
      create: {
        userId: owner.id,
        targetType: 'POST',
        targetId: postA.id,
        postId: postA.id,
        emoji: '🔥',
      },
    }),
    prisma.reaction.upsert({
      where: {
        userId_targetType_targetId_emoji: {
          userId: member.id,
          targetType: 'COMMENT',
          targetId: commentC.id,
          emoji: '👍',
        },
      },
      update: { postId: null, commentId: commentC.id },
      create: {
        userId: member.id,
        targetType: 'COMMENT',
        targetId: commentC.id,
        commentId: commentC.id,
        emoji: '👍',
      },
    }),
    prisma.reaction.upsert({
      where: {
        userId_targetType_targetId_emoji: {
          userId: moderator.id,
          targetType: 'COMMENT',
          targetId: commentB.id,
          emoji: '🎯',
        },
      },
      update: { postId: null, commentId: commentB.id },
      create: {
        userId: moderator.id,
        targetType: 'COMMENT',
        targetId: commentB.id,
        commentId: commentB.id,
        emoji: '🎯',
      },
    }),
  ]);

  await prisma.event.deleteMany({
    where: {
      communityId: community.id,
      title: { in: ['[FAKE] Weekly Live Q&A', '[FAKE] Portfolio Review Session'] },
    },
  });

  const eventA = await prisma.event.create({
    data: {
      communityId: community.id,
      createdBy: owner.id,
      title: '[FAKE] Weekly Live Q&A',
      description: 'Ask questions about workflow, clients, and pricing.',
      startAt: daysFromNow(2, 17),
      endAt: daysFromNow(2, 18),
      meetingUrl: 'https://meet.example.com/live-qna',
    },
  });
  const eventB = await prisma.event.create({
    data: {
      communityId: community.id,
      createdBy: moderator.id,
      title: '[FAKE] Portfolio Review Session',
      description: 'Live review for submitted editing reels.',
      startAt: daysFromNow(5, 19),
      endAt: daysFromNow(5, 20),
      meetingUrl: 'https://meet.example.com/portfolio-review',
    },
  });

  await Promise.all([
    prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId: eventA.id, userId: owner.id } },
      update: { status: 'GOING', respondedAt: new Date() },
      create: { eventId: eventA.id, userId: owner.id, status: 'GOING' },
    }),
    prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId: eventA.id, userId: member.id } },
      update: { status: 'MAYBE', respondedAt: new Date() },
      create: { eventId: eventA.id, userId: member.id, status: 'MAYBE' },
    }),
    prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId: eventB.id, userId: moderator.id } },
      update: { status: 'GOING', respondedAt: new Date() },
      create: { eventId: eventB.id, userId: moderator.id, status: 'GOING' },
    }),
    prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId: eventB.id, userId: admin.id } },
      update: { status: 'NOT_GOING', respondedAt: new Date() },
      create: { eventId: eventB.id, userId: admin.id, status: 'NOT_GOING' },
    }),
  ]);

  await prisma.pointEntry.deleteMany({
    where: {
      communityId: community.id,
      userId: { in: [owner.id, admin.id, moderator.id, member.id] },
      reason: { startsWith: '[FAKE]' },
    },
  });
  await prisma.pointEntry.createMany({
    data: [
      { userId: owner.id, communityId: community.id, sourceType: 'POST', sourceId: postB.id, amount: 5, reason: '[FAKE] Created post' },
      { userId: member.id, communityId: community.id, sourceType: 'COMMENT', sourceId: commentB.id, amount: 2, reason: '[FAKE] Added comment' },
      { userId: moderator.id, communityId: community.id, sourceType: 'EVENT', sourceId: eventB.id, amount: 8, reason: '[FAKE] Hosted event' },
      { userId: member.id, communityId: community.id, sourceType: 'LESSON', sourceId: lesson2.id, amount: 10, reason: '[FAKE] Completed lesson' },
      { userId: admin.id, communityId: community.id, sourceType: 'MANUAL', sourceId: null, amount: 30, reason: '[FAKE] Manual admin bonus' },
    ],
  });

  await Promise.all([
    upsertPaymentByProviderRef({
      userId: member.id,
      type: 'COURSE',
      referenceId: course.id,
      subscriptionId: memberSubscription.id,
      amount: 49,
      currency: 'USD',
      provider: 'STRIPE',
      status: 'SUCCEEDED',
      providerTxId: 'fake-tx-course-member-001',
    }),
    upsertPaymentByProviderRef({
      userId: owner.id,
      type: 'COMMUNITY',
      referenceId: community.id,
      subscriptionId: ownerSubscription.id,
      amount: 49,
      currency: 'USD',
      provider: 'FLOUCI',
      status: 'COMPLETED',
      providerTxId: 'fake-tx-community-owner-001',
    }),
  ]);

  await prisma.notification.deleteMany({
    where: {
      userId: { in: [owner.id, member.id] },
      title: { startsWith: '[FAKE]' },
    },
  });
  await prisma.notification.createMany({
    data: [
      {
        userId: owner.id,
        title: '[FAKE] New event scheduled',
        body: 'Weekly Live Q&A is scheduled in 2 days.',
        link: `/community/${community.slug}`,
      },
      {
        userId: member.id,
        title: '[FAKE] Lesson progress updated',
        body: 'You completed 2 lessons in Editing Mastery Bootcamp.',
        link: `/course/${course.id}/learn`,
      },
    ],
  });

  console.log('\nCommunity platform fake data seeded successfully.\n');
  console.log('Credentials');
  for (const key of Object.keys(USERS)) {
    const account = USERS[key];
    console.log(`- ${key}: ${account.email} / ${account.password}`);
  }
  console.log('\nQuick URLs');
  console.log(`- Discover: ${env.clientUrl}/discover`);
  console.log(`- Community: ${env.clientUrl}/community/${community.slug}`);
  console.log(`- Course shell: ${env.clientUrl}/course/${course.id}`);
  console.log(`- Lesson player: ${env.clientUrl}/course/${course.id}/learn\n`);
}

seed()
  .catch((error) => {
    console.error('Failed to seed community platform fake data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
