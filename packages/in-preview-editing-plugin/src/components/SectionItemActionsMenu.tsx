import React, { useCallback, useEffect, useRef, useState } from "react";
import { Toolbar } from "@base-ui/react/toolbar";
import { Tooltip } from "@base-ui/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import {
  SECTION_ITEM_MARKER,
  duplicateSectionItem,
  deleteSectionItem,
  moveSectionItemUp, moveSectionItemDown
} from "../lib/section-utils.ts";
import { usePluginContext } from "../context/PluginContext.tsx";
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import toolbarStyles from "../styles/components/Toolbar.module.css";
import buttonStyles from "../styles/components/Button.module.css";
import sectionItemActionsMenuStyles from "../styles/components/SectionItemActionsMenu.module.css";
import tooltipStyles from "../styles/components/Tooltip.module.css";
import { CopyPlusIcon, MoveDownIcon, MoveUpIcon, TrashIcon } from "lucide-react";

interface SectionItemToolbarProps {
  sectionItem: HTMLElement;
}

const SectionItemToolbar: React.FC<SectionItemToolbarProps> = ({ sectionItem }) => {
  const { t } = useTranslation();
  const { setIsSectionItemToolbarHovered } = usePluginContext();
  const container = usePortalContainer();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const rect = sectionItem.getBoundingClientRect();
    console.log("updatePosition", sectionItem, rect);
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
    await moveSectionItemUp(sectionItem);
    // Position updates are driven by the MutationObserver in SectionItemActionsMenu,
    // which fires once the DOM actually reflects the server-side change.
  };

  const onMoveDownClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await moveSectionItemDown(sectionItem);
    // Position updates are driven by the MutationObserver in SectionItemActionsMenu,
    // which fires once the DOM actually reflects the server-side change.
  };

  const onDuplicateItemClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateSectionItem(sectionItem);
    // Position updates are driven by the MutationObserver in SectionItemActionsMenu,
    // which fires once the DOM actually reflects the server-side change.
  };

  const onDeleteItemClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSectionItem(sectionItem);
    // Position updates are driven by the MutationObserver in SectionItemActionsMenu,
    // which fires once the DOM actually reflects the server-side change.
  };

  return (
    <Toolbar.Root
      className={clsx(sectionItemActionsMenuStyles.Toolbar, toolbarStyles.Toolbar)}
      style={{ top: position.top, left: position.left }}
      onMouseEnter={() => setIsSectionItemToolbarHovered(true)}
      onMouseLeave={() => setIsSectionItemToolbarHovered(false)}
    >
      <Tooltip.Provider>

        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Toolbar.Button
                className={toolbarStyles.Button}
                onClick={onMoveUpClick}>
                <MoveUpIcon />
              </Toolbar.Button>
            }
          >
            {t("sectionItemActionsMenu.moveUp")}
          </Tooltip.Trigger>
          <Tooltip.Portal container={container}>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup className={tooltipStyles.Tooltip}>
                {t("sectionItemActionsMenu.moveUp")}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Toolbar.Button
                className={toolbarStyles.Button}
                onClick={onMoveDownClick}>
                <MoveDownIcon />
              </Toolbar.Button>
            }
          >
            {t("sectionItemActionsMenu.moveDown")}
          </Tooltip.Trigger>
          <Tooltip.Portal container={container}>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup className={tooltipStyles.Tooltip}>
                {t("sectionItemActionsMenu.moveDown")}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Toolbar.Separator className={toolbarStyles.Separator} />

        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Toolbar.Button
                className={toolbarStyles.Button}
                onClick={onDuplicateItemClick}>
                <CopyPlusIcon/>
              </Toolbar.Button>
            }
          >
            {t("sectionItemActionsMenu.duplicate")}
          </Tooltip.Trigger>
          <Tooltip.Portal container={container}>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup className={tooltipStyles.Tooltip}>
                {t("sectionItemActionsMenu.duplicate")}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <Toolbar.Button
                className={clsx(toolbarStyles.Button, buttonStyles.destructive)}
                onClick={onDeleteItemClick}>
                <TrashIcon/>
              </Toolbar.Button>
            }
          >
            {t("sectionItemActionsMenu.delete")}
          </Tooltip.Trigger>
          <Tooltip.Portal container={container}>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup className={tooltipStyles.Tooltip}>
                {t("sectionItemActionsMenu.delete")}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
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
        <SectionItemToolbar key={index} sectionItem={item} />
      ))}
    </>
  );
};
