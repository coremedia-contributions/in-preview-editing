import React, { useCallback, useEffect, useRef, useState } from "react";
import { Toolbar } from "@base-ui/react/toolbar";
import { Tooltip } from "@base-ui/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  SECTION_ITEM_MARKER,
  duplicateSectionItem,
  deleteSectionItem,
  moveSectionItemUp, moveSectionItemDown, isFirstItemInSection, isLastItemInSection,
  itemCountInSection
} from "../lib/section-utils.ts";
import { usePluginContext } from "../context/PluginContext.tsx";
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import toolbarStyles from "../styles/components/Toolbar.module.css";
import buttonStyles from "../styles/components/Button.module.css";
import sectionItemActionsMenuStyles from "../styles/components/SectionItemActionsMenu.module.css";
import tooltipStyles from "../styles/components/Tooltip.module.css";
import { CopyPlusIcon, LoaderCircleIcon, MoveDownIcon, MoveUpIcon, TrashIcon } from "lucide-react";

interface TooltipButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  container: HTMLElement | null | undefined;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({ label, icon, onClick, disabled, className, container }) => (
  <Tooltip.Root>
    <Tooltip.Trigger
      render={
        <Toolbar.Button
          className={clsx(toolbarStyles.Button, sectionItemActionsMenuStyles.TooltipButton, className)}
          disabled={disabled}
          onClick={onClick}>
          {icon}
        </Toolbar.Button>
      }
    >
      {label}
    </Tooltip.Trigger>
    <Tooltip.Portal container={container}>
      <Tooltip.Positioner sideOffset={8}>
        <Tooltip.Popup className={tooltipStyles.Tooltip}>
          {label}
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
);

interface SectionItemToolbarProps {
  sectionItem: HTMLElement;
}

const SectionItemToolbar: React.FC<SectionItemToolbarProps> = ({ sectionItem }) => {
  const { t } = useTranslation();
  const { setIsSectionItemToolbarHovered } = usePluginContext();
  const container = usePortalContainer();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState<boolean>(false);

  const updatePosition = useCallback(() => {
    const rect = sectionItem.getBoundingClientRect();
    setPosition({
      top: Math.round(rect.bottom + window.scrollY),
      left: Math.round(rect.left + window.scrollX + rect.width / 2),
    });
  }, [sectionItem]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("section-items-changed", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("section-items-changed", updatePosition);
    };
  }, [updatePosition]);

  const onMoveUpClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await moveSectionItemUp(sectionItem);
    window.setTimeout(() => setLoading(false), 2000);
  };

  const onMoveDownClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await moveSectionItemDown(sectionItem);
    window.setTimeout(() => setLoading(false), 2000);
  };

  const onDuplicateItemClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await duplicateSectionItem(sectionItem);
    window.setTimeout(() => setLoading(false), 2000);
  };

  const onDeleteItemClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    await deleteSectionItem(sectionItem);
    window.setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Toolbar.Root
      className={clsx(sectionItemActionsMenuStyles.Toolbar, toolbarStyles.Toolbar)}
      style={{ top: position.top, left: position.left }}
      onMouseEnter={() => setIsSectionItemToolbarHovered(true)}
      onMouseLeave={() => setIsSectionItemToolbarHovered(false)}
    >
      {loading && <Toolbar.Button className={clsx(toolbarStyles.Button, buttonStyles.readonly)}>
        <LoaderCircleIcon width={16} height={16}
                          style={{ marginRight: ".25rem" }}
                          className="loader-animated"/>
        {t("sectionItemActionsMenu.loading")}
      </Toolbar.Button>
      }

      {!loading && (
        <Tooltip.Provider>
          <TooltipButton
            label={t("sectionItemActionsMenu.moveUp")}
            icon={<MoveUpIcon/>}
            onClick={onMoveUpClick}
            disabled={isFirstItemInSection(sectionItem)}
            container={container}
          />

          <TooltipButton
            label={t("sectionItemActionsMenu.moveDown")}
            icon={<MoveDownIcon/>}
            onClick={onMoveDownClick}
            disabled={isLastItemInSection(sectionItem)}
            container={container}
          />

          <Toolbar.Separator className={toolbarStyles.Separator}/>

          <TooltipButton
            label={t("sectionItemActionsMenu.duplicate")}
            icon={<CopyPlusIcon/>}
            onClick={onDuplicateItemClick}
            container={container}
          />

          <Toolbar.Separator className={toolbarStyles.Separator}/>

          <TooltipButton
            label={t("sectionItemActionsMenu.delete")}
            icon={<TrashIcon/>}
            onClick={onDeleteItemClick}
            disabled={itemCountInSection(sectionItem) === 1}
            className={buttonStyles.destructive}
            container={container}
          />
        </Tooltip.Provider>
      )}
    </Toolbar.Root>
  );
};

/**
 * Renders an actions toolbar after each section item element found in the
 * document. The toolbars live inside the shadow DOM so they are visually
 * isolated from the host page's styles.
 *
 * Currently supports:
 * - Move section item up / down
 * - Duplicate section item
 * - Delete section item
 *
 * More actions can be added as additional Toolbar.Button entries.
 */
export const SectionItemActionsMenu: React.FC = () => {
  const [sectionItems, setSectionItems] = useState<HTMLElement[]>([]);
  const observerRef = useRef<MutationObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  const syncSectionItems = () => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(`[${SECTION_ITEM_MARKER}]`));
    setSectionItems(items);
  };

  const schedulePositionUpdate = () => {
    // Cancel any previously scheduled update to avoid redundant dispatches.
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    // Double rAF: first frame lets React commit the new DOM,
    // second frame ensures the browser reflow is done before reading getBoundingClientRect().
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent("section-items-changed"));
        rafRef.current = null;
      });
    });
  };

  useEffect(() => {
    syncSectionItems();

    observerRef.current = new MutationObserver(() => {
      syncSectionItems();
      schedulePositionUpdate();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [SECTION_ITEM_MARKER],
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <>
      {sectionItems.map((item, index) => (
        <SectionItemToolbar key={index} sectionItem={item}/>
      ))}
    </>
  );
};
