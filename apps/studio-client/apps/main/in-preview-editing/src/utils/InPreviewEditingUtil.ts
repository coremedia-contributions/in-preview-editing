import Content from "@coremedia/studio-client.cap-rest-client/content/Content";
import { AnyFunction, as, cast, is } from "@jangaroo/runtime";
import ContentPropertyNames from "@coremedia/studio-client.cap-rest-client/content/ContentPropertyNames";
import {
  BlobPropertyDescriptor,
  CapPropertyDescriptor,
  CapPropertyDescriptorType,
  ContentType,
  MarkupPropertyDescriptor,
} from "@coremedia/studio-client.cap-rest-client";
import Config from "@jangaroo/runtime/Config";
import BlobPropertyField from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/BlobPropertyField";
import TextBlobPropertyField from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/TextBlobPropertyField";
import IntegerPropertyField from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/IntegerPropertyField";
import DateTimePropertyField from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/DateTimePropertyField";
import StringPropertyField from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/StringPropertyField";
import LinkListPropertyField from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/LinkListPropertyField";
import markupPropertyFieldConfigMap from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/struct/markup/markupPropertyFieldConfigMap/markupPropertyFieldConfigMap";
import ContentTypeImpl from "@coremedia/studio-client.cap-rest-client-impl/content/impl/ContentTypeImpl";
import ValueExpressionFactory from "@coremedia/studio-client.client-core/data/ValueExpressionFactory";
import ValueExpression from "@coremedia/studio-client.client-core/data/ValueExpression";
import editorPreferences from "@coremedia/studio-client.cap-base-models/preferences/editorPreferences";
import messageService from "@coremedia/studio-client.main.editor-components/sdk/messageService";
import PreviewIFrame from "@coremedia/studio-client.main.editor-components/sdk/preview/PreviewIFrame";
import { getServiceAgent } from "@coremedia/service-agent";
import { createContentFormServiceDescriptor } from "@coremedia/studio-client.content-services-api";
import PlacementField from "@coremedia/studio-client.main.bpbase-pagegrid-studio-plugin/pagegrid/PlacementField";
import cmNavigationTreeRelation from "@coremedia/studio-client.main.bpbase-pagegrid-studio-plugin/tree/cmNavigationTreeRelation";
import ValidityColumn from "@coremedia-blueprint/studio-client.main.blueprint-forms/forms/columns/ValidityColumn";
import NameColumn from "@coremedia/studio-client.ext.cap-base-components/columns/NameColumn";
import TypeIconColumn from "@coremedia/studio-client.ext.cap-base-components/columns/TypeIconColumn";
import ViewtypeRenderer from "@coremedia-blueprint/studio-client.main.blueprint-forms/util/ViewtypeRenderer";
import StatusColumn from "@coremedia/studio-client.ext.cap-base-components/columns/StatusColumn";
import DataField from "@coremedia/studio-client.ext.ui-components/store/DataField";
import Column from "@jangaroo/ext-ts/grid/column/Column";
import LinkListThumbnailColumn from "@coremedia/studio-client.ext.content-link-list-components/columns/LinkListThumbnailColumn";
import PageGridUtil from "@coremedia/studio-client.main.bpbase-pagegrid-studio-plugin/pagegrid/PageGridUtil";
import ImageMapEditor from "@coremedia/studio-client.main.image-map-editor-components/ImageMapEditor";
import EmptyState from "../editors/EmptyState";
import propertyEditorRegistry from "../editors/propertyEditorRegistry";
import LocaleUtil from "@coremedia/studio-client.cap-base-models/locale/LocaleUtil";

class InPreviewEditingUtil {
  static readonly MESSAGE_TYPE_ACTIVATE_IN_PREVIEW_EDITING: string = "com.coremedia.pde.editing.on";
  static readonly MESSAGE_TYPE_DEACTIVATE_IN_PREVIEW_EDITING: string = "com.coremedia.pde.editing.off";

  static readonly IN_PREVIEW_EDITING_PREFERENCE: string = "inPreviewEditingEnabled";

  static inPreviewEditingPreferenceExpr(): ValueExpression {
    return ValueExpressionFactory.create(
      InPreviewEditingUtil.IN_PREVIEW_EDITING_PREFERENCE,
      editorPreferences.getPreferences(),
    );
  }

  static toggleInPageEditing(previewIframe: PreviewIFrame, activate: boolean): void {
    const contentWindow = previewIframe.getContentWindow();
    console.log(
      `[InPreviewEditingManager] Sending ${activate ? "activate" : "deactivate"} editing message to content window: `,
      contentWindow,
    );
    let data = {
      lang: LocaleUtil.getLocale()
    };
    messageService.sendMessage(
      contentWindow,
      activate
        ? InPreviewEditingUtil.MESSAGE_TYPE_ACTIVATE_IN_PREVIEW_EDITING
        : InPreviewEditingUtil.MESSAGE_TYPE_DEACTIVATE_IN_PREVIEW_EDITING,
      data,
      (responseBody: any): void => {
        console.log("[InPreviewEditingManager] Message response response: ", responseBody);
      },
      previewIframe,
    );
  }

