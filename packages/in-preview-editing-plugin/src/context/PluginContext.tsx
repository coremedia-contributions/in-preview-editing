import { createContext, type FC, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { IPE_ACTIVATE_EVENT, IPE_DEACTIVATE_EVENT } from "../events/events.ts";

export interface PluginContextValue {
  shadowRoot: ShadowRoot;
  isActive: boolean;
  inlineEditActive: boolean;
  setInlineEditActive: (inlineEditActive: boolean) => void;
  targetEl: HTMLElement | null;
  setTargetEl: (targetEl: HTMLElement | null) => void;
}

const PluginContext = createContext<PluginContextValue | undefined>(undefined);

export const usePluginContext = () => {
  const ctx = useContext(PluginContext);
  if (!ctx) {
    throw new Error("usePluginContext must be used within PluginContextProvider");
  }
  return ctx;
};

interface ProviderProps {
  children: ReactNode;
  shadowRoot: ShadowRoot;
}

export const PluginContextProvider: FC<ProviderProps> = ({ shadowRoot, children }) => {
  const [isActive, setIsActive] = useState(true);
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);
  const [inlineEditActive, setInlineEditActive] = useState<boolean>(false);

  const inlineEditActiveRef = useRef(inlineEditActive);
  useEffect(() => {
    inlineEditActiveRef.current = inlineEditActive;
  }, [inlineEditActive]);

  const observerRef = useRef<MutationObserver | null>(null);
  const listenerAbortControllerRef = useRef<AbortController | null>(null);

  // Activate / deactivate via window API events
  useEffect(() => {
    const onActivate = (_e: Event) => {
      setIsActive(true);
    };
    const onDeactivate = () => {
      setIsActive(false);
      setTargetEl(null);
    };

    document.addEventListener(IPE_ACTIVATE_EVENT, onActivate);
    document.addEventListener(IPE_DEACTIVATE_EVENT, onDeactivate);

    return () => {
      document.removeEventListener(IPE_ACTIVATE_EVENT, onActivate);
      document.removeEventListener(IPE_DEACTIVATE_EVENT, onDeactivate);
    };
  }, []);

  // Attach / detach mouse listeners based on isActive
  useEffect(() => {
    if (!isActive) {
      listenerAbortControllerRef.current?.abort();
      listenerAbortControllerRef.current = null;
      observerRef.current?.disconnect();
      observerRef.current = null;
      return;
    }

    const abortController = new AbortController();
    listenerAbortControllerRef.current = abortController;
    const { signal } = abortController;

    const attachListeners = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;

      el.addEventListener("mouseenter", () => {
        if (!inlineEditActiveRef.current) {
          setTargetEl(el);
        }
      }, { signal });
    };

    document.querySelectorAll("[data-cm-metadata]").forEach(attachListeners);

    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.hasAttribute("data-cm-metadata")) attachListeners(node);
          node.querySelectorAll("[data-cm-metadata]").forEach(attachListeners);
        });
      });
    });

    observerRef.current.observe(document.body, { childList: true, subtree: true });

    return () => {
      abortController.abort();
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [isActive]);

  return (
    <PluginContext.Provider value={{ shadowRoot, isActive, targetEl, setTargetEl, inlineEditActive, setInlineEditActive }}>
      {isActive ? children : null}
    </PluginContext.Provider>
  );
};



