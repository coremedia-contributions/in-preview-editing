import AddItemsPlugin from "@coremedia/studio-client.ext.ui-components/plugins/AddItemsPlugin";
import ButtonSkin from "@coremedia/studio-client.ext.ui-components/skins/ButtonSkin";
import PreviewIFrameToolbarBase from "@coremedia/studio-client.main.editor-components/sdk/preview/PreviewIFrameToolbarBase";
import Component from "@jangaroo/ext-ts/Component";
import { Config } from "@jangaroo/runtime";
import ConfigUtils from "@jangaroo/runtime/ConfigUtils";
import ToggleInPreviewEditingButton from "../components/ToggleInPreviewEditingButton";

interface AddInPreviewEditingTogglePluginConfig extends Config<AddItemsPlugin> {}

class AddInPreviewEditingTogglePlugin extends AddItemsPlugin {
  declare Config: AddInPreviewEditingTogglePluginConfig;

  constructor(config: Config<AddInPreviewEditingTogglePlugin> = null) {
    super(
      ConfigUtils.apply(
        Config(AddInPreviewEditingTogglePlugin, {
          recursive: true,

          items: [
            Config(ToggleInPreviewEditingButton, {
              itemId: "inPreviewEditingButton",
              ui: ButtonSkin.TOOLBAR.getSkin(),
            }),
          ],
          before: [Config(Component, { itemId: PreviewIFrameToolbarBase.DEVICE_TYPE_SLIDER_SPACER_ITEM_ID })],
        }),
        config,
      ),
    );
  }
}

export default AddInPreviewEditingTogglePlugin;
