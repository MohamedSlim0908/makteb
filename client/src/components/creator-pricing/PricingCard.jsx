import { FeatureItem } from './FeatureItem';

export function PricingCard({ plan, onSelectPlan }) {
  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-white px-7 py-8 text-center transition-all duration-300 hover:-translate-y-0.5 ${
        plan.highlighted
          ? 'border-gray-300 shadow-[0_20px_45px_rgba(15,23,42,0.12)]'
          : 'border-gray-200 shadow-[0_14px_34px_rgba(15,23,42,0.08)]'
      }`}
    >
      {plan.highlighted && (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e1c570] bg-[#edd07f] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-900">
          Most Popular
        </span>
      )}

      <div className="flex items-end justify-center gap-1">
        <span className="text-5xl font-bold tracking-tight text-gray-900">${plan.price}</span>
        <span className="mb-1 text-2xl font-semibold text-gray-900">{plan.billingPeriod}</span>
      </div>

      <h2 className="mt-3 text-3xl font-semibold text-gray-900">{plan.name}</h2>

      <ul className="mt-7 flex flex-1 flex-col gap-3 text-left">
        {plan.featuresIncluded.map((feature) => (
          <FeatureItem key={`${plan.id}-${feature}`} label={feature} included />
        ))}
        {plan.featuresExcluded.map((feature) => (
          <FeatureItem key={`${plan.id}-${feature}`} label={feature} included={false} />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelectPlan(plan)}
        className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#d8ad45] bg-[#e8c569] text-sm font-bold tracking-wide text-gray-900 shadow-[0_8px_22px_rgba(193,153,60,0.22)] transition-all hover:bg-[#e1bc59] active:scale-[0.99]"
      >
        {plan.ctaText}
      </button>
    </article>
  );
}
