"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

const HISTORY_KEY = "zadokRequestDetails";

/** One same-document entry for details; Back consumes it instead of trapping navigation. */
export function useRequestStep(open: boolean, hasItems: boolean) {
  const [step, setStep] = useState<"review" | "details">("review");
  const traversing = useRef(false);

  function review() {
    setStep("review");
    if (window.history.state?.[HISTORY_KEY] && !traversing.current) {
      traversing.current = true;
      window.history.back();
    }
  }

  function details() {
    if (traversing.current) return;
    if (!window.history.state?.[HISTORY_KEY]) {
      window.history.pushState({ ...window.history.state, [HISTORY_KEY]: true }, "");
    }
    setStep("details");
  }

  const onPop = useEffectEvent(() => {
    traversing.current = false;
    // Forward may restore the details entry, but never opens a closed drawer.
    if (window.history.state?.[HISTORY_KEY] && open && hasItems) setStep("details");
    else {
      setStep("review");
    }
  });
  const reset = useEffectEvent(review);

  useEffect(() => {
    const listener = () => onPop();
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  useEffect(() => {
    if (!open || !hasItems) queueMicrotask(() => reset());
  }, [open, hasItems]);

  return { detailsOpen: open && hasItems && step === "details", showDetails: details, showReview: review };
}
