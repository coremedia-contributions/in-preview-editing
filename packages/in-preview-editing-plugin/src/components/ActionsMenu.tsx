import { Menu } from "@base-ui/react/menu";
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
import { SettingsIcon } from "lucide-react";
import BreadcrumbSelector from "./BreadcrumbSelector.tsx";
import { useTranslation } from "react-i18next";

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ActionsMenu: FC<Props> = ({ open: controlledOpen, onOpenChange }) => {
  const { t } = useTranslation();
  const container = usePortalContainer();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const { contentMetadata, setShowSettings } = usePluginContext();

  const contentRef = contentMetadata?.contentRef;
  const propertyName = contentMetadata?.propertyName;

  if (!contentRef) return null;

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

              <BreadcrumbSelector/>

              <div className={menuStyles.ContentInfo}>
                <div className={menuStyles.Thumbnail}>
                  {contentMetadata?.contentThumbnail && (
                    <img src={contentMetadata.contentThumbnail}
                         alt={contentMetadata?.contentName}
                         title={contentMetadata?.contentName}
                         onError={(e) => (e.target as HTMLImageElement).style.display = "none"}
                    />
                  )}
                </div>
                <div className={menuStyles.ContentDetails}>
                  <span className={menuStyles.ContentName}>{contentMetadata?.contentName}</span>
                  <span className={menuStyles.ContentType}>{contentMetadata?.contentTypeLabel}</span>
                </div>
              </div>

            </Menu.Group>
            <Menu.Item className={menuStyles.Item}
                       onClick={() => actionManager.getInstance().openContent(contentRef)}>
              <SVGIcon svg={openInNewTab}/>
              {t("actionsMenu.openInTab")}
            </Menu.Item>
            <Menu.Item className={menuStyles.Item}
                       onClick={() => actionManager.getInstance().showInLibrary(contentRef)}>
              <SVGIcon svg={showInLibrary}/>
              {t("actionsMenu.showInLibrary")}
            </Menu.Item>
            <Menu.Separator className={menuStyles.Separator}/>
            <Menu.Group>
              <Menu.GroupLabel className={menuStyles.GroupLabel}>{t("actionsMenu.lifecycle")}<span
                className={menuStyles.LifecycleStatusLabel}>{contentMetadata?.status}</span></Menu.GroupLabel>
              <Menu.Item
                className={menuStyles.Item}
                disabled={!(contentMetadata?.userMayPerformPublish && contentMetadata?.status !== "published")}
                onClick={() => actionManager.getInstance().requestContentPublication(contentRef, propertyName || "")}>
                <SVGIcon svg={directPublication}/>
                {t("actionsMenu.directPublication")}
              </Menu.Item>
              <Menu.Item
                className={menuStyles.Item}
                disabled={!(contentMetadata?.userMayPerformPublish && contentMetadata?.status !== "published")}
                onClick={() => actionManager.getInstance().startPublicationWorkflow(contentRef)}>
                <SVGIcon svg={startPublicationWorkflow}/>
                {t("actionsMenu.startPublicationWorkflow")}
              </Menu.Item>
            </Menu.Group>
            <Menu.Separator className={menuStyles.Separator}/>
            <Menu.Group>
              <Menu.GroupLabel className={menuStyles.GroupLabel}>{t("actionsMenu.localization")}<span
                className={menuStyles.LocalizationStatusLabel}>{contentMetadata?.translationStatus && contentMetadata?.translationStatus !== "no-master" ? contentMetadata?.translationStatus : ""}</span></Menu.GroupLabel>
              <Menu.Item
                className={clsx(menuStyles.Item, menuStyles.NoIconItem, menuStyles.ReadonlyItem)}>{contentMetadata?.siteLocale}</Menu.Item>
              <Menu.Item className={menuStyles.Item}
                         onClick={() => actionManager.getInstance().startLocalizationWorkflow(contentRef)}>
                <SVGIcon svg={localizationWorkflowCircle}/>
                {t("actionsMenu.localize")}
              </Menu.Item>
            </Menu.Group>
            <Menu.Separator className={menuStyles.Separator}/>
            <Menu.Item className={menuStyles.Item}
                       onClick={() => setShowSettings && setShowSettings(true)}>
              <SettingsIcon/>
              {t("actionsMenu.settings")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

export default ActionsMenu;
