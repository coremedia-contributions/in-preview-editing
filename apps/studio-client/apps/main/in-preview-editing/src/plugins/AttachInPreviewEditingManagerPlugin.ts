import Config from "@jangaroo/runtime/Config";
import AbstractPlugin from "@jangaroo/ext-ts/plugin/Abstract";
import Component from "@jangaroo/ext-ts/Component";
import InnerPreviewPanel from "@coremedia/studio-client.main.editor-components/sdk/preview/InnerPreviewPanel";
import { as } from "@jangaroo/runtime";
import InPreviewEditingManager from "../InPreviewEditingManager";

interface AttachInPreviewEditingManagerPluginConfig extends Config<AbstractPlugin> {}

class AttachInPreviewEditingManagerPlugin extends AbstractPlugin {
  declare Config: AttachInPreviewEditingManagerPluginConfig;

  #manager = null;

  constructor(config: Config<AttachInPreviewEditingManagerPlugin> = null) {
    super(config);
  }

  override init(host: Component): any {
    super.init(host);

    const innerPreviewPanel = as(host, InnerPreviewPanel);
    innerPreviewPanel.mon(innerPreviewPanel, "afterrender", () => {
      this.#manager = new InPreviewEditingManager(innerPreviewPanel.getIFrame());
    });
  }
}

export default AttachInPreviewEditingManagerPlugin;
