import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CreatorCard } from './CreatorCard';

function getWrappedIndex(index, length) {
  return ((index % length) + length) % length;
}

export function CreatorCarousel({ creators }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = creators.length;

  const activeCreator = creators[activeIndex];
  const previousCreator = creators[getWrappedIndex(activeIndex - 1, total)];
  const nextCreator = creators[getWrappedIndex(activeIndex + 1, total)];

  const badgeLines = useMemo(
    () => activeCreator.statBadgeText.split('\n').filter(Boolean),
    [activeCreator.statBadgeText]
  );

  function goPrevious() {
    setActiveIndex((prev) => getWrappedIndex(prev - 1, total));
  }

  function goNext() {
    setActiveIndex((prev) => getWrappedIndex(prev + 1, total));
  }

  return (
    <div className="mt-10 sm:mt-12">
      <div className="relative mx-auto flex w-full max-w-[980px] items-center justify-center px-4 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute left-0 z-10 hidden w-[240px] -translate-x-4 scale-[0.88] opacity-55 blur-[1.4px] sm:block md:w-[280px] lg:w-[310px]">
          <CreatorCard creator={previousCreator} isPreview />
        </div>

        <div className="pointer-events-none absolute right-0 z-10 hidden w-[240px] translate-x-4 scale-[0.88] opacity-55 blur-[1.4px] sm:block md:w-[280px] lg:w-[310px]">
          <CreatorCard creator={nextCreator} isPreview />
        </div>

        <div className="relative z-20 w-full max-w-[660px] transition-all duration-500">
          <CreatorCard creator={activeCreator} />

          <div className="absolute -right-2 -top-3 rounded-xl bg-[#189b5a] px-3 py-2 text-left text-white shadow-[0_12px_30px_rgba(24,155,90,0.32)] sm:-right-3 sm:-top-4">
            <p className="text-[11px] font-semibold leading-4 sm:text-xs">
              {badgeLines[0] || 'Creator School'}
            </p>
            <p className="mt-0.5 text-xs font-bold leading-4 sm:text-[13px]">
              {badgeLines[1] || 'Growing every month'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={goPrevious}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
          aria-label="Previous creator"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {creators.map((creator, index) => (
            <button
              key={creator.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to ${creator.title}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-5 bg-primary-600' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
          aria-label="Next creator"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
