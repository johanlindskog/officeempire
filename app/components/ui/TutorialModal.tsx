// Tutorial Modal - Onboarding guide for new players

"use client";

import { useState } from "react";
import { playClickSound, playDoubleClickSound } from "@/app/utils/sounds";

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
}

interface TutorialModalProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  levelId?: string; // Optional level ID to show level-specific tutorial
}

const LEVEL_1_TUTORIAL: TutorialStep[] = [
  {
    title: "Welcome to Your Consultancy!",
    icon: "👋",
    description: "You're starting a consulting firm! Your goal is to hire employees, acquire clients, and grow your business. Let's learn the basics!",
  },
  {
    title: "Level 1: Pre-Built Office",
    icon: "🎯",
    description: "In this first level, we've set up an office for you with desks, meeting rooms, and amenities. Focus on learning to hire employees and find clients. In Level 2, you'll build your office from scratch!",
  },
  {
    title: "Office Layout",
    icon: "🏢",
    description: "This is your office! You can see desks, meeting rooms, a coffee station, and break table already placed. Click the Build button (top-right) if you want to add more furniture.",
  },
  {
    title: "Hiring Employees",
    icon: "👔",
    description: "Look at the bottom-left panel. Click 'Hire' to recruit employees for $5,000. Each employee costs $5,000/month in salary. They'll automatically be assigned to available desks!",
  },
  {
    title: "Acquiring Clients",
    icon: "🤝",
    description: "Bottom-right panel shows your clients. Click 'Find Client' for $1,000 to get new clients. They pay $2,000-$5,000/month in revenue!",
  },
  {
    title: "Monthly Cycle",
    icon: "📅",
    description: "Every 30 seconds, a new month starts. You'll earn revenue from clients and pay employee salaries. Watch your cash flow in the top-left dashboard!",
  },
  {
    title: "Growing Your Business",
    icon: "📈",
    description: "Once you have 5+ employees, you'll passively acquire clients each month. Balance hiring costs with revenue to grow profitably. Good luck!",
  },
];

const LEVEL_3_TUTORIAL: TutorialStep[] = [
  {
    title: "Welcome to Level 3!",
    icon: "🌟",
    description: "Congratulations on making it to Level 3: The Growing Firm! This level introduces a new challenge: Employee Happiness. Let's learn how it works!",
  },
  {
    title: "Employee Happiness System",
    icon: "😊",
    description: "Your employees now have a happiness level (0-100%). Check the dashboard - you'll see average happiness displayed with an emoji. Your goal: maintain 65% average happiness!",
  },
  {
    title: "Desk Quality Matters",
    icon: "💺",
    description: "Better desks = happier employees!\n\n• Basic Desk: +0 happiness\n• Premium Desk: +10 happiness\n• Executive Desk: +20 happiness\n• Standing Desk: +15 happiness\n\nInvest in quality furniture!",
  },
  {
    title: "Amenities Boost Happiness",
    icon: "☕",
    description: "Place amenities near desks for bonus happiness:\n\n• Coffee Machine: +10 (10 tiles range)\n• Break Area: +15 (15 tiles range)\n• Meeting Room: +8 (12 tiles range)\n• Water Cooler: +5 (8 tiles range)\n\nStrategic placement is key!",
  },
  {
    title: "Unhappy Employees Quit!",
    icon: "⚠️",
    description: "Watch out! Unhappy employees might quit:\n\n• 60%+ happiness: Safe, won't quit\n• 40-59%: 5% chance to quit per month\n• 20-39%: 15% chance to quit per month\n• <20%: 30% chance to quit per month\n\nKeep them happy!",
  },
  {
    title: "Office Layout Strategy",
    icon: "🎯",
    description: "Plan your office wisely! Group desks around coffee machines and break areas. Use premium desks for important employees. Remember: amenity bonuses only apply once per type!",
  },
  {
    title: "Level 3 Goals",
    icon: "🏆",
    description: "To complete Level 3:\n\n✓ Hire 20 employees\n✓ Acquire 40 clients\n✓ Maintain 65% average happiness\n\nBalance growth with employee satisfaction. Good luck!",
  },
];

export default function TutorialModal({
  isVisible,
  onComplete,
  onSkip,
  levelId = "level_1",
}: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isVisible) return null;

  // Select tutorial steps based on level
  const TUTORIAL_STEPS = levelId === "level_3" ? LEVEL_3_TUTORIAL : LEVEL_1_TUTORIAL;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    playClickSound();
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    playClickSound();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    playDoubleClickSound();
    onSkip();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 20,
      }}
      onClick={(e) => {
        // Close if clicking backdrop
        if (e.target === e.currentTarget) {
          handleSkip();
        }
      }}
    >
      <div
        className="rct-frame"
        style={{
          maxWidth: 600,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="rct-titlebar">
          <span>
            📚 Tutorial ({currentStep + 1}/{TUTORIAL_STEPS.length})
          </span>
          <button className="rct-close" onClick={handleSkip}>
            ×
          </button>
        </div>

        {/* Content */}
        <div
          className="rct-panel"
          style={{
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            minHeight: 300,
          }}
        >
          {/* Step indicator dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor:
                    index === currentStep
                      ? "var(--rct-text-light)"
                      : "rgba(255, 255, 255, 0.3)",
                  transition: "background-color 0.2s",
                }}
              />
            ))}
          </div>

          {/* Icon */}
          <div
            style={{
              fontSize: 64,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {step.icon}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 24,
              fontWeight: "bold",
              textAlign: "center",
              color: "var(--rct-text-light)",
              marginBottom: 8,
            }}
          >
            {step.title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              textAlign: "center",
              color: "var(--rct-text-dark)",
              flex: 1,
            }}
          >
            {step.description}
          </div>

          {/* Navigation buttons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 16,
            }}
          >
            {currentStep > 0 && (
              <button
                className="rct-button"
                onClick={handlePrevious}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                ← Previous
              </button>
            )}
            <button
              className="rct-button"
              onClick={handleNext}
              style={{
                flex: currentStep === 0 ? 1 : 2,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: "bold",
                backgroundColor: isLastStep ? "#16a34a" : undefined,
              }}
            >
              {isLastStep ? "Start Playing! 🚀" : "Next →"}
            </button>
          </div>

          {/* Skip button */}
          {!isLastStep && (
            <button
              className="rct-button"
              onClick={handleSkip}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                backgroundColor: "transparent",
                border: "1px solid var(--rct-border)",
                opacity: 0.7,
              }}
            >
              Skip Tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
