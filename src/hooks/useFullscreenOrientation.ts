"use client";

import { useEffect, useCallback, useRef } from "react";

// Capacitor environment-ൽ ആണോ എന്ന് check ചെയ്യുക
const isCapacitor = () =>
  typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();

// Screen orientation lock/unlock — Capacitor plugin dynamic import
const lockLandscape = async () => {
  if (isCapacitor()) {
    try {
      const { ScreenOrientation } = await import("@capacitor/screen-orientation");
      await ScreenOrientation.lock({ orientation: "landscape" });
    } catch (e) {
      console.warn("[useFullscreenOrientation] Capacitor lock failed:", e);
    }
  } else {
    // Web browser fallback — Screen Orientation API
    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock("landscape");
      }
    } catch (e) {
      // Web lock ചില browsers-ൽ support ഇല്ല, ignore ചെയ്‌തോ
    }
  }
};

const unlockOrientation = async () => {
  if (isCapacitor()) {
    try {
      const { ScreenOrientation } = await import("@capacitor/screen-orientation");
      await ScreenOrientation.unlock();
    } catch (e) {
      console.warn("[useFullscreenOrientation] Capacitor unlock failed:", e);
    }
  } else {
    try {
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
    } catch (e) {
      // Ignore
    }
  }
};

// Android Immersive mode — status bar + navigation bar hide/show
// ഇത് Capacitor-ൽ JS-to-Java bridge വഴി ചെയ്യുന്നത് ഏറ്റവും reliable ആണ്
const hideStatusBar = async () => {
  if (isCapacitor()) {
    try {
      // @capacitor/status-bar plugin ഉണ്ടെങ്കിൽ use ചെയ്യുക
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.hide();
    } catch (e) {
      console.warn("[useFullscreenOrientation] StatusBar hide failed:", e);
    }
  }
};

const showStatusBar = async () => {
  if (isCapacitor()) {
    try {
      const { StatusBar } = await import("@capacitor/status-bar");
      await StatusBar.show();
    } catch (e) {
      console.warn("[useFullscreenOrientation] StatusBar show failed:", e);
    }
  }
};

/**
 * useFullscreenOrientation
 *
 * ഈ hook ഒരു container element-ലേക്ക് attach ചെയ്‌ത്, fullscreen enter/exit events
 * detect ചെയ്‌ത് automatically:
 * - Fullscreen enter → landscape lock + status bar hide
 * - Fullscreen exit  → orientation unlock + status bar show
 *
 * Usage:
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   useFullscreenOrientation(containerRef);
 */
export function useFullscreenOrientation(
  containerRef: React.RefObject<HTMLElement | null>
) {
  const isFullscreenRef = useRef(false);

  const handleEnterFullscreen = useCallback(async () => {
    if (isFullscreenRef.current) return;
    isFullscreenRef.current = true;
    console.log("[Fullscreen] Entering — locking landscape + hiding status bar");
    await lockLandscape();
    await hideStatusBar();
  }, []);

  const handleExitFullscreen = useCallback(async () => {
    if (!isFullscreenRef.current) return;
    isFullscreenRef.current = false;
    console.log("[Fullscreen] Exiting — unlocking orientation + showing status bar");
    await unlockOrientation();
    await showStatusBar();
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      // document.fullscreenElement ഉണ്ടെങ്കിൽ fullscreen-ൽ ആണ്
      const fsElement = document.fullscreenElement
        || (document as any).webkitFullscreenElement
        || (document as any).mozFullScreenElement
        || (document as any).msFullscreenElement;

      if (fsElement) {
        handleEnterFullscreen();
      } else {
        handleExitFullscreen();
      }
    };

    // Cross-browser fullscreen change events
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);

      // Component unmount ആകുമ്പോൾ cleanup
      if (isFullscreenRef.current) {
        unlockOrientation();
        showStatusBar();
      }
    };
  }, [handleEnterFullscreen, handleExitFullscreen]);
}