  static getEditorFor(content: Content, propertyPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (propertyPath.startsWith("placement-")) {
          // special case for page grid placements
          InPreviewEditingUtil.createPlacementEditor(content, propertyPath).then((editor) => resolve(editor));
        } else {
          // lookup registered editor for content and property name
          const propertyName = InPreviewEditingUtil.sanitizePropertyName(propertyPath);
          let editor: Config<any> = propertyEditorRegistry.getEditor(content.getType(), propertyName);
          if (!editor) {
            // try fallback to generic editor
            const contentType = as(content.getType(), ContentTypeImpl);
            editor = InPreviewEditingUtil.#getGenericEditor(
              InPreviewEditingUtil.getPropertyDescriptor(contentType, propertyName),
            );
          }

          if (!editor) {
            // fallback to empty state
            editor = Config(EmptyState);
          }

          const bindTo = ValueExpressionFactory.createFromValue(content);

          // special case for image map editor
          if (is(editor, ImageMapEditor)) {
            editor.imageBlobValueExpression = bindTo.extendBy("properties.pictures.0.properties.data");
          }

          // configure editor
          editor.propertyName = propertyName;
          editor.fieldLabel = propertyName;
          editor.bindTo = bindTo;
          editor.forceReadOnlyValueExpression = ValueExpressionFactory.createFromValue(false); // TODO: Take access rights into consideration

          resolve(editor);
        }
      } catch (e) {
        reject();
      }
    });
  }

  static createPlacementEditor(content: Content, propertyPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const placementName = propertyPath.replace("placement-", "");
      const layoutPropertyPath =
        ContentPropertyNames.PROPERTIES + "." + PageGridUtil.getLayoutPropertyPath("placement");

      ValueExpressionFactory.create(layoutPropertyPath, content).loadValue((layout: Content) => {
        try {
          const sections = PageGridUtil.getSections(layout);
          const placement = sections.find((section) => section.getName() === placementName);
          const placementPropertyPath = PageGridUtil.getPlacementPropertyPath("placement", placement);

          const editor = Config(PlacementField, {
            propertyName: placementPropertyPath,
            bindTo: ValueExpressionFactory.createFromValue(content),
            forceReadOnlyValueExpression: ValueExpressionFactory.createFromValue(false), // TODO: Take access rights into consideration
            anchor: "100%",
            section: as(placement, Content),
            propertyFieldName: propertyPath,
            pageTreeRelation: cmNavigationTreeRelation,
            structPropertyName: "placements",
            linkType: "CMTeasable",
            collapsible: false,
            columns: [
              Config(LinkListThumbnailColumn),
              Config(TypeIconColumn),
              Config(NameColumn),
              Config(ValidityColumn),
              Config(Column, {
                stateId: "viewTypeUrl",
                width: 40,
                sortable: false,
                dataIndex: "viewtypeStatus",
                fixed: true,
                renderer: ViewtypeRenderer.renderer,
              }),
              Config(StatusColumn),
            ],
            fields: [
              Config(DataField, {
                name: ValidityColumn.STATUS_ID,
                mapping: "",
                convert: ValidityColumn.convert,
              }),
              Config(DataField, {
                name: "viewtypeStatus",
                mapping: "",
                convert: ViewtypeRenderer.convert,
              }),
            ],
          });

          resolve(editor);
        } catch (e) {
          reject();
        }
      });
    });
  }

  static sanitizePropertyName(propertyName: string): string {
    let result = propertyName.replace(`${ContentPropertyNames.PROPERTIES}.`, "");
    // do not sanitize localSettings
    if (!result.startsWith("localSettings.")) {
      result = result.split(".")[0];
    }
    return result;
  }

  static getPropertyDescriptor(contentType: ContentType, propertyPath: string): CapPropertyDescriptor {
    console.log(`[PropertyEditorUtil] Retrieving property descriptor for property path '${propertyPath}'.`);
    const propertyName = InPreviewEditingUtil.sanitizePropertyName(propertyPath);
    return contentType.getDescriptor(propertyName);
  }

  static openContentInTab(
    contentUri: string,
    onSuccess: AnyFunction = () => {},
    onError: AnyFunction = () => {},
  ): void {
    if (!contentUri) {
      return;
    }

    getServiceAgent()
      .getService(createContentFormServiceDescriptor())
      ?.fetch()
      .then((contentFormService) => {
        contentFormService.openContentForm(contentUri).then((success) => {
          if (success) {
            onSuccess();
          }
        });
      })
      .catch(onError);
  }

  static #getGenericEditor(descriptor: CapPropertyDescriptor) {
    let propertyField: any = null;

    if (descriptor) {
      switch (descriptor.type) {
        case CapPropertyDescriptorType.BLOB:
          const blobPropertyDescriptor = cast(BlobPropertyDescriptor, descriptor);
          const mimeParts = blobPropertyDescriptor.contentType.split("/");
          switch (mimeParts[0]) {
            case "text":
              propertyField = Config(TextBlobPropertyField);
              break;
            default:
              propertyField = Config(BlobPropertyField);
              cast(BlobPropertyField, propertyField).contentType = blobPropertyDescriptor.contentType;
          }
          break;
        case CapPropertyDescriptorType.INTEGER:
          propertyField = Config(IntegerPropertyField);
          break;
        case CapPropertyDescriptorType.DATE:
          propertyField = Config(DateTimePropertyField);
          as(propertyField, DateTimePropertyField).timeZoneHidden = true;
          break;
        case CapPropertyDescriptorType.STRING:
          propertyField = Config(StringPropertyField);
          break;
        case CapPropertyDescriptorType.LINK:
          propertyField = Config(LinkListPropertyField, {
            showThumbnails: true,
          });
          break;
        case CapPropertyDescriptorType.MARKUP:
          const markupGrammar = cast(MarkupPropertyDescriptor, descriptor).grammar;
          if (markupGrammar) {
            propertyField = markupPropertyFieldConfigMap.getConfig(markupGrammar);
          }
          break;
        default:
          propertyField = Config(EmptyState);
      }
    }

    return propertyField;
  }
}

export default InPreviewEditingUtil;
