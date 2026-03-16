'use client';

/**
 * Intake Wizard — Multi-step production setup flow
 *
 * Collects all production data in local state across 5 steps,
 * then creates everything in batch on "Launch Production."
 *
 * Steps: Show Setup > Cast > Crew > Asset Types > Review & Launch
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShowSetupStep } from './step-show-setup';
import { CastRosterStep } from './step-cast-roster';
import { CrewRosterStep } from './step-crew-roster';
import { AssetTypesStep } from './step-asset-types';
import { ReviewLaunchStep } from './step-review-launch';
import { createEmptyIntakeState } from './intake-types';
import type { IntakeState } from './intake-types';

interface IntakeWizardProps {
  universeId: string;
}

const STEPS = [
  { label: 'Show', description: 'Tell us about your production' },
  { label: 'Cast', description: 'Who is in your cast?' },
  { label: 'Crew', description: 'Who is on your crew?' },
  { label: 'Tracking', description: 'How do you track progress?' },
  { label: 'Launch', description: 'Review and launch' },
] as const;

export function IntakeWizard({ universeId }: IntakeWizardProps) {
  const router = useRouter();
  const [state, setState] = useState<IntakeState>(createEmptyIntakeState);

  const currentStep = state.currentStep;

  const updateState = useCallback((partial: Partial<IntakeState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  function goNext() {
    if (currentStep < STEPS.length - 1) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }

  function goBack() {
    if (currentStep > 0) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }

  function handleLaunchComplete() {
    router.push(`/universe/${universeId}/production`);
  }

  // Validation: can we proceed to the next step?
  function canProceed(): boolean {
    switch (currentStep) {
      case 0:
        return state.show.name.trim().length > 0;
      case 1:
        return true; // Cast is optional (can add later)
      case 2:
        return true; // Crew is optional
      case 3:
        return state.assetTypes.some((t) => t.enabled);
      case 4:
        return true;
      default:
        return false;
    }
  }

  return (
    <div className="min-h-screen bg-surface-primary text-gray-100">
      {/* Header */}
      <header className="border-b border-panel-border bg-surface-secondary px-6 py-4">
        <h1 className="text-lg font-medium text-gray-200">Set Up Production</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {STEPS[currentStep].description}
        </p>
      </header>

      {/* Step indicator */}
      <div className="border-b border-panel-border bg-surface-secondary px-6 py-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          {STEPS.map((step, i) => {
            const isComplete = i < currentStep;
            const isCurrent = i === currentStep;
            const isFuture = i > currentStep;

            return (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                {i > 0 && (
                  <div
                    className={cn(
                      'h-px flex-1',
                      isComplete ? 'bg-vhs-400' : 'bg-panel-border'
                    )}
                  />
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                      isComplete && 'bg-vhs-400 text-white',
                      isCurrent && 'bg-vhs-400/20 text-vhs-400 ring-2 ring-vhs-400',
                      isFuture && 'bg-surface-tertiary text-gray-600'
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium hidden sm:block',
                      isCurrent ? 'text-gray-200' : 'text-gray-600'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {currentStep === 0 && (
          <ShowSetupStep
            data={state.show}
            onChange={(show) => updateState({ show })}
          />
        )}
        {currentStep === 1 && (
          <CastRosterStep
            cast={state.cast}
            onChange={(cast) => updateState({ cast })}
          />
        )}
        {currentStep === 2 && (
          <CrewRosterStep
            crew={state.crew}
            onChange={(crew) => updateState({ crew })}
          />
        )}
        {currentStep === 3 && (
          <AssetTypesStep
            assetTypes={state.assetTypes}
            onChange={(assetTypes) => updateState({ assetTypes })}
          />
        )}
        {currentStep === 4 && (
          <ReviewLaunchStep
            state={state}
            universeId={universeId}
            onLaunch={handleLaunchComplete}
            onBack={goBack}
          />
        )}
      </div>

      {/* Navigation footer */}
      {currentStep < 4 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-panel-border bg-surface-secondary px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                currentStep === 0
                  ? 'text-gray-700 cursor-not-allowed'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed()}
                className={cn(
                  'px-5 py-2 text-sm font-medium rounded-md transition-colors',
                  canProceed()
                    ? 'bg-vhs-400 text-white hover:bg-vhs-500'
                    : 'bg-surface-tertiary text-gray-600 cursor-not-allowed'
                )}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
