import { createContext, useContext } from "react";
import type { DevBotMessage } from "@/lib/queries/devbot";

export interface TourStep {
  title: string;
  description: string;
  selector?: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
}

export interface DevBotContextType {
  // Chat state
  chatOpen: boolean;
  minimized: boolean;
  messages: DevBotMessage[];
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  openChat: () => void;
  minimizeChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;

  // Tour state
  tourActive: boolean;
  tourStep: number;
  steps: TourStep[];
  startTour: () => void;
  skipTour: () => void;
  completeTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
}

export const DevBotContext = createContext<DevBotContextType | undefined>(undefined);

export function useDevBot() {
  const context = useContext(DevBotContext);
  if (!context) {
    throw new Error("useDevBot must be used within a DevBotProvider");
  }
  return context;
}
