import Config from "@jangaroo/runtime/Config";
import IconButton from "@coremedia/studio-client.ext.ui-components/components/IconButton";
import ConfigUtils from "@jangaroo/runtime/ConfigUtils";
import BindPropertyPlugin from "@coremedia/studio-client.ext.ui-components/plugins/BindPropertyPlugin";
import InPreviewEditingUtil from "../utils/InPreviewEditingUtil";
import Labels_properties from "../Labels_properties";

interface ToggleInPreviewEditingButtonConfig extends Config<IconButton> {}

class ToggleInPreviewEditingButton extends IconButton {
  declare Config: ToggleInPreviewEditingButtonConfig;

  constructor(config: Config<ToggleInPreviewEditingButton> = null) {
    super(
      ConfigUtils.apply(
        Config(ToggleInPreviewEditingButton, {
          iconCls: Labels_properties.ToggleInPreviewEditingButton_icon,
          text: Labels_properties.ToggleInPreviewEditingButton_text,
          tooltip: Labels_properties.ToggleInPreviewEditingButton_tooltip,
          enableToggle: true,
          plugins: [
            Config(BindPropertyPlugin, {
              componentProperty: "pressed",
              bidirectional: true,
              ifUndefined: false,
              bindTo: InPreviewEditingUtil.inPreviewEditingPreferenceExpr(),
            }),
          ],
        }),
        config,
      ),
    );
  }
}

export default ToggleInPreviewEditingButton;
