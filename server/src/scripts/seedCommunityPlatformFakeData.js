import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../modules/auth/auth.utils.js';
import { env } from '../config/env.js';

const USERS = [
  {
    email: 'owner.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Alex Rivera',
    role: 'CREATOR',
    bio: 'Building communities that help creators grow. Previously ran a 50k YouTube channel.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=80',
  },
  {
    email: 'admin.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Sarah Chen',
    role: 'ADMIN',
    bio: 'Community manager and content strategist. Passionate about education.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80',
  },
  {
    email: 'moderator.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Marcus Johnson',
    role: 'MEMBER',
    bio: 'Full-stack developer and educator. Love helping people learn to code.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80',
  },
  {
    email: 'member.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Emma Wilson',
    role: 'MEMBER',
    bio: 'Graphic designer transitioning into UX. Currently learning everything I can.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=320&q=80',
  },
  {
    email: 'member2.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'James Park',
    role: 'MEMBER',
    bio: 'Product manager by day, community builder by night.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=320&q=80',
  },
  {
    email: 'member3.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Lina Dubois',
    role: 'MEMBER',
    bio: 'French designer living in NYC. I love minimal design and strong typography.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=80',
  },
  {
    email: 'member4.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Raj Patel',
    role: 'MEMBER',
    bio: 'Data scientist who writes about AI and machine learning.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80',
  },
  {
    email: 'member5.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Yuki Tanaka',
    role: 'MEMBER',
    bio: 'Frontend developer passionate about accessible web design.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80',
  },
  {
    email: 'member6.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Omar Hassan',
    role: 'MEMBER',
    bio: 'Startup founder. Building in public and sharing the journey.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=320&q=80',
  },
  {
    email: 'guest.demo@makteb.local',
    password: 'DemoPass123!',
    name: 'Nina Kowalski',
    role: 'MEMBER',
    bio: 'Marketing specialist exploring community-led growth.',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=320&q=80',
  },
];

const COMMUNITIES = [
  {
    name: 'Creator Academy',
    slug: 'creator-academy',
    description: 'A community for creators who want to build, launch, and grow online businesses. We share strategies, tools, and honest feedback. Weekly live Q&A sessions and a structured course to help you go from 0 to your first $10k.',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
    category: 'money',
    visibility: 'PUBLIC',
  },
  {
    name: 'Design Collective',
    slug: 'design-collective',
    description: 'For designers who want to level up their craft. Portfolio reviews, design challenges, and mentorship from senior designers at top companies.',
    coverImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1600&q=80',
    category: 'hobbies',
    visibility: 'PUBLIC',
  },
  {
    name: 'Code & Coffee',
    slug: 'code-and-coffee',
    description: 'Learn to code in a supportive environment. From beginners to seniors, we help each other grow. Daily coding challenges and pair programming sessions.',
    coverImage: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1600&q=80',
    category: 'tech',
    visibility: 'PUBLIC',
  },
  {
    name: 'Startup Lab',
    slug: 'startup-lab',
    description: 'Building a startup? Join founders sharing real numbers, strategies, and lessons learned. No fluff, just real talk about building products people want.',
    coverImage: 'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?auto=format&fit=crop&w=1600&q=80',
    category: 'money',
    visibility: 'PUBLIC',
  },
  {
    name: 'Mindful Living',
    slug: 'mindful-living',
    description: 'A space for personal growth, meditation, and intentional living. Weekly guided sessions and a supportive community.',
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80',
    category: 'spirituality',
    visibility: 'PUBLIC',
  },
  {
    name: 'Photography Masters',
    slug: 'photography-masters',
    description: 'Take better photos. Learn composition, lighting, and editing from professional photographers. Monthly photo challenges.',
    coverImage: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1600&q=80',
    category: 'hobbies',
    visibility: 'PUBLIC',
  },
];

