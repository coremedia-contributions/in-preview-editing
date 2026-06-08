import { Menu } from "@base-ui/react/menu";
import { type FC, useEffect, useState } from "react";
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import menuStyles from "../styles/components/Menu.module.css";
import toolbarStyles from "../styles/components/Toolbar.module.css";
import PDEActionManager from "../lib/action-manager.ts";
import { findPlacementElement, getPlacementName } from "../lib/pagegrid.ts";
import { usePluginContext } from "../context/PluginContext.tsx";
import { findContentId } from "../lib/utils.ts";
import actionManager from "../lib/action-manager.ts";
import { SquarePlusIcon } from "lucide-react";

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const QuickCreateMenu: FC<Props> = ({ open: controlledOpen, onOpenChange }) => {
  const container = usePortalContainer();
  const { targetEl } = usePluginContext();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    console.log("Fetch templates");
    const templatesObservable = PDEActionManager.getInstance().requestQuickCreateTemplates();
    if (templatesObservable) {
      templatesObservable.subscribe({
        next: (response) => {
          const fetchedTemplates = response.templates;
          setTemplates(fetchedTemplates);
        },
        error: (err) => {
          console.warn("[PDE] fetching quick create templates failed:", err);
          setTemplates([]);
        }
      });
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
  };

  const insertQuickCreateContent = (template) => {
    if (targetEl) {
      const placementElement = findPlacementElement(targetEl);
      const contentId = findContentId(targetEl);
      const placementName = getPlacementName(placementElement);
      if (placementName) {
        actionManager.getInstance().requestQuickCreateContentInsertInPlacement(contentId, template.templateContent, placementName);
        console.log("[PDE] Insert from quick create template: ", {currentContent: contentId, template: template, placement: getPlacementName(placementElement)});
      }
    }
    setInternalOpen(false);
  };

  return (
    <Menu.Root modal={false} open={isOpen} onOpenChange={handleOpenChange}>
      <Menu.Trigger className={toolbarStyles.Button}>
        <SquarePlusIcon/>
      </Menu.Trigger>
      <Menu.Portal container={container}>
        <Menu.Positioner className={menuStyles.Positioner} align={"start"} sideOffset={0}>
          <Menu.Popup className={menuStyles.Popup}>
            {templates.map((template, index) => (
              <Menu.Item key={index} className={menuStyles.Item} onClick={() => insertQuickCreateContent(template)}>{template.name}</Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

export default QuickCreateMenu;
