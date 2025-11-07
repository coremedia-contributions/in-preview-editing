import Action from "@jangaroo/ext-ts/Action";
import Config from "@jangaroo/runtime/Config";
import ConfigUtils from "@jangaroo/runtime/ConfigUtils";
import { cast } from "@jangaroo/runtime";
import { SvgIconUtil } from "@coremedia/studio-client.base-models";
import { pencil } from "@coremedia/studio-client.common-icons";
import sidePanelManager from "@coremedia/studio-client.main.editor-components/sdk/desktop/sidepanel/sidePanelManager";
import WorkArea from "@coremedia/studio-client.main.editor-components/sdk/desktop/WorkArea";
import ValueExpression from "@coremedia/studio-client.client-core/data/ValueExpression";
import FloatingEditorPanel from "../editors/FloatingEditorPanel";

interface OpenFloatingEditorPanelActionConfig
  extends Config<Action>,
    Partial<Pick<OpenFloatingEditorPanelAction, "enableToggle" | "selectedValuesExpression" | "clearBreadcrumb">> {}

class OpenFloatingEditorPanelAction extends Action {
  declare Config: OpenFloatingEditorPanelActionConfig;
  enableToggle: boolean = false;
  selectedValuesExpression: ValueExpression;
  clearBreadcrumb: boolean = false;

  constructor(config: Config<OpenFloatingEditorPanelAction> = null) {
    // @ts-expect-error Ext JS semantics
    const this$ = this;
    super(
      ConfigUtils.apply(
        Config(OpenFloatingEditorPanelAction, {
          iconCls: SvgIconUtil.getIconStyleClassForSvgIcon(pencil),
          text: "Open",
          tooltip: "Open floating editor",
          handler: () => {
            const dialog: FloatingEditorPanel = cast(
              FloatingEditorPanel,
              sidePanelManager._.getOrCreateComponent(FloatingEditorPanel.panelId),
            );
            if (config.enableToggle && dialog.isVisible()) {
              dialog.hide();
            } else {
              let contentRef = undefined;
              if (config.selectedValuesExpression) {
                const selectedValues = config.selectedValuesExpression.getValue();
                if (selectedValues && selectedValues.length > 0) {
                  contentRef = FloatingEditorPanel.getContentRef(selectedValues[0]);
                }
              }

              if (!contentRef) {
                const activeContentVE = WorkArea.ACTIVE_CONTENT_VALUE_EXPRESSION;
                contentRef = FloatingEditorPanel.getContentRef(activeContentVE.getValue());
              }

              dialog.setPropertyName("gridform");
              dialog.setContentRef(contentRef, config.clearBreadcrumb);
              dialog.setShowBreadcrumb(true);
              dialog.updateEditor();
              dialog.show();
            }
          },
        }),
        config,
      ),
    );
  }
}

export default OpenFloatingEditorPanelAction;
