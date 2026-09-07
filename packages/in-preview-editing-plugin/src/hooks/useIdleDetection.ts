import { useEffect, useRef } from "react";

const IDLE_TIMEOUT_MS = 5_000;

/**
 * Detects mouse-idle state within the document.
 *
 * When the mouse has not moved for {@link IDLE_TIMEOUT_MS} milliseconds while
 * `isActive` is `true`, `onIdle` is called once. When the mouse moves again
 * after an idle period, `onWakeUp` is called once. The hook tears down cleanly
 * whenever `isActive` becomes `false`.
 */
export function useIdleDetection(
  isActive: boolean,
  onIdle: () => void,
  onWakeUp: () => void,
  shouldStayAwake?: () => boolean,
): void {
  // Keep latest callback references stable so the effect doesn't need to
  // re-subscribe every render cycle.
  const onIdleRef = useRef(onIdle);
  const onWakeUpRef = useRef(onWakeUp);
  const shouldStayAwakeRef = useRef(shouldStayAwake);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    onWakeUpRef.current = onWakeUp;
  }, [onWakeUp]);

  useEffect(() => {
    shouldStayAwakeRef.current = shouldStayAwake;
  }, [shouldStayAwake]);

  useEffect(() => {
    if (!isActive) return;

    let timerHandle: ReturnType<typeof setTimeout> | null = null;
    let isIdle = false;

    const startTimer = () => {
      if (timerHandle !== null) clearTimeout(timerHandle);
      timerHandle = setTimeout(() => {
        if (shouldStayAwakeRef.current?.()) {
          startTimer();
          return;
        }
        isIdle = true;
        onIdleRef.current();
      }, IDLE_TIMEOUT_MS);
    };

    const handleMouseMove = () => {
      if (isIdle) {
        isIdle = false;
        onWakeUpRef.current();
      }
      startTimer();
    };

    document.addEventListener("mousemove", handleMouseMove);

    // Start the idle timer immediately so the UI hides even if the mouse
    // never moves after activation.
    startTimer();

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (timerHandle !== null) clearTimeout(timerHandle);
    };
  }, [isActive]);
}
