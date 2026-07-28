import { createContext, useContext, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type AIStatus = "idle" | "queued" | "running" | "retrying" | "ratelimited" | "success" | "error" | "timeout";

interface QueueTask<T> {
  id: string;
  key: string; // Used for deduplication
  endpoint: string;
  prompt: string;
  bodyData?: any;
  resolve: (data: T) => void;
  reject: (error: Error) => void;
  signal: AbortSignal;
}

interface AIQueueContextValue {
  enqueue: <T = any>(endpoint: string, prompt: string, bodyData?: any, dedupeKey?: string) => Promise<T>;
  getTaskStatus: (key: string) => AIStatus;
}

const AIQueueContext = createContext<AIQueueContextValue | undefined>(undefined);

export function AIQueueProvider({ children }: { children: React.ReactNode }) {
  const [taskStatuses, setTaskStatuses] = useState<Record<string, AIStatus>>({});
  const queueRef = useRef<QueueTask<any>[]>([]);
  const isProcessingRef = useRef(false);
  const activePromisesRef = useRef<Record<string, Promise<any>>>({});

  const updateStatus = (key: string, status: AIStatus) => {
    setTaskStatuses((prev) => ({ ...prev, [key]: status }));
  };

  const processQueue = async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;

    isProcessingRef.current = true;

    try {
      while (queueRef.current.length > 0) {
        const task = queueRef.current.shift();
        if (!task) break;

        if (task.signal.aborted) {
          updateStatus(task.key, "cancelled" as any);
          task.reject(new Error("Request cancelled by timeout or user."));
          delete activePromisesRef.current[task.key];
          continue;
        }

        updateStatus(task.key, "running");

        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
          if (!token) throw new Error("Supabase API key / authentication token required.");

          // Wrapper for single fetch execution with internal signal
          const fetchPromise = fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${task.endpoint}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ prompt: task.prompt, ...task.bodyData }),
              signal: task.signal,
            }
          );

          const res = await fetchPromise;

          if (res.ok) {
            const data = await res.json();
            updateStatus(task.key, "success");
            task.resolve(data);
          } else {
            const errText = await res.text();
            let statusLabel: AIStatus = "error";
            if (res.status === 429) statusLabel = "ratelimited";
            else if (res.status === 503 || res.status === 504) statusLabel = "retrying";

            updateStatus(task.key, statusLabel);
            throw new Error(`AI Request Failed (${res.status}): ${errText}`);
          }
        } catch (err: any) {
          if (err.name === "AbortError") {
            updateStatus(task.key, "timeout");
            task.reject(new Error("Request timed out after 3 minutes. Please try again."));
          } else {
            updateStatus(task.key, "error");
            task.reject(err);
          }
        } finally {
          // Clear from active promises cache so it can be re-run if needed later
          delete activePromisesRef.current[task.key];
        }
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  const enqueue = useCallback(
    <T = any,>(endpoint: string, prompt: string, bodyData?: any, dedupeKey?: string): Promise<T> => {
      const key = dedupeKey || `${endpoint}-${prompt.slice(0, 30)}`;

      // 1. Deduplication: Return existing active promise if exactly identical request is flying
      if (activePromisesRef.current[key] !== undefined) {
        return activePromisesRef.current[key] as Promise<T>;
      }

      // 2. Timeout Protection: Extended 180 seconds (3 mins) for complex AI generations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const promise = new Promise<T>((resolve, reject) => {
        const cleanupResolve = (data: T) => {
          clearTimeout(timeoutId);
          resolve(data);
        };
        const cleanupReject = (err: Error) => {
          clearTimeout(timeoutId);
          reject(err);
        };

        const task: QueueTask<T> = {
          id: crypto.randomUUID(),
          key,
          endpoint,
          prompt,
          bodyData,
          resolve: cleanupResolve,
          reject: cleanupReject,
          signal: controller.signal,
        };

        queueRef.current.push(task);
        updateStatus(key, "queued");
        processQueue(); // Kick off processor if idle
      });

      activePromisesRef.current[key] = promise;
      return promise;
    },
    []
  );

  const getTaskStatus = useCallback((key: string): AIStatus => {
    return taskStatuses[key] || "idle";
  }, [taskStatuses]);

  return (
    <AIQueueContext.Provider value={{ enqueue, getTaskStatus }}>
      {children}
    </AIQueueContext.Provider>
  );
}

export function useAIQueue() {
  const context = useContext(AIQueueContext);
  if (context === undefined) {
    throw new Error("useAIQueue must be used within an AIQueueProvider");
  }
  return context;
}
