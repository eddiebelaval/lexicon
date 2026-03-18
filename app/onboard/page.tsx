import type { Metadata } from 'next';
import { OnboardingChat } from '@/components/onboarding/onboarding-chat';

export const metadata: Metadata = {
  title: 'Set Up Production | Lexicon',
  description: 'Set up your production with Lexi — your production intelligence manager.',
};

export default function OnboardPage() {
  return <OnboardingChat />;
}
