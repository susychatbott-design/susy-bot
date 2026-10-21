"use client";

import { useEffect } from "react";

interface ReactDevToolsHook {
  inject?: () => void;
  [key: string]: unknown;
}

interface WindowWithDevTools extends Window {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook;
}

/**
 * Blindaje Antirrobo e Inspección en el Cliente (useSecurityLockdown)
 * Se activa estrictamente cuando process.env.NODE_ENV === 'production'
 */
export function useSecurityLockdown(): void {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    try {
      if (typeof window !== "undefined") {
        const win = window as unknown as WindowWithDevTools;
        const hook = win.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook) {
          hook.inject = () => {};
          Object.keys(hook).forEach((key) => {
            if (typeof hook[key] === "function") {
              hook[key] = () => {};
            }
          });
        }
      }
    } catch {
      // Ignorar errores de sandbox
    }

    const handleContextMenu = (e: MouseEvent): boolean => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent): boolean | void => {
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "I" ||
          e.key === "i" ||
          e.key === "J" ||
          e.key === "j" ||
          e.key === "C" ||
          e.key === "c")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);
}
