import Config from "@jangaroo/runtime/Config";
import ConfigUtils from "@jangaroo/runtime/ConfigUtils";
import ValueExpression from "@coremedia/studio-client.client-core/data/ValueExpression";
import ValueExpressionFactory from "@coremedia/studio-client.client-core/data/ValueExpressionFactory";
import session from "@coremedia/studio-client.cap-rest-client/common/session";
import ContentPropertyNames from "@coremedia/studio-client.cap-rest-client/content/ContentPropertyNames";
import ContentLocalizationUtil from "@coremedia/studio-client.cap-base-models/content/ContentLocalizationUtil";
import { bind } from "@jangaroo/runtime";
import SplitButton from "@jangaroo/ext-ts/button/Split";
import ButtonSkin from "@coremedia/studio-client.ext.ui-components/skins/ButtonSkin";
import WindowSkin from "@coremedia/studio-client.ext.ui-components/skins/WindowSkin";
import AnchorLayout from "@jangaroo/ext-ts/layout/container/Anchor";
import BaseField from "@jangaroo/ext-ts/form/field/Base";
import TextLinkButton from "@coremedia-blueprint/studio-client.main.taxonomy-studio/taxonomy/chooser/TextLinkButton";
import TbFill from "@jangaroo/ext-ts/toolbar/Fill";
import Component from "@jangaroo/ext-ts/Component";
import Menu from "@jangaroo/ext-ts/menu/Menu";
import Item from "@jangaroo/ext-ts/menu/Item";
import ApprovePublishAction from "@coremedia/studio-client.ext.cap-base-components/actions/ApprovePublishAction";
import ContentActions_properties from "@coremedia/studio-client.ext.cap-base-components/actions/ContentActions_properties";
import Button from "@jangaroo/ext-ts/button/Button";
import Panel from "@jangaroo/ext-ts/panel/Panel";
import PanelSkin from "@coremedia/studio-client.ext.ui-components/skins/PanelSkin";
import InPreviewEditingUtil from "../utils/InPreviewEditingUtil";
import Labels_properties from "../Labels_properties";

interface FloatingEditorPanelConfig extends Config<Panel> {}

class FloatingEditorPanel extends Panel {
  declare Config: FloatingEditorPanelConfig;

  static override readonly xtype: string = "com.coremedia.labs.studio.pde.config.FloatingEditorPanel";

  #boundContentExpr: ValueExpression = null;
  #propertyNameExpr: ValueExpression = null;
  breadcrumb: string[] = [];
  showBreadcrumb: boolean = false;
  static panelId: string = "FloatingPanelId";

  constructor(config: Config<FloatingEditorPanel> = null) {
    // @ts-expect-error Ext JS semantics
    const this$ = this;
    super(
      ConfigUtils.apply(
        Config(FloatingEditorPanel, {
          title: Labels_properties.FloatingEditorDialog_title,
          stateId: "floatingEditorState",
          cls: "floating-editor",
          stateful: true,
          modal: false,
          width: 400,
          //height: 400,
          // maxHeight: 800,
          autoScroll: true,
          //ui: PanelSkin.FORM_LIGHT.getSkin(),
          ui: PanelSkin.FORM_200.getSkin(),
          constrainHeader: true,
          closeAction: "hide",
          bodyPadding: 5,
          items: [],
          defaultType: BaseField["xtype"],
          defaults: Config<BaseField>({
            labelAlign: "top",
            labelSeparator: "",
            listeners: {
              afterrender: bind(this$, this$.#focusInputField),
            },
          }),
          layout: Config(AnchorLayout),
        }),
        config,
      ),
    );
  }

  #closeAndPublish(): void {
    this.close();

    new ApprovePublishAction({
      contentValueExpression: this.getBoundContentExpression(),
    }).execute();
  }

  protected override onAdd(component: Component, position: number): any {
    component.mon(component, "afterrender", (field) => {
      // clear window height to fit the body content
      this.setHeight(null);
    });

    return super.onAdd(component, position);
  }

  getBoundContentExpression(): ValueExpression {
    if (!this.#boundContentExpr) {
      this.#boundContentExpr = ValueExpressionFactory.createFromValue(null);
      this.#boundContentExpr.addChangeListener((contentExpr: ValueExpression) => {
        contentExpr.extendBy(ContentPropertyNames.NAME).loadValue((contentName) => {
          //this.setTitle(contentName);
        });

        contentExpr.extendBy(ContentPropertyNames.TYPE).loadValue((contentType) => {
          const iconCls = ContentLocalizationUtil.getIconStyleClassForContentType(contentType);
          this.setIconCls(iconCls);
        });
      });
    }
    return this.#boundContentExpr;
  }

  getPropertyNameExpression(): ValueExpression {
    if (!this.#propertyNameExpr) {
      this.#propertyNameExpr = ValueExpressionFactory.createFromValue(null);
    }
    return this.#propertyNameExpr;
  }

  setContentRef(contentRef: string, clearBreadcrumb: boolean): void {
    if (clearBreadcrumb) this.breadcrumb = [];

    const index = this.breadcrumb.indexOf(contentRef);
    if (index < 0) {
      this.breadcrumb.push(contentRef);
    } else {
      this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    }
    console.log("Breadcrump " + this.breadcrumb);

    // update bound content
    const content = session._.getConnection().getContentRepository().getContent(contentRef);
    this.getBoundContentExpression().setValue(content);
  }

  setPropertyName(propertyName: string): void {
    // update property name expression
    this.getPropertyNameExpression().setValue(propertyName);
  }

  setShowBreadcrumb(show: boolean): void {
    this.showBreadcrumb = show;
  }

  updateEditor(): void {
    // console.log(
    //   "[FloatingEditorPanel] Updating property field.",
    //   this.#boundContentExpr.getValue(),
    //   this.#propertyNameExpr.getValue(),
    // );
    this.removeAll();

    // add breadcrumb
    if (this.showBreadcrumb) {
      this.breadcrumb.forEach((item, index) => {
        const content = session._.getConnection().getContentRepository().getContent(item);
        const crumb = Config(Button, {
          style: "text",
          text: shorten(content.getName(), 20),
          tooltip: content.getName(),
          handler: () => {
            this.setContentRef(item, false);
            this.updateEditor();
          },
        });
        this.add(crumb);
        if (index < this.breadcrumb.length - 1) {
          this.add(Config(Button, { text: "/" }));
        }
      });
    }

    const propertyName = this.#propertyNameExpr.getValue();
    this.#boundContentExpr.extendBy(ContentPropertyNames.TYPE).loadValue((ct) => {
      InPreviewEditingUtil.getEditorFor(this.#boundContentExpr.getValue(), propertyName)
        .then((propertyEditor) => {
          this.add(propertyEditor);
        })
        .catch(() => {
          console.log("[FloatingEditorPanel] No editor found for property: " + propertyName);
        });
    });
  }

  #openContentInTabAndClose(): void {
    const contentUri = this.#boundContentExpr.getValue().getUriPath();
    InPreviewEditingUtil.openContentInTab(contentUri, bind(this, this.close));
  }

  #focusInputField(field: any) {
    const defaultFieldSelector = field?.defaultField;
    if (defaultFieldSelector) {
      field.down(defaultFieldSelector)?.focus();
    }
  }
}

function shorten(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str;
}

export default FloatingEditorPanel;
