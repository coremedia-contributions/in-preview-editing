import { createContext, type FC, type ReactNode, useContext, useEffect, useRef, useState } from "react";

export interface TargetElementContextValue {
  targetEl: HTMLElement | null;
  setTargetEl: (targetEl: HTMLElement | null) => void;
}

const TargetElementContext = createContext<TargetElementContextValue | undefined>(undefined);

export const useTargetElement = () => {
  const ctx = useContext(TargetElementContext);
  if (!ctx) {
    throw new Error("useTarget must be used within TargetElementProvider");
  }
  return ctx;
};

interface ProviderProps {
  children: ReactNode;
  shadowRoot: ShadowRoot;
}

export const TargetElementProvider: FC<ProviderProps> = ({ shadowRoot, children }) => {
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);

  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {

    // attach listeners to the given element
    const attachListeners = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;

      // Prevent duplicate listeners
      if ((el as any)._ipe_listenersAttached) {
        return;
      }
      (el as any)._ipe_listenersAttached = true;

      el.addEventListener("mouseenter", () => setTargetEl(el));
    };

    // Attach to all existing matching nodes
    document
      .querySelectorAll("[data-cm-metadata]")
      .forEach(attachListeners);

    // Watch for dynamically added nodes
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;

          // Node itself matches?
          if (node.hasAttribute("data-cm-metadata")) {
            attachListeners(node);
          }

          // Or children match?
          node.querySelectorAll("[data-cm-metadata]")
            .forEach(attachListeners);
        });
      });
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
    };

  }, [shadowRoot]);

  return (
    <TargetElementContext.Provider value={{ targetEl, setTargetEl }}>
      {children}
    </TargetElementContext.Provider>
  );
};
