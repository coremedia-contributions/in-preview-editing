import { createContext, type FC, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import type React from "react";
import { IPE_ACTIVATE_EVENT, IPE_DEACTIVATE_EVENT, type IPEActivateEventDetail } from "../events/events.ts";
import i18next from "../i18n/i18n.ts";
import {
  findContentId,
  getContentIdBreadcrumb, getPropertyNameFromMetadata,
  isMarkedAsEditable
} from "../lib/utils.ts";
import PDEActionManager from "../lib/action-manager.ts";
import type { Subscription } from "rxjs";
import type { ContentMetadata } from "../types/ContentMetadata.ts";
import { useTabFocusManagement } from "../hooks/useTabFocusManagement.ts";

export interface PluginContextValue {
  shadowRoot: ShadowRoot;
  isActive: boolean;
  inlineEditActive: boolean;
  setInlineEditActive: (inlineEditActive: boolean) => void;
  targetEl: HTMLElement | undefined;
  setTargetEl: (targetEl: HTMLElement | undefined) => void;
  markerRef: React.MutableRefObject<HTMLElement | null>;
  contentId?: string;
  setContentId?: (contentId: string | undefined) => void;
  propertyName?: string;
  setPropertyName?: (propertyName: string | undefined) => void;
  contentMetadata?: ContentMetadata;
  setContentMetadata?: (metadata: ContentMetadata) => void;
  useSpotlight: boolean;
  setUseSpotlight: (useSpotlight: boolean) => void;
  dimmerValue: number;
  setDimmerValue: (dimmerValue: number) => void;
  showSidebar: boolean;
  setShowSidebar: (showSidebar: boolean) => void;
  isLoading: boolean;
  showSettings: boolean;
  setShowSettings: (showSettings: boolean) => void;
  accentColor: string;
  setAccentColor: (accentColor: string) => void;
  debugMode: boolean;
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
  const [isActive, setIsActive] = useState(false);
  const [targetEl, setTargetEl] = useState<HTMLElement | undefined>(undefined);
  const [inlineEditActive, setInlineEditActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [contentMetadata, setContentMetadata] = useState<ContentMetadata | undefined>(undefined);
  const [useSpotlight, setUseSpotlight] = useState(false);
  const [dimmerValue, setDimmerValue] = useState(25);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [accentColor, setAccentColor] = useState<string>("lightseagreen");
  const [debugMode, setDebugMode] = useState(false);

  const inlineEditActiveRef = useRef(inlineEditActive);
  useEffect(() => {
    inlineEditActiveRef.current = inlineEditActive;
  }, [inlineEditActive]);

  const targetElRef = useRef(targetEl);
  useEffect(() => {
    targetElRef.current = targetEl;
  }, [targetEl]);

  const metadataSubscriptionRef = useRef<Subscription | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const listenerAbortControllerRef = useRef<AbortController | null>(null);
  const markerRef = useRef<HTMLElement | null>(null);

  // Activate / deactivate via window API events
  useEffect(() => {

    const onActivate = (e: Event) => {
      const event = e as CustomEvent<IPEActivateEventDetail>;
      const { lang, features } = event.detail ?? {};
      if (lang) {
        i18next.changeLanguage(lang);
      }

      // parse features/config
      //console.log("[IPE] activate with features:", features);
      setUseSpotlight(features?.spotlight === true);
      if (features?.spotlightDimming) {
        setDimmerValue(features.spotlightDimming);
      }
      if (features?.themeColor) {
        setAccentColor(features.themeColor);
      }

      setIsActive(true);
    };

    const onDeactivate = () => {
      setIsActive(false);
      setTargetEl(undefined);
      setContentMetadata(undefined);
      metadataSubscriptionRef.current?.unsubscribe();
      metadataSubscriptionRef.current = null;
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

        // TODO: check if potential new target element overlaps with the current element,
        // in that case, we need to check if the mouse pointer is over the marker borders to prevent allow accessing the overlay toolbar
        // const elementsAtPointer = document.elementsFromPoint(e.clientX, e.clientY);
        // const overlapWithCurrentTarget = targetElRef.current && elementsAtPointer.indexOf(targetElRef.current) > -1;

        // Skip if we're currently editing inline or if the element is not marked as editable or if the mouse is still within the marker (e.g. due to border)
        if (inlineEditActiveRef.current || !isMarkedAsEditable(el)) return;

        //console.log("[IPE] set new target element: ", el);
        setTargetEl(el);

        // Cancel any in-flight request from a previous hover
        metadataSubscriptionRef.current?.unsubscribe();
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

  // tab-focus management: When plugin is active, only allow tab navigation between [data-cm-metadata] nodes
  useTabFocusManagement({
    isActive,
    targetEl,
    setTargetEl,
    shadowHost: shadowRoot.host,
    inlineEditActiveRef,
  });

  useEffect(() => {
    if (targetEl) {
      const contentId = findContentId(targetEl);
      const propertyName = getPropertyNameFromMetadata(targetEl);
      const breadcrumbIds = getContentIdBreadcrumb(targetEl);

      setLoading(true);

      console.log("[IPE] Fetch content metadata for contentId:", contentId, "propertyName:", propertyName, "breadcrumbIds:", breadcrumbIds);
      const metadata$ = PDEActionManager.getInstance().requestContentMetadata(contentId, propertyName, breadcrumbIds);
      if (metadata$) {
        metadataSubscriptionRef.current = metadata$.subscribe({
          next: (response) => {
            console.log("[PDE] content metadata response:", response);
            // TODO: write response fields into context state as needed
            // @ts-ignore
            setContentMetadata(response.metadata);
            setLoading(false);
          },
          error: (err) => {
            console.warn("[PDE] content metadata request failed:", err);
            setLoading(false);
          },
        });
      }
    }
  }, [targetEl]);

  // set accent color as CSS variable on host element to make it available in shadow DOM for styling
  useEffect(() => {
    const hostEl = shadowRoot.host as HTMLElement;
    hostEl.style.setProperty('--ipe-accent-color', accentColor);
  }, [accentColor, shadowRoot]);

  useEffect(() => {
    const stored = localStorage.getItem("ipe_debug");
    setDebugMode(stored === "true" || stored === "1");
  }, []);

  const contextValue = {
    shadowRoot,
    isActive,
    targetEl, setTargetEl,
    markerRef,
    contentMetadata, setContentMetadata,
    inlineEditActive, setInlineEditActive,
    useSpotlight, setUseSpotlight,
    dimmerValue, setDimmerValue,
    showSidebar, setShowSidebar,
    isLoading: loading,
    showSettings, setShowSettings,
    accentColor, setAccentColor,
    debugMode,
  };

  return (
    <PluginContext.Provider value={contextValue}>
      {isActive ? children : null}
    </PluginContext.Provider>
  );
};



