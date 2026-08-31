import { getOnboardingState } from '@/app/actions/onboarding';
import OnboardingFlow from '@/components/OnboardingFlow';

export default async function OnboardingPage() {
  const state = await getOnboardingState();

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-bg-card rounded-3xl shadow-xl border border-border-light overflow-hidden">
        <OnboardingFlow initialState={state} />
      </div>
    </div>
  );
}
