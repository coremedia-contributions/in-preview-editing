import React, { useEffect, useRef, useState } from "react";
import { usePluginContext } from "../context/PluginContext.tsx";
import PDEEditManager, { PDEEditEvents } from "../lib/edit-manager.ts";
import ActionsMenu from "./ActionsMenu.tsx";
import { Toolbar } from "@base-ui/react/toolbar";
import clsx from "clsx";
import { markerBorder, markerPadding } from "./Highlighter.tsx";
import { LoaderCircleIcon, SidebarIcon } from "lucide-react";
import toolbarStyles from "../styles/components/Toolbar.module.css";
import buttonStyles from "../styles/components/Button.module.css";
import { useTranslation } from "react-i18next";
import { isPlacement } from "../lib/pagegrid.ts";
import QuickCreateMenu from "./QuickCreateMenu.tsx";

interface Props {
}

interface Position {
  top: number;
  left: number;
}

const IPEOverlay: React.FC<Props> = () => {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const { targetEl, contentMetadata, inlineEditActive, setInlineEditActive, showSidebar, setShowSidebar, isLoading, debugMode, isSectionItemToolbarHovered, isDragging } = usePluginContext();
  const { t } = useTranslation();
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [quickCreateMenuOpen, setQuickCreateMenuOpen] = useState(false);
  const isPlacementElement = isPlacement(targetEl);

  useEffect(() => {
    const deactivateInlineEdit = () => setInlineEditActive(false);
    PDEEditManager.getInstance().addEventListener(PDEEditEvents.END_EDIT, deactivateInlineEdit);

    return () => {
      PDEEditManager.getInstance().removeEventListener(PDEEditEvents.END_EDIT, deactivateInlineEdit);
    }
  }, []);

  useEffect(() => {
    //console.log("Target element changed:", targetEl);

    if (!targetEl) {
      setActionsMenuOpen(false);
      setQuickCreateMenuOpen(false);
      return;
    }

    const updatePos = () => {
      const rect = targetEl.getBoundingClientRect();
      const menuHeight = toolbarRef.current?.offsetHeight || 0;
      setPosition({
        top: Math.round(rect.top + window.scrollY) - menuHeight - markerPadding,
        left: Math.round(rect.left + window.scrollX) - markerPadding - markerBorder, // offset to the left for better alignment with highlight marker
      });

      // TODO: Auto close menu when switching target elements
      setActionsMenuOpen(false);
      setQuickCreateMenuOpen(false);
    };

    requestAnimationFrame(updatePos);

    window.addEventListener("scroll", updatePos);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [targetEl]);

  if (!targetEl || isSectionItemToolbarHovered || isDragging) return null;

  function editBtnHandler() {
    const inline = contentMetadata?.propertyType === "STRING"; // TODO: Read from property descriptor only enable for string properties
    PDEEditManager.getInstance().startEditing(targetEl, inline);
    setInlineEditActive(inline);
  }

  function cancelBtnHandler() {
    PDEEditManager.getInstance().endEditing(targetEl, false);
    setInlineEditActive(false);
  }

  function saveBtnHandler() {
    PDEEditManager.getInstance().endEditing(targetEl, true);
    setInlineEditActive(false);
  }

  function toggleSidebar() {
    if (setShowSidebar) {
      setShowSidebar(!showSidebar);
    }
  }

  // Render directly inside shadow root
  return (
    <Toolbar.Root className={clsx("ipe-overlay-toolbar", toolbarStyles.Toolbar)}
                  ref={toolbarRef}
                  style={{
                    top: position.top,
                    left: position.left,
                  }}>
      {isLoading && <Toolbar.Button className={clsx(toolbarStyles.Button, buttonStyles.readonly)}>
        <LoaderCircleIcon width={16} height={16}
                    style={{marginRight: ".25rem"}}
                    className="loader-animated"/>
        {t("overlay.loading")}
      </Toolbar.Button>
      }

      {!isLoading && (
        <>
          {/*<Toolbar.Button className={clsx(toolbarStyles.Button, buttonStyles.readonly)}>{contentMetadata?.contentName || contentId}</Toolbar.Button>*/}
          {/*<Toolbar.Separator className={toolbarStyles.Separator} />*/}
          <Toolbar.Group className={toolbarStyles.Group}>
            {!inlineEditActive && <Toolbar.Button className={toolbarStyles.Button} onClick={editBtnHandler}>
              {contentMetadata?.propertyLabel ? t("overlay.editProperty", { property: contentMetadata?.propertyLabel }) : t("overlay.edit")}
            </Toolbar.Button>}
            {inlineEditActive && (
              <>
                <Toolbar.Button className={toolbarStyles.Button} onClick={saveBtnHandler}>
                  {contentMetadata?.propertyLabel ? t("overlay.saveProperty", { property: contentMetadata?.propertyLabel }) : t("overlay.save")}
                </Toolbar.Button>
                <Toolbar.Button className={clsx(toolbarStyles.Button)} onClick={cancelBtnHandler}>{t("overlay.cancel")}</Toolbar.Button>
              </>
            )}
          </Toolbar.Group>
          {isPlacementElement && (
            <QuickCreateMenu open={quickCreateMenuOpen} onOpenChange={setQuickCreateMenuOpen}/>
          )}
        </>
      )}

      {debugMode && (
        <>
          <Toolbar.Separator className={toolbarStyles.Separator} />
          <Toolbar.Button className={toolbarStyles.Button} onClick={toggleSidebar}>
            <SidebarIcon/>
          </Toolbar.Button>
        </>
      )}

      {!isLoading && (
        <>
          <Toolbar.Separator className={toolbarStyles.Separator} />
          <ActionsMenu open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}/>
        </>
      )}
    </Toolbar.Root>
  );
};

export default IPEOverlay;
