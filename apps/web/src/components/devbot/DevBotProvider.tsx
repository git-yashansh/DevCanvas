import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  useDevBotMessages,
  useSendDevBotMessage,
  useClearDevBotMessages,
} from "@/lib/queries/devbot";
import { DevBotContext, type TourStep, type DevBotContextType } from "./DevBotContext";

interface DevBotProviderProps {
  children: React.ReactNode;
}

export function DevBotProvider({ children }: DevBotProviderProps) {
  const { user, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Chat Panel State
  const [chatOpen, setChatOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: messages = [], isLoading: isLoadingMessages } = useDevBotMessages();
  const sendMessageMutation = useSendDevBotMessage();
  const clearHistoryMutation = useClearDevBotMessages();

  // Tour State
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Define steps
  const steps = useMemo<TourStep[]>(() => {
    const isAdmin = profile?.role === "admin" || user?.email?.toLowerCase() === "kr.yashansh123@gmail.com";
    const rawSteps: TourStep[] = [
      {
        title: "Welcome to DevCanvas 🚀",
        description: "DevCanvas is your AI-powered software engineering workspace. Let's take a quick 1-minute tour to explore the features.",
        placement: "center",
      },
      {
        title: "Home Dashboard",
        description: "The Home Dashboard shows your system health, active developer sessions, and recent system audit logs. It exists to give you quick centralized visibility over all project activities.\n\nExample use case: Check if your server session is active or view recent security log entries.",
        selector: "[data-tour='home']",
        placement: "right",
      },
      {
        title: "AI Workspace Generator",
        description: "Use this to describe a software product idea and automatically generate features, spec briefs, and designs. It exists to automate the initial product planning phase.\n\nExample use case: Type 'Real-time chatting app' to generate a full system planning specification.",
        selector: "[data-tour='workspace']",
        placement: "right",
      },
      {
        title: "Architecture Visualizer",
        description: "This tool lets you model cloud layouts, define servers, APIs, and microservices visually. It exists to design and verify your system design topography.\n\nExample use case: Map out your PostgreSQL read-replicas and verify backend service connections before code generation.",
        selector: "[data-tour='architecture']",
        placement: "right",
      },
      {
        title: "Database Designer",
        description: "This tool allows you to visually design PostgreSQL tables, define columns, and configure entity-relationship links. It exists to generate SQL schemas and migration scripts.\n\nExample use case: Define a 'users' and 'orders' table to establish a one-to-many relationship script.",
        selector: "[data-tour='database']",
        placement: "right",
      },
      {
        title: "API Spec Builder",
        description: "Create API endpoints, define request body structures, configure parameters, and output OpenAPI/REST spec manuals. It exists to streamline frontend-backend communication contracts.\n\nExample use case: Define a '/users/profile' PUT endpoint to validate incoming JSON profiles.",
        selector: "[data-tour='api-generator']",
        placement: "right",
      },
      {
        title: "Technical Documentation",
        description: "Generate complete Markdown guides, user documentation, deployment playbooks, and architectural overviews. It exists to keep your development manuals synced with the code.\n\nExample use case: Compile an onboarding guide for new developers working on your project.",
        selector: "[data-tour='documentation']",
        placement: "right",
      },
      {
        title: "Security Posture Center",
        description: "Inspect your system threat maps, analyze risk levels, and audit against OWASP vulnerabilities. It exists to keep your platform and databases secure.\n\nExample use case: Scan your database schemas for SQL injection risks and verify RLS policies.",
        selector: "[data-tour='security']",
        placement: "right",
      },
      {
        title: "Project Repository Analyzer",
        description: "Connect Git repositories, inspect file structure trees, and replay walkthrough animations. It exists to audit existing code bases.\n\nExample use case: Analyze a React repository to inspect imports and understand code flow.",
        selector: "[data-tour='repo']",
        placement: "right",
      },
      {
        title: "Projects List Hub",
        description: "Manage all generated software engineering artifacts, custom specs, and deployment templates. It exists to store your saved workspace designs.\n\nExample use case: Open a previously saved database design to modify a table schema.",
        selector: "[data-tour='projects']",
        placement: "bottom",
      },
      {
        title: "Support & Customer Care",
        description: "Create support tickets, track active resolutions, and chat with technical support staff. It exists to assist with platform questions.\n\nExample use case: Open a ticket to query about subscription quotas or billing.",
        selector: "[data-tour='support']",
        placement: "right",
      },
      {
        title: "Notifications Hub",
        description: "Provides real-time alert logs regarding security traveler events, account lockouts, and ticket replies. It exists to keep you instantly informed.\n\nExample use case: Receive a notification that a support ticket has been answered.",
        selector: "[data-tour='notifications']",
        placement: "bottom",
      },
    ];

    if (isAdmin) {
      rawSteps.push({
        title: "Admin Control Center",
        description: "Available only to administrators. Track active systems, manage user accounts, review audit logs, and dispatch global notifications.\n\nExample use case: Suspend a compromised account or broadcast a maintenance announcement.",
        selector: "[data-tour='admin']",
        placement: "bottom",
      });
    }

    rawSteps.push(
      {
        title: "Meet DevBot! 🤖",
        description: "I am available globally across your workspace. Ask me any questions, request database definitions, or tell me to navigate to features.\n\nExample use case: Ask 'How do I generate an API?' to receive step-by-step guidance.",
        selector: "#devbot-floating-btn",
        placement: "top",
      },
      {
        title: "You're All Set! 🚀",
        description: "You have completed the tour. Whenever you need assistance, just click on my bubble in the bottom right corner.\n\nClick 'Start Building' to begin!",
        placement: "center",
      }
    );

    return rawSteps;
  }, [profile, user]);

  // Trigger Tour automatically on first-time login
  useEffect(() => {
    if (profile && profile.tour_eligible && !profile.tour_completed && !profile.tour_skipped) {
      setTourActive(true);
      setTourStep(0);
    } else {
      setTourActive(false);
    }
  }, [profile]);

  // Sync route during tour if needed
  useEffect(() => {
    if (!tourActive) return;
    const currentStep = steps[tourStep];
    if (!currentStep?.selector) return;

    const element = document.querySelector(currentStep.selector);
    if (!element) {
      // Graceful verification bypass logic handled inside DevBotTour component
    }
  }, [tourStep, tourActive, steps]);

  const openChat = () => {
    setChatOpen(true);
    setMinimized(false);
  };

  const minimizeChat = () => setMinimized(true);
  const closeChat = () => setChatOpen(false);

  const sendMessage = async (content: string) => {
    setError(null);
    try {
      await sendMessageMutation.mutateAsync({
        content,
        currentRoute: location.pathname,
        userRole: profile?.role || "user",
      });
    } catch (err: any) {
      setError(err.message || "Failed to get AI response.");
    }
  };

  const clearHistory = async () => {
    try {
      await clearHistoryMutation.mutateAsync();
    } catch (err: any) {
      console.warn("Failed to clear devbot history:", err);
    }
  };

  const startTour = () => {
    setTourActive(true);
    setTourStep(0);
  };

  const skipTour = async () => {
    setTourActive(false);
    if (user) {
      await supabase
        .from("profiles")
        .update({ tour_eligible: false, tour_skipped: true })
        .eq("id", user.id);
      refreshProfile();
    }
  };

  const completeTour = async () => {
    setTourActive(false);
    if (user) {
      await supabase
        .from("profiles")
        .update({ tour_eligible: false, tour_completed: true })
        .eq("id", user.id);
      refreshProfile();
    }
  };

  const nextStep = () => {
    if (tourStep < steps.length - 1) {
      setTourStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (tourStep > 0) {
      setTourStep((prev) => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setTourStep(stepIndex);
    }
  };

  const value: DevBotContextType = {
    chatOpen,
    minimized,
    messages,
    isLoadingMessages,
    isSending: sendMessageMutation.isPending,
    error,
    openChat,
    minimizeChat,
    closeChat,
    sendMessage,
    clearHistory,
    tourActive,
    tourStep,
    steps,
    startTour,
    skipTour,
    completeTour,
    nextStep,
    prevStep,
    goToStep,
  };

  return <DevBotContext.Provider value={value}>{children}</DevBotContext.Provider>;
}
