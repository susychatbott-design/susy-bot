"use client";

import { useState, useEffect, useCallback } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

/**
 * usePWAInstall: Hook para gestionar la instalación nativa de la PWA de Susy Bot
 * y registrar defensivamente el Service Worker (/susybot-sw.js).
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const nav = window.navigator as NavigatorWithStandalone;
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        nav.standalone === true ||
        document.referrer.includes("android-app://");

      if (isStandalone) {
        setIsInstalled(true);
      }

      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/susybot-sw.js", { scope: "/" })
            .then((reg) => {
              console.log("[PWA Susy Bot] Service Worker registrado en scope:", reg.scope);
            })
            .catch((err: unknown) => {
              console.warn("[PWA Susy Bot] Error al registrar Service Worker:", err);
            });
        });
      }
    }

    const handleBeforeInstallPrompt = (e: Event): void => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = (): void => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err: unknown) {
      console.warn("[usePWAInstall] Error ejecutando prompt de instalación:", err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    triggerInstall,
  };
}

export default usePWAInstall;
