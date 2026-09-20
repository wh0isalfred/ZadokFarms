"use client";
import { useEffect } from "react";
// Full document navigation plus no-store avoids a reusable client data cache.
// Conceal the old document before history snapshots; reauthorize on restoration.
export function DeskPrivacy() {
  useEffect(() => {
    const hide = () => { document.documentElement.dataset.deskLeaving = "true"; };
    const restore = (event: PageTransitionEvent) => { if (event.persisted) window.location.reload(); };
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", restore);
    return () => { window.removeEventListener("pagehide", hide); window.removeEventListener("pageshow", restore); };
  }, []);
  return null;
}
