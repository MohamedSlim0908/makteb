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
  { step: '1', title: 'Sign up for free', description: 'Create your account in seconds.' },
  { step: '2', title: 'Join a community', description: 'Discover communities that match your interests.' },
  { step: '3', title: 'Start learning', description: 'Access courses, participate, and track your progress.' },
];

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
              Your community
              <br />
              platform for learning
            </h1>

            <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
              Bring your community, courses, and discussions together in one place.
              Build something meaningful.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={user ? '/discover' : '/register'}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-lg font-semibold text-base hover:bg-black transition-colors"
              >
                {user ? 'Explore Communities' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-gray-700 rounded-lg font-semibold text-base border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Browse Communities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything you need
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              A complete platform for community-driven learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Get started in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {STEPS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-[700px] mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to start?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of learners and creators. It's free to get started.
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
      <footer className="bg-gray-950 text-gray-400 py-8">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
