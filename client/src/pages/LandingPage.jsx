import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, MessageSquare, Trophy, Users, Zap, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const FEATURES = [
  {
    icon: Users,
    title: 'Thriving Communities',
    description: 'Join or create communities around any topic. Public or private, free or paid.',
  },
  {
    icon: BookOpen,
    title: 'Structured Courses',
    description: 'Learn through organized modules and lessons with video, text, and quizzes.',
  },
  {
    icon: MessageSquare,
    title: 'Rich Discussions',
    description: 'Engage in meaningful conversations with posts, comments, and real-time updates.',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description: 'Earn points, level up, and climb leaderboards as you learn and contribute.',
  },
  {
    icon: Zap,
    title: 'Real-time Experience',
    description: 'Instant notifications, live updates, and seamless collaboration.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Built with modern security practices. Your data is safe and private.',
  },
];

const STEPS = [
  { step: '01', title: 'Sign up for free', description: 'Create your account in seconds. No credit card required.' },
  { step: '02', title: 'Join a community', description: 'Browse and discover communities that match your interests.' },
  { step: '03', title: 'Start learning', description: 'Access courses, participate in discussions, and track your progress.' },
];

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/30" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative max-w-[1200px] mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              The future of community learning
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
              Learn, grow, and{' '}
              <span className="text-primary-600">connect</span>{' '}
              together
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Makteb brings communities, courses, and discussions together in one platform.
              Join learners and creators building something meaningful.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? '/discover' : '/register'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-lg font-semibold text-base hover:bg-black transition-colors shadow-lg shadow-gray-900/20"
              >
                {user ? 'Explore Communities' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-700 rounded-lg font-semibold text-base border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Browse Communities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-[#f5f5f5]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to learn and teach
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A complete platform designed for community-driven learning experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-card-hover hover:border-gray-300 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get started in minutes
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Three simple steps to start your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-gray-900">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start learning?
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            Join thousands of learners and creators on Makteb. It's free to get started.
          </p>
          <Link
            to={user ? '/discover' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-lg font-semibold text-base hover:bg-gray-100 transition-colors"
          >
            {user ? 'Explore Communities' : 'Create Your Account'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center text-gray-900 font-bold text-sm">
              M
            </div>
            <span className="font-semibold text-white">Makteb</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Makteb. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
