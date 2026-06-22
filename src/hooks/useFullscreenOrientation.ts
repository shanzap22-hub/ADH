"use client";

import { useEffect, useCallback, useRef } from "react";
import { isVerticalVideo } from "@/lib/video-utils";

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

const lockPortrait = async () => {
  if (isCapacitor()) {
    try {
      const { ScreenOrientation } = await import("@capacitor/screen-orientation");
      await ScreenOrientation.lock({ orientation: "portrait" });
    } catch (e) {
      console.warn("[useFullscreenOrientation] Capacitor lock failed:", e);
    }
  } else {
    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock("portrait");
      }
    } catch (e) {
      // Ignore
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
      const { StatusBar } = await import("@capacitor/status-bar");
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
 * - Fullscreen enter → landscape lock (horizontal) / portrait lock (vertical) + status bar hide
 * - Fullscreen exit  → orientation unlock + status bar show
 */
export function useFullscreenOrientation(
  containerRef: React.RefObject<HTMLElement | null>,
  videoUrl?: string | null,
  disabled: boolean = false
) {
  const isFullscreenRef = useRef(false);

  const handleEnterFullscreen = useCallback(async () => {
    if (isFullscreenRef.current) return;
    isFullscreenRef.current = true;

    // 1. Check if the video URL is marked as vertical or is a YouTube Short
    let isVertical = false;
    if (videoUrl) {
      isVertical = isVerticalVideo(videoUrl);
    }

    // 2. Fallback: HTML5 video aspect ratio check
    if (!isVertical && containerRef.current) {
      const videoEl = containerRef.current.querySelector("video");
      if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
        if (videoEl.videoHeight > videoEl.videoWidth) {
          isVertical = true;
        }
      }
    }

    console.log(`[Fullscreen] Entering — isVertical: ${isVertical}`);

    if (isVertical) {
      // Vertical video ആണെങ്കിൽ portrait-ലേക്ക് lock ചെയ്യുന്നു
      await lockPortrait();
    } else {
      // Horizontal video ആണെങ്കിൽ landscape-ലേക്ക് lock ചെയ്യുന്നു
      await lockLandscape();
    }
    await hideStatusBar();
  }, [videoUrl, containerRef]);

  const handleExitFullscreen = useCallback(async () => {
    if (!isFullscreenRef.current) return;
    isFullscreenRef.current = false;
    console.log("[Fullscreen] Exiting — unlocking orientation + showing status bar");
    await unlockOrientation();
    await showStatusBar();
  }, []);

  useEffect(() => {
    if (disabled) return;

    const onFullscreenChange = () => {
      const fsElement = document.fullscreenElement
        || (document as any).webkitFullscreenElement
        || (document as any).mozFullScreenElement
        || (document as any).msFullscreenElement;

      // Fullscreen element നമ്മളുടെ container-ന് ഉള്ളിൽ ആണെങ്കിൽ മാത്രം orientation മാറ്റുക
      const isOurContainerFullscreen = fsElement && containerRef.current && (
        containerRef.current === fsElement || containerRef.current.contains(fsElement)
      );

      if (isOurContainerFullscreen) {
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
  }, [containerRef, disabled, handleEnterFullscreen, handleExitFullscreen]);
}

