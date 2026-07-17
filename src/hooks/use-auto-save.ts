"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

export function useAutoSave<T>(value: T, save: (value: T) => Promise<void>, enabled = true) {
  const [state, setState] = useState<SaveState>("idle");
  const first = useRef(true);
  const latestSave = useRef(save);
  latestSave.current = save;

  const retry = useCallback(async () => {
    setState("saving");
    try {
      await latestSave.current(value);
      setState("saved");
    } catch {
      setState("error");
    }
  }, [value]);

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setState("saving");
    const timer = window.setTimeout(() => void retry(), 1000);
    return () => window.clearTimeout(timer);
  }, [enabled, retry, value]);

  return { state, retry };
}