const COURSES = [
  {
    title: 'Creator Business Blueprint',
    description: 'Go from idea to $10k/month with a step-by-step system for building your creator business. Learn audience building, content strategy, and monetization.',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
    status: 'PUBLISHED',
    published: true,
    order: 0,
    communityIndex: 0,
    modules: [
      {
        title: 'Foundation & Mindset',
        lessons: [
          { title: 'Welcome & Course Overview', type: 'TEXT', content: 'Welcome to the Creator Business Blueprint! In this course, you will learn the exact framework used by top creators to build sustainable online businesses.\n\nHere is what we will cover:\n- Finding your niche\n- Building an audience\n- Creating valuable content\n- Monetization strategies\n- Scaling your business\n\nLet us get started!' },
          { title: 'Finding Your Niche', type: 'VIDEO', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', content: 'Your niche is the intersection of what you are good at, what you love, and what people will pay for. Use the framework in this lesson to find yours.' },
          { title: 'The Creator Mindset', type: 'TEXT', content: 'The biggest difference between successful creators and everyone else is mindset. Learn the 5 mental models that separate the top 1% of creators.' },
        ],
      },
      {
        title: 'Audience Building',
        lessons: [
          { title: 'Platform Selection Strategy', type: 'TEXT', content: 'Not all platforms are equal. Learn which platform to focus on based on your content style and target audience.' },
          { title: 'Content That Grows', type: 'VIDEO', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', content: 'The hook-story-offer framework for creating content that attracts the right audience.' },
          { title: 'Building a Community', type: 'TEXT', content: 'Why community is the ultimate moat and how to build one from scratch.' },
        ],
      },
      {
        title: 'Monetization',
        lessons: [
          { title: 'Revenue Models for Creators', type: 'TEXT', content: 'An overview of the 7 revenue models available to creators, from courses to consulting to community.' },
          { title: 'Pricing Your Offers', type: 'TEXT', content: 'How to price your products and services to maximize revenue while delivering insane value.' },
          { title: 'Your First $10k Month', type: 'QUIZ', content: 'Put it all together and create your personal roadmap to $10k/month.' },
        ],
      },
    ],
  },
  {
    title: 'Design Fundamentals',
    description: 'Master the principles of great design. From typography to color theory, layout to user experience.',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1600&q=80',
    status: 'PUBLISHED',
    published: true,
    order: 0,
    communityIndex: 1,
    modules: [
      {
        title: 'Design Principles',
        lessons: [
          { title: 'Introduction to Design Thinking', type: 'TEXT', content: 'Design thinking is a methodology for creative problem solving. Learn the 5 stages and how to apply them.' },
          { title: 'Typography Essentials', type: 'TEXT', content: 'Typography is the backbone of design. Learn font pairing, hierarchy, and readability.' },
          { title: 'Color Theory in Practice', type: 'VIDEO', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', content: 'Understanding color psychology and creating harmonious palettes.' },
        ],
      },
      {
        title: 'UI Design',
        lessons: [
          { title: 'Layout & Spacing', type: 'TEXT', content: 'The invisible art of layout. How spacing, alignment, and grids create visual harmony.' },
          { title: 'Component Design', type: 'TEXT', content: 'Building reusable UI components that are both beautiful and functional.' },
        ],
      },
    ],
  },
];

const DEFAULT_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const EXTRA_COURSE_BLUEPRINTS = [
  {
    title: 'YouTube Launch Sprint',
    description: 'Build a repeatable publishing cadence, sharpen your topic strategy, and turn your first videos into a growth engine.',
    coverImage: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 0,
    order: 1,
    price: 29,
    moduleTitles: ['Channel Positioning', 'Video Planning System', 'Retention & Offers'],
  },
  {
    title: 'Newsletter Growth Systems',
    description: 'Create a newsletter readers open, trust, and buy from using simple systems for ideation, writing, and conversion.',
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 0,
    order: 2,
    price: 19,
    moduleTitles: ['Audience Promise', 'Weekly Editorial Workflow', 'Subscriber Monetization'],
  },
  {
    title: 'Digital Products Lab',
    description: 'Validate an offer, package it quickly, and launch digital products without weeks of overbuilding.',
    coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 0,
    order: 3,
    price: 39,
    moduleTitles: ['Offer Selection', 'Fast Product Creation', 'Launch Review Loop'],
  },
  {
    title: 'Portfolio Storytelling',
    description: 'Turn static case studies into a narrative that sells your thinking, process, and outcomes.',
    coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 1,
    order: 1,
    price: 24,
    moduleTitles: ['Case Study Framing', 'Visual Proof', 'Portfolio Conversion'],
  },
  {
    title: 'Brand Identity Deep Dive',
    description: 'Learn how to build cohesive visual systems that hold together across logos, typography, motion, and collateral.',
    coverImage: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 1,
    order: 2,
    price: 34,
    moduleTitles: ['Brand Strategy Inputs', 'Identity Components', 'System Rollout'],
  },
  {
    title: 'Figma Systems Workshop',
    description: 'Structure files, components, and design tokens so your team can move fast without losing consistency.',
    coverImage: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 1,
    order: 3,
    price: 21,
    moduleTitles: ['File Architecture', 'Component Patterns', 'Handoff & QA'],
  },
  {
    title: 'JavaScript Foundations',
    description: 'A practical path through the core language concepts you need before frameworks start to make sense.',
    coverImage: 'https://images.unsplash.com/photo-1515876305429-8a6653c0d5d3?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 2,
    order: 1,
    price: 0,
    moduleTitles: ['Language Basics', 'Functions & State', 'Debugging Practice'],
  },
  {
    title: 'React Project Studio',
    description: 'Ship a complete React app with routing, state, data fetching, and real implementation decisions.',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 2,
    order: 2,
    price: 35,
    moduleTitles: ['Project Setup', 'Component Architecture', 'Data & Deployment'],
  },
  {
    title: 'Backend API Essentials',
    description: 'Design, build, and secure APIs with a clear focus on contracts, auth, persistence, and testing.',
    coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 2,
    order: 3,
    price: 32,
    moduleTitles: ['Routing & Validation', 'Persistence Layer', 'Testing & Reliability'],
  },
  {
    title: 'Customer Discovery Sprint',
    description: 'Run sharper founder interviews, collect real signals, and turn insights into roadmap decisions.',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 3,
    order: 1,
    price: 27,
    moduleTitles: ['Interview Design', 'Pattern Extraction', 'Offer Direction'],
  },
  {
    title: 'SaaS Metrics Playbook',
    description: 'Make sense of retention, activation, churn, and growth metrics without drowning in dashboards.',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 3,
    order: 2,
    price: 31,
    moduleTitles: ['Core Metrics', 'Reporting Cadence', 'Decision Triggers'],
  },
  {
    title: 'No-Code MVP Builder',
    description: 'Go from concept to testable MVP with a practical stack and launch plan for early traction.',
    coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 3,
    order: 3,
    price: 18,
    moduleTitles: ['MVP Scope', 'Tool Stack', 'Feedback to Iteration'],
  },
  {
    title: 'Meditation Habit Builder',
    description: 'Build a consistent meditation practice with prompts, routines, and accountability that actually stick.',
    coverImage: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 4,
    order: 1,
    price: 0,
    moduleTitles: ['Daily Ritual Setup', 'Attention Training', 'Reflection & Consistency'],
  },
  {
    title: 'Intentional Journaling',
    description: 'Use journaling frameworks to clarify priorities, regulate stress, and notice your growth in real time.',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 4,
    order: 2,
    price: 14,
    moduleTitles: ['Prompt Systems', 'Pattern Review', 'Decision Clarity'],
  },
  {
    title: 'Energy & Focus Reset',
    description: 'Reduce mental clutter and structure your days around recovery, focus windows, and realistic routines.',
    coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 4,
    order: 3,
    price: 17,
    moduleTitles: ['Energy Audit', 'Focus Rituals', 'Sustainable Planning'],
  },
  {
    title: 'Portrait Lighting Lab',
    description: 'Understand natural and artificial light so your portraits feel controlled, flattering, and intentional.',
    coverImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 5,
    order: 1,
    price: 26,
    moduleTitles: ['Lighting Fundamentals', 'Indoor Setups', 'Outdoor Direction'],
  },
  {
    title: 'Street Photography Field Guide',
    description: 'Develop confidence, timing, and a documentary eye for stronger images in fast-moving environments.',
    coverImage: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 5,
    order: 2,
    price: 23,
    moduleTitles: ['Observation Skills', 'Shooting in Motion', 'Story Selection'],
  },
  {
    title: 'Editing Workflow in Lightroom',
    description: 'Create a clean editing pipeline from import to export with presets, culling systems, and final polish.',
    coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1600&q=80',
    communityIndex: 5,
    order: 3,
    price: 28,
    moduleTitles: ['Import & Culling', 'Color Workflow', 'Export & Delivery'],
  },
];

function createGeneratedModules(courseTitle, moduleTitles) {
  return moduleTitles.map((moduleTitle, moduleIndex) => ({
    title: moduleTitle,
    lessons: [
      {
        title: `${moduleTitle}: Core Principles`,
        type: 'TEXT',
        content: `Learn the core principles behind ${moduleTitle.toLowerCase()} inside ${courseTitle}. This lesson focuses on fundamentals, decision-making, and common mistakes to avoid early.`,
      },
      {
        title: `${moduleTitle}: Guided Walkthrough`,
        type: 'VIDEO',
        videoUrl: DEFAULT_VIDEO_URL,
        content: `Follow a practical walkthrough for ${moduleTitle.toLowerCase()} with examples you can apply immediately after watching.`,
      },
      {
        title: `${moduleTitle}: Implementation Sprint`,
        type: moduleIndex === moduleTitles.length - 1 ? 'QUIZ' : 'TEXT',
        content: `Use this implementation sprint to turn ${moduleTitle.toLowerCase()} into a repeatable system and document what you will improve next.`,
      },
    ],
  }));
}

const ALL_COURSES = [
  ...COURSES,
  ...EXTRA_COURSE_BLUEPRINTS.map(({ moduleTitles, ...course }) => ({
    ...course,
    status: 'PUBLISHED',
    published: true,
    modules: createGeneratedModules(course.title, moduleTitles),
  })),
];

const LEVELS = [
  { name: 'Newcomer', minPoints: 0, levelNumber: 1, unlockDescription: 'Access community feed', order: 1 },
  { name: 'Active', minPoints: 50, levelNumber: 2, unlockDescription: 'Unlock priority Q&A', order: 2 },
  { name: 'Contributor', minPoints: 150, levelNumber: 3, unlockDescription: 'Featured contributor badge', order: 3 },
  { name: 'Expert', minPoints: 500, levelNumber: 4, unlockDescription: 'Access private workshops', order: 4 },
  { name: 'Legend', minPoints: 1000, levelNumber: 5, unlockDescription: 'Top leaderboard frame', order: 5 },
];

const POST_DATA = [
  {
    title: 'Just hit 1,000 subscribers!',
    content: 'After 3 months of consistent posting and following the framework from Module 2, I finally crossed 1,000 subscribers. The content-that-grows lesson was a game changer for me.\n\nMy biggest takeaway: consistency beats perfection every single time. I was spending days on each piece of content before. Now I publish 3x per week and the growth has been exponential.\n\nThank you to everyone in this community for the support!',
    type: 'POST',
    category: 'WINS',
  },
  {
    title: 'Weekly Accountability Thread',
    content: 'What did you accomplish this week? Share your wins, no matter how small.\n\nI will start: I launched my first digital product (a Notion template) and made $127 in the first 48 hours. Not life-changing money, but proof that this works.',
    type: 'DISCUSSION',
    category: 'GENERAL',
    pinned: true,
  },
  {
    title: 'Best tools for community management?',
    content: 'I am setting up my own community and looking for recommendations on:\n- Email marketing platform\n- Community hosting (besides Makteb of course)\n- Content scheduling tools\n- Analytics dashboards\n\nWhat is working for you all?',
    type: 'QUESTION',
    category: 'WORKFLOW_PRODUCTIVITY',
  },
  {
    title: 'How I went from 0 to $5k/mo in 6 months',
    content: 'Here is the exact breakdown of my journey:\n\nMonth 1-2: Built audience on Twitter (0 to 2k followers)\nMonth 3: Launched a free community (got 200 members)\nMonth 4: Created my first paid course ($29)\nMonth 5: Added coaching ($200/session)\nMonth 6: Hit $5k MRR\n\nThe key was not trying to monetize too early. I spent the first 2 months just providing value and understanding what my audience actually wanted.',
    type: 'POST',
    category: 'WINS',
  },
  {
    title: 'Introduce yourself here!',
    content: 'New to the community? Tell us about yourself!\n\n- What do you do?\n- What are you hoping to learn?\n- What is your biggest challenge right now?\n\nCan not wait to meet everyone.',
    type: 'DISCUSSION',
    category: 'INTRODUCE_YOURSELF',
    pinned: true,
  },
  {
    title: 'Landing page feedback request',
    content: 'Just redesigned my landing page and would love some honest feedback. I am going for a clean, minimal look with strong copy.\n\nMain changes:\n- Simplified the hero section\n- Added social proof above the fold\n- Reduced the number of CTAs\n- Made the pricing section clearer\n\nWhat do you think?',
    type: 'POST',
    category: 'BRANDING_CLIENTS',
  },
  {
    title: 'The power of showing up daily',
    content: 'Something I have noticed after being in this community for 3 months: the people who show up every day, even just for 10 minutes, are the ones making the most progress.\n\nIt is not about the grand gestures. It is about the daily compound effect.\n\nWho else has noticed this?',
    type: 'DISCUSSION',
    category: 'GENERAL',
  },
  {
    title: 'Resources that changed my perspective',
    content: 'Sharing some resources that had a huge impact on my creator journey:\n\n1. "Show Your Work" by Austin Kleon\n2. "The Minimalist Entrepreneur" by Sahil Lavingia\n3. "Building a Second Brain" by Tiago Forte\n\nAll three shifted how I think about creating and sharing online.',
    type: 'POST',
    category: 'WORKFLOW_PRODUCTIVITY',
  },
];

const COMMENTS_DATA = [
  'Congratulations! This is incredible progress. Keep going!',
  'Love seeing wins like this in the community. Proves the system works.',
  'This is so inspiring. I am on month 2 right now and this gives me hope.',
  'I use ConvertKit for email and Notion for project management. Both have been game changers.',
  'Great question! I have been using Buffer for scheduling and it has saved me hours each week.',
  'Wow, $5k in 6 months is impressive. What was your content strategy?',
  'The compound effect is real. I have been showing up for 90 days straight and the difference is night and day.',
  'Thanks for sharing these resources! Just ordered "Show Your Work".',
  'Would love to see the landing page! Can you share a link?',
  'Welcome to everyone new! This community changed my life.',
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
    update: { name, role, avatar, bio, provider: 'LOCAL', passwordHash },
    create: { email, name, role, avatar, bio, provider: 'LOCAL', passwordHash },
  });
}

async function upsertPaymentByProviderRef(data) {
  const existing = await prisma.payment.findFirst({ where: { providerTxId: data.providerTxId } });
  if (existing) return prisma.payment.update({ where: { id: existing.id }, data });
  return prisma.payment.create({ data });
}

async function seed() {
  // Create users
  const users = await Promise.all(USERS.map((u) => upsertLocalUser(u)));
  const [owner, admin, moderator, ...regularMembers] = users;

  // Create communities
  const communities = [];
  for (const communityData of COMMUNITIES) {
    const community = await prisma.community.upsert({
      where: { slug: communityData.slug },
      update: { ...communityData, creatorId: owner.id },
      create: { ...communityData, creatorId: owner.id },
    });
    communities.push(community);
  }

  // Add members to first community (main one)
  const mainCommunity = communities[0];
  const memberRoles = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER', 'MEMBER', 'MEMBER', 'MEMBER', 'MEMBER', 'MEMBER', 'MEMBER'];

  for (let i = 0; i < users.length; i++) {
    await prisma.communityMember.upsert({
      where: { userId_communityId: { userId: users[i].id, communityId: mainCommunity.id } },
      update: { role: memberRoles[i] || 'MEMBER', status: 'ACTIVE' },
      create: { userId: users[i].id, communityId: mainCommunity.id, role: memberRoles[i] || 'MEMBER', status: 'ACTIVE' },
    });
  }

  // Add some members to other communities
  for (let ci = 1; ci < communities.length; ci++) {
    const membersToAdd = users.slice(0, 3 + ci);
    for (const u of membersToAdd) {
      await prisma.communityMember.upsert({
        where: { userId_communityId: { userId: u.id, communityId: communities[ci].id } },
        update: { role: u.id === owner.id ? 'OWNER' : 'MEMBER', status: 'ACTIVE' },
        create: { userId: u.id, communityId: communities[ci].id, role: u.id === owner.id ? 'OWNER' : 'MEMBER', status: 'ACTIVE' },
      });
    }
  }

  // Levels for main community
  await prisma.level.deleteMany({ where: { communityId: mainCommunity.id } });
  await prisma.level.createMany({
    data: LEVELS.map((level) => ({ ...level, communityId: mainCommunity.id })),
  });

  // Plans & subscriptions
  const monthlyPlan = await prisma.plan.upsert({
    where: { communityId_name: { communityId: mainCommunity.id, name: 'Pro Monthly' } },
    update: { priceCents: 4900, currency: 'USD', interval: 'MONTH', isActive: true },
    create: { communityId: mainCommunity.id, name: 'Pro Monthly', priceCents: 4900, currency: 'USD', interval: 'MONTH', isActive: true },
  });

  const ownerSub = await prisma.subscription.upsert({
    where: { planId_userId: { planId: monthlyPlan.id, userId: owner.id } },
    update: { status: 'ACTIVE', currentPeriodEnd: daysFromNow(30) },
    create: { planId: monthlyPlan.id, userId: owner.id, status: 'ACTIVE', currentPeriodEnd: daysFromNow(30) },
  });

  // Courses
  const createdCourses = [];
  for (const courseData of ALL_COURSES) {
    const communityForCourse = communities[courseData.communityIndex];
    const existing = await prisma.course.findFirst({
      where: { communityId: communityForCourse.id, title: courseData.title },
    });
    const coursePayload = {
      title: courseData.title,
      description: courseData.description,
      coverImage: courseData.coverImage,
      price: courseData.price ?? null,
      status: courseData.status,
      published: courseData.published,
      order: courseData.order,
      communityId: communityForCourse.id,
      creatorId: owner.id,
    };

    const course = existing
      ? await prisma.course.update({ where: { id: existing.id }, data: coursePayload })
      : await prisma.course.create({ data: coursePayload });

    // Delete old modules
    await prisma.module.deleteMany({ where: { courseId: course.id } });

    // Create modules and lessons
    for (let mi = 0; mi < courseData.modules.length; mi++) {
      const modData = courseData.modules[mi];
      const mod = await prisma.module.create({
        data: { courseId: course.id, title: modData.title, order: mi },
      });

      for (let li = 0; li < modData.lessons.length; li++) {
        const lessonData = modData.lessons[li];
        await prisma.lesson.create({
          data: {
            moduleId: mod.id,
            title: lessonData.title,
            type: lessonData.type,
            content: lessonData.content,
            videoUrl: lessonData.videoUrl || null,
            order: li,
          },
        });
      }
    }

    createdCourses.push(course);
  }

  // Enrollments
  const mainCourse = createdCourses[0];
  const mainCourseData = await prisma.course.findUnique({
    where: { id: mainCourse.id },
    include: { modules: { include: { lessons: true } } },
  });
  const allLessons = mainCourseData.modules.flatMap((m) => m.lessons);

  for (let i = 1; i < Math.min(users.length, 8); i++) {
    const completedCount = Math.max(0, Math.floor(allLessons.length * (1 - i * 0.12)));
    const completedLessons = allLessons.slice(0, completedCount).map((l) => l.id);
    const progress = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: users[i].id, courseId: mainCourse.id } },
      update: { progress, completedLessons },
      create: { userId: users[i].id, courseId: mainCourse.id, progress, completedLessons },
    });

    for (const lessonId of completedLessons) {
      await prisma.lessonProgress.upsert({
        where: { lessonId_userId: { lessonId, userId: users[i].id } },
        update: { status: 'COMPLETED', completedAt: daysFromNow(-Math.floor(Math.random() * 14)) },
        create: { lessonId, userId: users[i].id, status: 'COMPLETED', completedAt: daysFromNow(-Math.floor(Math.random() * 14)) },
      });
    }
  }

  // Posts
  const postTitles = POST_DATA.map((p) => p.title);
  await prisma.post.deleteMany({
    where: { communityId: mainCommunity.id, title: { in: postTitles } },
  });

  const createdPosts = [];
  for (let i = 0; i < POST_DATA.length; i++) {
    const authorIndex = i % users.length;
    const post = await prisma.post.create({
      data: {
        communityId: mainCommunity.id,
        authorId: users[authorIndex].id,
        ...POST_DATA[i],
        pinned: POST_DATA[i].pinned || false,
      },
    });
    createdPosts.push(post);
  }

  // Comments
  for (let i = 0; i < createdPosts.length; i++) {
    const numComments = 2 + (i % 3);
    for (let j = 0; j < numComments; j++) {
      const commentIdx = (i * 3 + j) % COMMENTS_DATA.length;
      const authorIdx = (i + j + 1) % users.length;
      const comment = await prisma.comment.create({
        data: {
          postId: createdPosts[i].id,
          authorId: users[authorIdx].id,
          content: COMMENTS_DATA[commentIdx],
        },
      });

      // Add a reply to some comments
      if (j === 0) {
        const replyAuthorIdx = (i + j + 2) % users.length;
        await prisma.comment.create({
          data: {
            postId: createdPosts[i].id,
            authorId: users[replyAuthorIdx].id,
            parentId: comment.id,
            content: 'Thanks for sharing! This resonates with me a lot.',
          },
        });
      }
    }
  }

  // Likes
  for (let i = 0; i < createdPosts.length; i++) {
    const numLikes = 2 + (i % 5);
    for (let j = 0; j < numLikes && j < users.length; j++) {
      const userIdx = (i + j) % users.length;
      await prisma.like.upsert({
        where: { postId_userId: { postId: createdPosts[i].id, userId: users[userIdx].id } },
        update: {},
        create: { postId: createdPosts[i].id, userId: users[userIdx].id },
      });
    }
  }

  // Events
  const eventTitles = ['Weekly Live Q&A', 'Portfolio Review', 'Content Strategy Workshop', 'Networking Session'];
  await prisma.event.deleteMany({
    where: { communityId: mainCommunity.id, title: { in: eventTitles } },
  });

  const eventA = await prisma.event.create({
    data: {
      communityId: mainCommunity.id,
      createdBy: owner.id,
      title: 'Weekly Live Q&A',
      description: 'Ask anything about building your creator business. Alex answers live.',
      startAt: daysFromNow(2, 17),
      endAt: daysFromNow(2, 18),
      meetingUrl: 'https://meet.example.com/live-qna',
    },
  });
  const eventB = await prisma.event.create({
    data: {
      communityId: mainCommunity.id,
      createdBy: admin.id,
      title: 'Portfolio Review',
      description: 'Submit your portfolio or landing page for live feedback.',
      startAt: daysFromNow(5, 19),
      endAt: daysFromNow(5, 20),
      meetingUrl: 'https://meet.example.com/portfolio-review',
    },
  });
  await prisma.event.create({
    data: {
      communityId: mainCommunity.id,
      createdBy: owner.id,
      title: 'Content Strategy Workshop',
      description: 'Deep-dive into content strategy frameworks that drive growth.',
      startAt: daysFromNow(9, 18),
      endAt: daysFromNow(9, 19),
      meetingUrl: 'https://meet.example.com/workshop',
    },
  });

  for (const u of users.slice(0, 5)) {
    await prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId: eventA.id, userId: u.id } },
      update: { status: 'GOING', respondedAt: new Date() },
      create: { eventId: eventA.id, userId: u.id, status: 'GOING' },
    });
  }

  // Points
  await prisma.pointEntry.deleteMany({
    where: { communityId: mainCommunity.id, reason: { startsWith: '[SEED]' } },
  });

  const pointEntries = [];
  const sourceTypes = ['POST', 'COMMENT', 'LESSON', 'EVENT', 'MANUAL'];
  for (let i = 0; i < users.length; i++) {
    const basePoints = 50 + Math.floor(Math.random() * 200);
    const numEntries = 2 + (i % 4);
    for (let j = 0; j < numEntries; j++) {
      pointEntries.push({
        userId: users[i].id,
        communityId: mainCommunity.id,
        sourceType: sourceTypes[j % sourceTypes.length],
        sourceId: null,
        amount: Math.floor(basePoints / numEntries) + j * 3,
        reason: `[SEED] Activity ${j + 1}`,
      });
    }
  }
  await prisma.pointEntry.createMany({ data: pointEntries });

  // Payments
  await upsertPaymentByProviderRef({
    userId: regularMembers[0].id,
    type: 'COURSE',
    referenceId: mainCourse.id,
    subscriptionId: ownerSub.id,
    amount: 49,
    currency: 'USD',
    provider: 'STRIPE',
    status: 'SUCCEEDED',
    providerTxId: 'seed-tx-course-001',
  });
  await upsertPaymentByProviderRef({
    userId: owner.id,
    type: 'COMMUNITY',
    referenceId: mainCommunity.id,
    subscriptionId: ownerSub.id,
    amount: 49,
    currency: 'USD',
    provider: 'FLOUCI',
    status: 'COMPLETED',
    providerTxId: 'seed-tx-community-001',
  });

  // Notifications
  await prisma.notification.deleteMany({
    where: { title: { startsWith: '[SEED]' } },
  });
  await prisma.notification.createMany({
    data: [
      { userId: owner.id, title: '[SEED] New event scheduled', body: 'Weekly Live Q&A is scheduled in 2 days.', link: `/community/${mainCommunity.slug}` },
      { userId: regularMembers[0].id, title: '[SEED] Course progress', body: 'You completed 5 lessons in Creator Business Blueprint!', link: `/course/${mainCourse.id}/learn` },
      { userId: regularMembers[1].id, title: '[SEED] New post in community', body: 'Alex shared a new post about growth strategies.', link: `/community/${mainCommunity.slug}` },
    ],
  });

  console.log('\nSeed completed successfully!\n');
  console.log('Credentials (all passwords: DemoPass123!)');
  for (const u of USERS) {
    console.log(`  ${u.name}: ${u.email}`);
  }
  console.log(`\nCommunities: ${communities.length}`);
  console.log(`Courses: ${createdCourses.length}`);
  console.log(`Posts: ${createdPosts.length}`);
  console.log(`Users: ${users.length}`);
  console.log('\nURLs');
  console.log(`  Discover: ${env.clientUrl}/discover`);
  console.log(`  Main community: ${env.clientUrl}/community/${mainCommunity.slug}`);
  console.log(`  Course: ${env.clientUrl}/course/${mainCourse.id}`);
  console.log(`  Course learn: ${env.clientUrl}/course/${mainCourse.id}/learn\n`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
