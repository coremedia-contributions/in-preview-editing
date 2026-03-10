import { Menu } from '@base-ui/react/menu';
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import { EllipsisIcon } from "lucide-react";
import { openInNewTab, showInLibrary, startPublicationWorkflow, startTranslationWorkflow } from "@coremedia/studio-client.common-icons";
import SVGIcon from "./SVGIcon.tsx";
import { type FC, useState } from "react";
import menuStyles from "../styles/components/Menu.module.css";
import iconStyles from "../styles/components/Icon.module.css";
import toolbarStyles from "../styles/components/Toolbar.module.css";

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ActionsMenu:FC<Props> = ({ open: controlledOpen, onOpenChange }) => {
  const container = usePortalContainer();

  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (open: boolean) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
  };

  return (
    <Menu.Root modal={false} open={isOpen} onOpenChange={handleOpenChange}>
      <Menu.Trigger className={toolbarStyles.Button}>
        <EllipsisIcon className={iconStyles.Icon} />
      </Menu.Trigger>
      <Menu.Portal container={container}>
        <Menu.Positioner className={menuStyles.Positioner} align={"start"} sideOffset={0}>
          <Menu.Popup className={menuStyles.Popup}>
            <Menu.Item className={menuStyles.Item}><SVGIcon svg={openInNewTab}/>Open in Tab</Menu.Item>
            <Menu.Item className={menuStyles.Item}><SVGIcon svg={showInLibrary}/>Open in Library</Menu.Item>
            <Menu.Separator className={menuStyles.Separator} />
            <Menu.Group>
              <Menu.GroupLabel className={menuStyles.GroupLabel}>Lifecycle</Menu.GroupLabel>
              <Menu.Item className={menuStyles.Item}><SVGIcon svg={startPublicationWorkflow}/>Start Publication</Menu.Item>
            </Menu.Group>
            <Menu.Separator className={menuStyles.Separator} />
            <Menu.Group>
              <Menu.GroupLabel className={menuStyles.GroupLabel}>Localization</Menu.GroupLabel>
              <Menu.Item className={menuStyles.Item}><SVGIcon svg={startTranslationWorkflow}/>Start Localization</Menu.Item>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export default ActionsMenu;
