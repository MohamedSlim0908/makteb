import { Link } from 'react-router-dom';
import { CreatorCarousel } from './CreatorCarousel';
import { CREATOR_SHOWCASES } from './mockCreatorData';

export function CreatorHero() {
  return (
    <section className="relative px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(148,163,184,0.2),transparent_60%)]" />

      <div className="relative mx-auto max-w-[1040px] text-center">
        <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-sm font-bold text-white">
            M
          </span>
          <span className="text-lg font-semibold tracking-tight text-gray-900">makteb creators</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-balance text-[2.1rem] font-bold leading-tight text-gray-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
          Turn your knowledge into a thriving paid community
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-balance text-lg text-gray-600 sm:mt-4 sm:text-[1.35rem]">
          Create courses, engage members, and grow recurring revenue
        </p>

        <CreatorCarousel creators={CREATOR_SHOWCASES} />

        <div className="mt-8 sm:mt-9">
          <Link
            to="/creator/pricing"
            className="inline-flex w-full max-w-[440px] items-center justify-center rounded-xl border border-[#ddb44f] bg-[#e8c569] px-8 py-4 text-base font-bold tracking-wide text-gray-900 shadow-[0_10px_26px_rgba(193,153,60,0.26)] transition-all hover:-translate-y-0.5 hover:bg-[#e2bd59]"
          >
            START CREATING
          </Link>
        </div>

        <p className="mx-auto mt-4 max-w-xl text-sm text-gray-500">
          No coding required. Courses, community, and payments in one place.
        </p>
      </div>
    </section>
  );
}
