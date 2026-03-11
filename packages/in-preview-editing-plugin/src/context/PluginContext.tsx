import { createContext, type FC, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import type React from "react";
import { IPE_ACTIVATE_EVENT, IPE_DEACTIVATE_EVENT } from "../events/events.ts";
import { findContentId, findPropertyName, getContentIdBreadcrumb, isMarkedAsEditable } from "../lib/utils.ts";
import PDEActionManager from "../lib/action-manager.ts";
import type { Subscription } from "rxjs";
import type { ContentMetadata } from "../types/ContentMetadata.ts";
import { markerBorder } from "../components/Highlighter.tsx";

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
  breadcrumbIds?: string[];
  setBreadcrumbIds?: (breadcrumbIds: string[] | undefined) => void;
  contentMetadata?: ContentMetadata;
  setContentMetadata?: (metadata: ContentMetadata) => void;
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
  const [targetEl, setTargetEl] = useState<HTMLElement | undefined>(undefined);
  const [contentId, setContentId] = useState<string | undefined>(undefined);
  const [propertyName, setPropertyName] = useState<string | undefined>(undefined);
  const [breadcrumbIds, setBreadcrumbIds] = useState<string[] | undefined>(undefined);
  const [inlineEditActive, setInlineEditActive] = useState<boolean>(false);
  const [contentMetadata, setContentMetadata] = useState<ContentMetadata | undefined>(undefined);

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
    const onActivate = (_e: Event) => {
      setIsActive(true);
    };
    const onDeactivate = () => {
      setIsActive(false);
      setTargetEl(undefined);
      setContentId(undefined);
      setPropertyName(undefined);
      setBreadcrumbIds(undefined);
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


    const overMarkerBorder = (e: MouseEvent) => {
      const marker = markerRef.current;
      if (marker) {
        const rect = marker.getBoundingClientRect();
        const { clientX, clientY } = e;
        const borderWidth = parseFloat(getComputedStyle(marker).borderWidth) || markerBorder;
        // Prüfen ob der Pointer im Border-Bereich liegt (außerhalb des inneren Inhaltsbereichs, aber noch innerhalb der äußeren Box)
        const insideOuter = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
        const insideInner = clientX >= rect.left + borderWidth && clientX <= rect.right - borderWidth && clientY >= rect.top + borderWidth && clientY <= rect.bottom - borderWidth;
        return insideOuter && !insideInner;
      }
    }

    const attachListeners = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;

      el.addEventListener("mouseenter", (e: MouseEvent) => {

        const isOverMarkerBorder = overMarkerBorder(e);

        // check if potential new target element overlaps with the current element,
        // in that case, we need to check if the mouse pointer is over the marker borders to prevent allow accessing the overlay toolbar
        const elementsAtPointer = document.elementsFromPoint(e.clientX, e.clientY);
        const overlapWithCurrentTarget = targetElRef.current && elementsAtPointer.indexOf(targetElRef.current) > -1;

        console.log(`[IPE] mouseover: `, {
          newTarget: el,
          currentTarget: targetElRef.current,
          markedEditable: isMarkedAsEditable(el),
          overlap: overlapWithCurrentTarget,
          isOverMarkerBorder: isOverMarkerBorder,
          elementsAtPointer: elementsAtPointer,
          eventCoords: { x: e.clientX, y: e.clientY }
        });

        // Skip if we're currently editing inline or if the element is not marked as editable or if the mouse is still within the marker (e.g. due to border)
        if (inlineEditActiveRef.current || !isMarkedAsEditable(el)) return

        const contentId = findContentId(el);
        const propertyName = findPropertyName(el);
        const breadcrumbIds = getContentIdBreadcrumb(el);

        console.log("[IPE] set new target element: ", el);

        setTargetEl(el);
        setContentId(contentId);
        setPropertyName(propertyName);
        setBreadcrumbIds(breadcrumbIds);

        // Cancel any in-flight request from a previous hover
        metadataSubscriptionRef.current?.unsubscribe();

        const metadata$ = PDEActionManager.getInstance().requestContentMetadata(contentId, propertyName, breadcrumbIds);
        if (metadata$) {
          metadataSubscriptionRef.current = metadata$.subscribe({
            next: (response) => {
              console.log("[PDE] content metadata response:", response);
              // TODO: write response fields into context state as needed
              // @ts-ignore
              setContentMetadata(response.metadata);
            },
            error: (err) => {
              console.warn("[PDE] content metadata request failed:", err);
            },
          });
        }

      }, { signal });

      el.addEventListener("mousemove", (e: MouseEvent) => {

        const elementsAtPointer = document.elementsFromPoint(e.clientX, e.clientY);
        const overlapWithCurrentTarget = targetElRef.current && elementsAtPointer.indexOf(targetElRef.current) > -1;
        const markerEl = shadowRoot.elementsFromPoint(e.clientX, e.clientY).find((el) => el === markerRef.current);

        console.log(`[IPE] mousemove: `, {
          newTarget: el,
          currentTarget: targetElRef.current,
          marker: markerEl,
          elementsAtPointer: elementsAtPointer,
          overlap: overlapWithCurrentTarget,
          coords: { x: e.clientX, y: e.clientY },
        });
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

  const contextValue = {
    shadowRoot,
    isActive,
    targetEl, setTargetEl,
    markerRef,
    contentId, setContentId,
    propertyName, setPropertyName,
    breadcrumbIds, setBreadcrumbIds,
    contentMetadata, setContentMetadata,
    inlineEditActive, setInlineEditActive
  };

  return (
    <PluginContext.Provider value={contextValue}>
      {isActive ? children : null}
    </PluginContext.Provider>
  );
};



