import { Dialog } from "@base-ui/react/dialog";
import { ScrollArea } from "@base-ui/react/scroll-area";
import { usePortalContainer } from "../hooks/usePortalContainer.ts";
import sidebarStyles from "../styles/components/Sidebar.module.css";
import { type FC } from "react";
import { usePluginContext } from "../context/PluginContext.tsx";
import { isMarkedAsEditable, scrollElementIntoView, scrollToolbarIntoView } from "../lib/utils.ts";
import { LocateIcon, XIcon } from "lucide-react";
import toolbarStyles from "../styles/components/Toolbar.module.css";
import MetadataNodeHolder, { type MetadataNode } from "../lib/metadata-node-holder.ts";
import CollapsiblePanel from "./CollapsiblePanel.tsx";
import { useTranslation } from "react-i18next";

interface Props {

}

const Sidebar: FC<Props> = () => {
  const { t } = useTranslation();
  const container = usePortalContainer();
  const { showSidebar, setShowSidebar, setTargetEl, shadowRoot } = usePluginContext();
  const metadatNodeHolder = MetadataNodeHolder.getInstance();
  metadatNodeHolder.refresh(); // Ensure the metadata tree is up-to-date
  const metadataTree = metadatNodeHolder.tree;

  const updateTargetEl = (el: HTMLElement) => {
    const isEditable = isMarkedAsEditable(el);
    if (!isEditable) {
      scrollElementIntoView(el);
      return;
    }

    setTargetEl(el);

    window.setTimeout(() => {
      scrollToolbarIntoView(shadowRoot);
      if (setShowSidebar) {
        setShowSidebar(false);
      }
    }, 1000);
  };

  const createCmpForNode = (node: MetadataNode, index: number) => {
    return (
      <CollapsiblePanel key={index}>
        <CollapsiblePanel.Header className={node.markedEditable ? sidebarStyles.EditableNodeItemHeader : sidebarStyles.NodeItemHeader}>
          {`<${node.element.tagName.toLowerCase()}>`} {node.metadataId ? `#${node.metadataId}` : ""}{node.markedEditable ? ` ${t("sidebar.editable")}` : ""}
          <span className={sidebarStyles.HeaderSpacer}></span>
          <span className={sidebarStyles.FocusButton} onClick={() => updateTargetEl(node.element)}><LocateIcon width={20} height={20}/></span>
        </CollapsiblePanel.Header>
        <CollapsiblePanel.Body className={node.markedEditable ? sidebarStyles.EditableNodeItemBody : sidebarStyles.NodeItemBody}>
          <div>
            <code className={sidebarStyles.MetadataCode}>{JSON.stringify(node.metadata)}</code>
          </div>
          {node.children && node.children.length > 0 && (
            node.children.map((childNode, childIndex) => createCmpForNode(childNode, childIndex))
          )}
        </CollapsiblePanel.Body>
      </CollapsiblePanel>
    );
  };

  return (
    <Dialog.Root open={showSidebar} onOpenChange={setShowSidebar}>
      <Dialog.Portal container={container}>
        <Dialog.Backdrop className={sidebarStyles.Backdrop}/>
        <Dialog.Viewport className={sidebarStyles.Viewport}>
          <Dialog.Popup className={sidebarStyles.Popup}>
            <div className={sidebarStyles.PopupHeader}>
              <Dialog.Title className={sidebarStyles.Title}>{t("sidebar.title")}</Dialog.Title>
              <div className={sidebarStyles.Actions}>
                <Dialog.Close className={toolbarStyles.Button}>
                  <XIcon/>
                </Dialog.Close>
              </div>
            </div>

            <div>
              <h2>{t("sidebar.metadataNodes")}</h2>
            </div>
            <ScrollArea.Root className={sidebarStyles.Body}>
              <ScrollArea.Viewport className={sidebarStyles.BodyViewport}>
                <ScrollArea.Content className={sidebarStyles.BodyContent}>
                  {metadataTree.map((rootNode, index: number) => {
                    return createCmpForNode(rootNode, index);
                  })}
                </ScrollArea.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className={sidebarStyles.Scrollbar}>
                <ScrollArea.Thumb className={sidebarStyles.ScrollbarThumb}/>
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Sidebar;
