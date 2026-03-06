import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRICING_PLANS } from './pricingPlans';
import { PricingCard } from './PricingCard';
import { CreateCommunityModal } from './CreateCommunityModal';

export function PricingPage() {
  const navigate = useNavigate();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PRICING_PLANS[0]);

  function handlePlanSelect(plan) {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  }

  function handleCloseModal() {
    setIsCheckoutOpen(false);
  }

  function handleSubmitCheckout(formData) {
    const query = new URLSearchParams();
    query.set('creatorPlan', formData.plan.id);
    query.set('groupName', formData.groupName);
    query.set('privacy', formData.privacyType);
    query.set('onboarding', '1');
    navigate(`/creator/community?${query.toString()}`);
  }

  return (
    <section className="min-h-screen bg-[#f3f4f6] px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto flex w-full max-w-[960px] flex-col items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-sm font-bold text-white">
            M
          </span>
          <span className="text-lg font-semibold tracking-tight text-gray-900">makteb creators</span>
        </div>

        <h1 className="mt-8 text-center text-5xl font-bold tracking-tight text-gray-900">
          Select your plan
        </h1>

        <div className="mt-10 grid w-full max-w-[840px] grid-cols-1 items-stretch gap-5 md:grid-cols-2">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} onSelectPlan={handlePlanSelect} />
          ))}
        </div>
      </div>

      <CreateCommunityModal
        isOpen={isCheckoutOpen}
        plan={selectedPlan}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCheckout}
      />
    </section>
  );
}
