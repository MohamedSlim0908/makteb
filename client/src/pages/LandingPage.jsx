import { Link } from 'react-router-dom';
import { HiUserGroup, HiAcademicCap, HiStar } from 'react-icons/hi';
import { Button } from '../components/ui/Button';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Build your community. Share your knowledge.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-primary-100">
              Makteb is the platform for Tunisian creators, coaches, and educators. Create vibrant
              communities, deliver structured courses, and grow your audience.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary-700 hover:bg-primary-50">
                  Get Started
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                  Explore Communities
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto mb-16">
            Makteb brings together the tools that creators need to build, engage, and monetize their communities.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 text-primary-600 mb-4">
                <HiUserGroup className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Vibrant Communities</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create spaces where your audience connects, shares, and grows together. Foster meaningful engagement with discussions, events, and member-only content.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 text-primary-600 mb-4">
                <HiAcademicCap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Structured Courses</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Deliver your expertise through well-organized courses. Add lessons, quizzes, and progress tracking to help your students learn effectively.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-100 text-primary-600 mb-4">
                <HiStar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Gamification</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Keep your community motivated with badges, points, and leaderboards. Turn learning and participation into an engaging, rewarding experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            How it works
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto mb-16">
            Get started in three simple steps.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="flex items-center gap-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center">1</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create your account</h3>
              </div>
              <p className="mt-3 ml-14 text-gray-600 dark:text-gray-400">
                Sign up in seconds. Connect with Google or Facebook for a quick start.
              </p>
            </div>
            <div className="relative">
              <div className="flex items-center gap-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center">2</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Build your community</h3>
              </div>
              <p className="mt-3 ml-14 text-gray-600 dark:text-gray-400">
                Set up your space, invite members, and start sharing your content.
              </p>
            </div>
            <div className="relative">
              <div className="flex items-center gap-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center">3</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grow and thrive</h3>
              </div>
              <p className="mt-3 ml-14 text-gray-600 dark:text-gray-400">
                Engage your audience with courses, discussions, and gamification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to build your community?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Join Makteb today and start sharing your knowledge with the world.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
