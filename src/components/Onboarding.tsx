import React, { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'program-beats-onboarded';

interface OnboardingStep {
  title: string;
  description: string;
  targetSelector: string; // CSS selector for the highlighted element
  position: 'bottom' | 'top' | 'left' | 'right';
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to Program Beats!',
    description:
      'An AI-powered DAW for creating beats and music right in your browser. Let us show you around.',
    targetSelector: '.transport-bar',
    position: 'bottom',
  },
  {
    title: 'Timeline',
    description:
      'This is your timeline. Tracks are rows and each cell is a bar. Click a cell to create a clip, then edit its pattern. Drag clips to rearrange them.',
    targetSelector: '.main-area',
    position: 'top',
  },
  {
    title: 'AI Chat',
    description:
      'Chat with the AI to generate patterns, get suggestions, or ask for help. Describe what you want and it will create Strudel code for you.',
    targetSelector: '.chat-panel',
    position: 'left',
  },
  {
    title: 'Transport Controls',
    description:
      'Press Play to hear your creation. Adjust BPM, enable the metronome, use Tap Tempo, and access export and genre features from here.',
    targetSelector: '.transport-center',
    position: 'bottom',
  },
  {
    title: 'Get Started!',
    description:
      'Try clicking "Genres" in the toolbar for preset patterns, or "Surprise Me" for AI-generated beats. You can also add tracks from the sidebar and start building.',
    targetSelector: '.transport-right',
    position: 'bottom',
  },
];

export const Onboarding: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const onboarded = localStorage.getItem(STORAGE_KEY);
    if (!onboarded) {
      // Short delay so the DOM is ready
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    const step = STEPS[currentStep];
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect(rect);
    } else {
      setSpotlightRect(null);
    }
  }, [visible, currentStep]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  if (!visible) return null;

  const step = STEPS[currentStep];

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const gap = 16;
    const style: React.CSSProperties = { position: 'fixed' };

    switch (step.position) {
      case 'bottom':
        style.top = spotlightRect.bottom + gap;
        style.left = spotlightRect.left + spotlightRect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'top':
        style.bottom = window.innerHeight - spotlightRect.top + gap;
        style.left = spotlightRect.left + spotlightRect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
        style.top = spotlightRect.top + spotlightRect.height / 2;
        style.right = window.innerWidth - spotlightRect.left + gap;
        style.transform = 'translateY(-50%)';
        break;
      case 'right':
        style.top = spotlightRect.top + spotlightRect.height / 2;
        style.left = spotlightRect.right + gap;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  return (
    <div className="onboarding-overlay">
      {/* Dark overlay with spotlight cutout */}
      {spotlightRect && (
        <svg className="onboarding-svg" width="100%" height="100%">
          <defs>
            <mask id="onboarding-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={spotlightRect.left - 6}
                y={spotlightRect.top - 6}
                width={spotlightRect.width + 12}
                height={spotlightRect.height + 12}
                rx="8"
                ry="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#onboarding-mask)"
          />
        </svg>
      )}

      {/* Spotlight border highlight */}
      {spotlightRect && (
        <div
          className="onboarding-spotlight"
          style={{
            top: spotlightRect.top - 6,
            left: spotlightRect.left - 6,
            width: spotlightRect.width + 12,
            height: spotlightRect.height + 12,
          }}
        />
      )}

      {/* Tooltip */}
      <div className="onboarding-tooltip" style={getTooltipStyle()}>
        <div className="onboarding-step-indicator">
          {currentStep + 1} / {STEPS.length}
        </div>
        <h3 className="onboarding-title">{step.title}</h3>
        <p className="onboarding-description">{step.description}</p>
        <div className="onboarding-buttons">
          {currentStep > 0 && (
            <button className="btn btn-sm onboarding-btn-back" onClick={handleBack}>
              Back
            </button>
          )}
          <button className="btn btn-sm onboarding-btn-skip" onClick={handleComplete}>
            Skip
          </button>
          <button className="btn btn-sm btn-accent onboarding-btn-next" onClick={handleNext}>
            {currentStep < STEPS.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
};
