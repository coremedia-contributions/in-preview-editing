import { Menu } from '@base-ui/react/menu';
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import {
  directPublication,
  openInNewTab,
  showInLibrary,
  startPublicationWorkflow,
  localizationWorkflowCircle
} from "@coremedia/studio-client.common-icons";
import SVGIcon from "./SVGIcon.tsx";
import { type FC, useState } from "react";
import menuStyles from "../styles/components/Menu.module.css";
import toolbarStyles from "../styles/components/Toolbar.module.css";
import actionManager from "../lib/action-manager.ts";
import { usePluginContext } from "../context/PluginContext.tsx";
import clsx from "clsx";

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ActionsMenu:FC<Props> = ({ open: controlledOpen, onOpenChange }) => {
  const container = usePortalContainer();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const { contentId, propertyName, contentMetadata } = usePluginContext();

  if (!contentId) return null;

  const handleOpenChange = (open: boolean) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
  };

  return (
    <Menu.Root modal={false} open={isOpen} onOpenChange={handleOpenChange}>
      <Menu.Trigger className={toolbarStyles.Button}>...</Menu.Trigger>
      <Menu.Portal container={container}>
        <Menu.Positioner className={menuStyles.Positioner} align={"start"} sideOffset={0}>
          <Menu.Popup className={menuStyles.Popup}>
            <Menu.Group>
              <div className={menuStyles.ContentInfo}>
                <div className={menuStyles.Thumbnail}>
                  {contentMetadata?.contentThumbnail && (
                    <img src={contentMetadata.contentThumbnail} alt={contentMetadata?.contentName} title={contentMetadata?.contentName}/>
                  )}
                </div>
                <div className={menuStyles.ContentDetails}>
                  <span className={menuStyles.ContentName}>{contentMetadata?.contentName}</span>
                  <span className={menuStyles.ContentType}>{contentMetadata?.contentTypeLabel}</span>
                </div>
              </div>

            </Menu.Group>
            <Menu.Separator className={menuStyles.Separator} />
            <Menu.Item className={menuStyles.Item}
                       onClick={() => actionManager.getInstance().openContent(contentId)}>
              <SVGIcon svg={openInNewTab}/>
              Open in Tab
            </Menu.Item>
            <Menu.Item className={menuStyles.Item}
                       onClick={() => actionManager.getInstance().showInLibrary(contentId)}>
              <SVGIcon svg={showInLibrary}/>
              Show in Library
            </Menu.Item>
            <Menu.Separator className={menuStyles.Separator} />
            <Menu.Group>
              <Menu.GroupLabel className={menuStyles.GroupLabel}>Lifecycle<span className={menuStyles.LifecycleStatusLabel}>{contentMetadata?.status}</span></Menu.GroupLabel>
              <Menu.Item className={clsx(menuStyles.Item, contentMetadata?.userMayPerformPublish || contentMetadata?.status !== "published" ? "" : menuStyles.ReadonlyItem)}
                         onClick={() => actionManager.getInstance().requestContentPublication(contentId, propertyName || "")}>
                <SVGIcon svg={directPublication}/>
                Direct Publication
              </Menu.Item>
              <Menu.Item className={clsx(menuStyles.Item, contentMetadata?.userMayPerformPublish || contentMetadata?.status !== "published" ? "" : menuStyles.ReadonlyItem)}
                         onClick={() => actionManager.getInstance().startPublicationWorkflow(contentId)}>
                <SVGIcon svg={startPublicationWorkflow}/>
                Start Publication Workflow
              </Menu.Item>
            </Menu.Group>
            <Menu.Separator className={menuStyles.Separator} />
            <Menu.Group>
              <Menu.GroupLabel className={menuStyles.GroupLabel}>Localization<span className={menuStyles.LocalizationStatusLabel}>{contentMetadata?.translationStatus}</span></Menu.GroupLabel>
              <Menu.Item className={clsx(menuStyles.Item, menuStyles.ReadonlyItem)}>{contentMetadata?.siteLocale}</Menu.Item>
              <Menu.Item className={menuStyles.Item}
                         onClick={() => actionManager.getInstance().startLocalizationWorkflow(contentId)}>
                <SVGIcon svg={localizationWorkflowCircle}/>
                Localize
              </Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export default ActionsMenu;
