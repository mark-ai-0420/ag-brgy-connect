import { useState, useEffect, useRef, useCallback } from 'react';

interface UseIdleTimeoutOptions {
  timeoutMs?: number;
  warningMs?: number;
  onWarning: () => void;
  onTimeout: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({
  timeoutMs = 30 * 60 * 1000,
  warningMs = 25 * 60 * 1000,
  onWarning,
  onTimeout,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const [isWarning, setIsWarning] = useState(false);
  const lastActivity = useRef<number>(Date.now());
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimer = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);

    lastActivity.current = Date.now();
    setIsWarning(false);

    if (enabled) {
      warningTimer.current = setTimeout(() => {
        setIsWarning(true);
        onWarning();
      }, warningMs);

      timeoutTimer.current = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    }
  }, [enabled, onWarning, onTimeout, warningMs, timeoutMs]);

  useEffect(() => {
    if (!enabled) {
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      return;
    }

    const handleActivity = () => {
      const now = Date.now();
      // Throttle activity tracking to 30 seconds
      if (now - lastActivity.current > 30000 && !isWarning) {
        resetTimer();
      }
    };

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    };
  }, [enabled, resetTimer, isWarning]);

  return { resetTimer, isWarning };
}
