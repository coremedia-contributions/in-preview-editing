import { type FC, type ReactNode, useEffect, useRef } from "react";
import { usePluginContext } from "../context/PluginContext.tsx";
import { Toggle, ToggleGroup, Tooltip } from "@base-ui/react";
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import breadcrumbSelectorStyles from "../styles/components/BreadcrumbSelector.module.css";
import SVGIcon from "./SVGIcon.tsx";
import { ChevronRightIcon } from "lucide-react";
import type { BreadcrumbItem } from "../types/ContentMetadata.ts";
import PDEActionManager from "../lib/action-manager.ts";
import type { Subscription } from "rxjs";

const BreadcrumbSelector: FC = () => {
  const container = usePortalContainer();
  const { contentMetadata, setContentMetadata } = usePluginContext();
  const subscriptionRef = useRef<Subscription | null>(null);
  const breadcrumbItems = contentMetadata?.breadcrumb;

  // selectedValue is derived from contentMetadata to always reflect the current selection
  const selectedValue = contentMetadata?.contentRef ? [contentMetadata.contentRef] : [];

  // Cancel in-flight requests on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  if (!breadcrumbItems || breadcrumbItems.length < 2) {
    return null;
  }

  const handleBreadcrumbSelection = (selectedItem: BreadcrumbItem) => {
    // Cancel any in-flight request
    subscriptionRef.current?.unsubscribe();

    // Snapshot the current breadcrumb – it must not be overwritten by the response
    const originalContentMetadata = contentMetadata;

    const metadata$ = PDEActionManager.getInstance().requestContentMetadata(
      selectedItem.contentRef,
      null, // propertyName is not relevant for breadcrumb navigation
    );
    if (metadata$) {
      subscriptionRef.current = metadata$.subscribe({
        next: (response) => {
          // @ts-expect-error response is untyped
          const newMetadata = response.metadata;
          // Preserve the original breadcrumb and propertyName; it should only change when targetEl changes
          setContentMetadata?.({
            ...newMetadata,
            ...(originalContentMetadata?.breadcrumb && { breadcrumb: originalContentMetadata.breadcrumb }),
            ...(originalContentMetadata?.propertyName && { propertyName: originalContentMetadata.propertyName }),
            ...(originalContentMetadata?.propertyType && { propertyType: originalContentMetadata.propertyType }),
            ...(originalContentMetadata?.propertyLabel && { propertyLabel: originalContentMetadata.propertyLabel }),
          });
        },
        error: (err) => {
          console.warn("[IPE] Breadcrumb metadata request failed:", err);
        },
      });
    }
  };

  const breadcrumbComponents: ReactNode[] = [];
  breadcrumbItems.forEach((breadcrumbItem, index) => {
    breadcrumbComponents.push(
      <Tooltip.Root key={`item-${index}`}>
        <Tooltip.Trigger
          render={
            <Toggle className={breadcrumbSelectorStyles.ToggleButton}
                    value={breadcrumbItem.contentRef}
                    onClick={() => handleBreadcrumbSelection(breadcrumbItem)}/>
          }>
          <SVGIcon svg={breadcrumbItem.svgIcon}/>
        </Tooltip.Trigger>
        <Tooltip.Portal container={container}>
          <Tooltip.Positioner sideOffset={10}>
            <Tooltip.Popup
              className={breadcrumbSelectorStyles.Tooltip}>{breadcrumbItem.contentTypeLabel} - {breadcrumbItem.contentName}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    );

    // add a separator
    if (index < breadcrumbItems.length-1) {
      breadcrumbComponents.push(
        <span key={`separator-${index}`} className={breadcrumbSelectorStyles.Separator}>
        <ChevronRightIcon width={16} height={16}/>
      </span>
      );
    }

  });

  return (
    <ToggleGroup value={selectedValue} className={breadcrumbSelectorStyles.Container}>
      <Tooltip.Provider>
        {breadcrumbComponents}
      </Tooltip.Provider>
    </ToggleGroup>
  );
};

export default BreadcrumbSelector;
