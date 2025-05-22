import Config from "@jangaroo/runtime/Config";
import IconButton from "@coremedia/studio-client.ext.ui-components/components/IconButton";
import ConfigUtils from "@jangaroo/runtime/ConfigUtils";
import { openWcsInTab } from "@coremedia/studio-client.common-icons";
import { SvgIconUtil } from "@coremedia/studio-client.base-models";
import BindPropertyPlugin from "@coremedia/studio-client.ext.ui-components/plugins/BindPropertyPlugin";
import InPreviewEditingUtil from "../utils/InPreviewEditingUtil";

interface ToggleInPreviewEditingButtonConfig extends Config<IconButton> {}

class ToggleInPreviewEditingButton extends IconButton {
  declare Config: ToggleInPreviewEditingButtonConfig;

  constructor(config: Config<ToggleInPreviewEditingButton> = null) {
    super(
      ConfigUtils.apply(
        Config(ToggleInPreviewEditingButton, {
          iconCls: SvgIconUtil.getIconStyleClassForSvgIcon(openWcsInTab),
          text: "Toggle in preview editing",
          tooltip: "Toggle in preview editing",
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
