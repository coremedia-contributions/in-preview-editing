import Content from "@coremedia/studio-client.cap-rest-client/content/Content";
import { AnyFunction, as, cast, is } from "@jangaroo/runtime";
import ContentPropertyNames from "@coremedia/studio-client.cap-rest-client/content/ContentPropertyNames";
import {
  BlobPropertyDescriptor,
  CapPropertyDescriptor,
  CapPropertyDescriptorType,
  ContentType,
  MarkupPropertyDescriptor, Struct
} from "@coremedia/studio-client.cap-rest-client";
import Config from "@jangaroo/runtime/Config";
import BlobPropertyField from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/BlobPropertyField";
import TextBlobPropertyField
  from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/TextBlobPropertyField";
import IntegerPropertyField
  from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/IntegerPropertyField";
import DateTimePropertyField
  from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/DateTimePropertyField";
import StringPropertyField
  from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/StringPropertyField";
import LinkListPropertyField
  from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/LinkListPropertyField";
import markupPropertyFieldConfigMap
  from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/struct/markup/markupPropertyFieldConfigMap/markupPropertyFieldConfigMap";
import ValueExpressionFactory from "@coremedia/studio-client.client-core/data/ValueExpressionFactory";
import ValueExpression from "@coremedia/studio-client.client-core/data/ValueExpression";
import editorPreferences from "@coremedia/studio-client.cap-base-models/preferences/editorPreferences";
import messageService from "@coremedia/studio-client.main.editor-components/sdk/messageService";
import PreviewIFrame from "@coremedia/studio-client.main.editor-components/sdk/preview/PreviewIFrame";
import { getServiceAgent } from "@coremedia/service-agent";
import { createContentFormServiceDescriptor } from "@coremedia/studio-client.content-services-api";
import PlacementField from "@coremedia/studio-client.main.bpbase-pagegrid-studio-plugin/pagegrid/PlacementField";
import cmNavigationTreeRelation
  from "@coremedia/studio-client.main.bpbase-pagegrid-studio-plugin/tree/cmNavigationTreeRelation";
import ValidityColumn from "@coremedia-blueprint/studio-client.main.blueprint-forms/forms/columns/ValidityColumn";
import NameColumn from "@coremedia/studio-client.ext.cap-base-components/columns/NameColumn";
import TypeIconColumn from "@coremedia/studio-client.ext.cap-base-components/columns/TypeIconColumn";
import ViewtypeRenderer from "@coremedia-blueprint/studio-client.main.blueprint-forms/util/ViewtypeRenderer";
import StatusColumn from "@coremedia/studio-client.ext.cap-base-components/columns/StatusColumn";
import DataField from "@coremedia/studio-client.ext.ui-components/store/DataField";
import Column from "@jangaroo/ext-ts/grid/column/Column";
import LinkListThumbnailColumn
  from "@coremedia/studio-client.ext.content-link-list-components/columns/LinkListThumbnailColumn";
import PageGridUtil from "@coremedia/studio-client.main.bpbase-pagegrid-studio-plugin/pagegrid/PageGridUtil";
import ImageMapEditor from "@coremedia/studio-client.main.image-map-editor-components/ImageMapEditor";
import LocaleUtil from "@coremedia/studio-client.cap-base-models/locale/LocaleUtil";
import editorContext from "@coremedia/studio-client.main.editor-components/sdk/editorContext";
import CollectionViewExtension
  from "@coremedia/studio-client.main.editor-components/sdk/collectionview/CollectionViewExtension";
import session from "@coremedia/studio-client.cap-rest-client/common/session";
import OpenNavigationEditorDialogAction
  from "@coremedia-blueprint/studio-client.main.navigation-manager-studio/actions/OpenNavigationEditorDialogAction";
import propertyEditorRegistry from "../editors/propertyEditorRegistry";
import EmptyState from "../editors/EmptyState";
import { observeUserPreferencesProperty } from "@coremedia/studio-client.cap-base-models";
import { filter, firstValueFrom, timeout } from "rxjs";
import RemoteServiceMethod from "@coremedia/studio-client.client-core/data/impl/RemoteServiceMethod";
import StructSubBean from "@coremedia/studio-client.cap-rest-client/common/impl/StructSubBean";
import VariantKeyUtil from "@coremedia/studio-client.main.image-editor-components/VariantKeyUtil";
import PropertyEditorUtil from "@coremedia/studio-client.main.editor-components/sdk/util/PropertyEditorUtil";

class InPreviewEditingUtil {
  static readonly MESSAGE_TYPE_ACTIVATE_IN_PREVIEW_EDITING: string = "com.coremedia.pde.editing.on";
  static readonly MESSAGE_TYPE_DEACTIVATE_IN_PREVIEW_EDITING: string = "com.coremedia.pde.editing.off";

  static readonly IN_PREVIEW_EDITING_PREFERENCE: string = "inPreviewEditingEnabled";

  static inPreviewEditingPreferenceExpr(): ValueExpression {
    return ValueExpressionFactory.create(
      InPreviewEditingUtil.IN_PREVIEW_EDITING_PREFERENCE,
      editorPreferences.getPreferences()
    );
  }

  static async toggleInPageEditing(previewIframe: PreviewIFrame, activate: boolean) {
    let ipeUserPreferences;
    try {
      let userPreferencesObservable = observeUserPreferencesProperty(["ipe"])
        .pipe(
          filter(v => v !== undefined),
          timeout(1000)
        );

      ipeUserPreferences = await firstValueFrom(userPreferencesObservable);
    } catch (e) {
      // ignore
    }

    const contentWindow = previewIframe.getContentWindow();
    console.log(
      `[InPreviewEditingManager] Sending ${activate ? "activate" : "deactivate"} editing message to content window: `,
      contentWindow
    );
    const data = {
      lang: LocaleUtil.getLocale(),
      features: {
        ...ipeUserPreferences
      }
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
      previewIframe
    );

    if (activate) {
      // set focus on iframe to make sure key events are routed to the iframe and not to the studio app
      previewIframe?.getEl()?.focus();
    }
  }

  static getEditorFor(content: Content, propertyPath: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        if (propertyPath.startsWith("placement-")) {
          // special case for page grid placements
          InPreviewEditingUtil.createPlacementEditor(content, propertyPath).then((editor) => resolve(editor));
        } else {
          // lookup registered editor for content and property name
          const propertyName = InPreviewEditingUtil.sanitizePropertyName(propertyPath);
          const propertyLabel = await InPreviewEditingUtil.getPropertyLabel(content, propertyPath);

          let editor: Config<any> = propertyEditorRegistry.getEditor(content.getType(), propertyName);
          if (!editor) {
            // try fallback to generic editor
            const propertyDescriptor = await InPreviewEditingUtil.getPropertyDescriptor(content, propertyName);
            editor = InPreviewEditingUtil.#getGenericEditor(propertyDescriptor);
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
          editor.fieldLabel = propertyLabel || propertyName;
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
                renderer: ViewtypeRenderer.renderer
              }),
              Config(StatusColumn)
            ],
            fields: [
              Config(DataField, {
                name: ValidityColumn.STATUS_ID,
                mapping: "",
                convert: ValidityColumn.convert
              }),
              Config(DataField, {
                name: "viewtypeStatus",
                mapping: "",
                convert: ViewtypeRenderer.convert
              })
            ]
          });

          resolve(editor);
        } catch (e) {
          reject();
        }
      });
    });
  }

  static sanitizePropertyName(propertyName: string): string {
    let result = propertyName;
    if (propertyName.startsWith(ContentPropertyNames.PROPERTIES)) {
      result = result.replace(`${ContentPropertyNames.PROPERTIES}.`, "");
    }
    // do not further sanitize "localSettings" or "layout" properties
    if (!result.startsWith("localSettings.")
      && !result.startsWith("layout.")) {
      result = result.split(".")[0];
    }
    return result;
  }

  static async getPropertyDescriptor(content: Content, propertyPath: string): Promise<CapPropertyDescriptor> {
    console.log(`[PropertyEditorUtil] Retrieving property descriptor for property path '${propertyPath}'.`);
    const contentType = await ValueExpressionFactory.create<ContentType>(ContentPropertyNames.TYPE, content).loadValue();
    const propertyName = InPreviewEditingUtil.sanitizePropertyName(propertyPath);
    let propertyDescriptor = contentType.getDescriptor(propertyName);

    // special case for CMSection, property descriptor needs to be determined by inner struct properties
    if (contentType.getName() === "CMSection" && propertyPath.startsWith("layout")) {
      const sectionPropertyPathArgs = propertyPath.split(".");
      const sectionPropertiesPath = `${ContentPropertyNames.PROPERTIES}.${sectionPropertyPathArgs.slice(0, sectionPropertyPathArgs.length - 1).join(".")}`;
      const sectionPropertiesExpr = ValueExpressionFactory.create<Struct>(sectionPropertiesPath, content);
      const sectionProperties = await sectionPropertiesExpr.loadValue();
      propertyDescriptor = sectionProperties.getType().getDescriptor(sectionPropertyPathArgs[sectionPropertyPathArgs.length - 1]);
    }

    return propertyDescriptor;
  }

  static async getPropertyLabel(content: Content, propertyPath: string): Promise<string> {
    const contentType = await ValueExpressionFactory.create<ContentType>(ContentPropertyNames.TYPE, content).loadValue();
    let localizedPropertyLabel = PropertyEditorUtil.getLocalizedLabel(contentType.getName(), propertyPath);
    if ((!localizedPropertyLabel || localizedPropertyLabel === propertyPath) && propertyPath.indexOf(".") > 0) {
      // special case image editor crops
      const propertyLabel = PropertyEditorUtil.getLocalizedLabel(contentType.getName(), InPreviewEditingUtil.sanitizePropertyName(propertyPath));
      const cropLabel = VariantKeyUtil.getVariantDisplayName(propertyPath.split(".").reverse()[0]);
      if (propertyLabel != propertyPath) {
        localizedPropertyLabel = propertyLabel + `${cropLabel ? ` (${cropLabel})` : ""}`;
      } else if (cropLabel) {
        localizedPropertyLabel = cropLabel;
      }
    }

    // special case for CMSection content, load metadata from inner section struct definition
    if (contentType.getName() === "CMSection" && propertyPath.startsWith("layout")) {
      const sectionPropertyPathArgs = propertyPath.split(".");
      const sectionItemPropertyName = sectionPropertyPathArgs[sectionPropertyPathArgs.length - 1];

      const sectionItemsPath = `${ContentPropertyNames.PROPERTIES}.${sectionPropertyPathArgs.slice(0, 3).join(".")}.items`;
      const sectionItemsExpr = ValueExpressionFactory.create<StructSubBean[]>(sectionItemsPath, content);

      const sectionItems = await sectionItemsExpr.loadValue();
      const sectionItem = sectionItems.find((sectionItem) => sectionItem.get("name") === sectionItemPropertyName);

      localizedPropertyLabel = sectionItem.get("label");
    }

    return localizedPropertyLabel;
  }

  static openContentInTab(
    contentUri: string,
    onSuccess: AnyFunction = () => {},
    onError: AnyFunction = () => {}
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

  static showContentInLibrary(
    contentUri: string,
    onSuccess: AnyFunction = () => {},
    onError: AnyFunction = () => {}
  ): void {
    if (!contentUri) {
      return;
    }

    const content = session._.getConnection().getContentRepository().getContent(contentUri);
    editorContext._.getCollectionViewExtender().findExtension(content, (extension: CollectionViewExtension): void => {
      if (extension) {
        extension.showInTree([content]);
        onSuccess && onSuccess();
      } else {
        onError && onError();
      }
    });
  }

  static openNavigationManager(): void {
    new OpenNavigationEditorDialogAction().execute();
  }

  static async imageUrlToBase64(url: string): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
      if (!url) {
        resolve(null);
        return;
      }
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result as string);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Insert the given content into the given placement.
   * The content will be inserted at the given position or at the end if no position is given.
   *
   * @param context context content
   * @param contentToInsert content to be inserted in placement
   * @param placementName name of the placement
   * @param insertAt optional insertion index
   */
  static insertInPlacement(context: Content, contentToInsert: Content, placementName: string, insertAt = -1) {
    const params = {
      context: context,
      contentToInsert: contentToInsert,
      placementName: placementName,
      insertAt: insertAt
    };

    const remoteServiceMethod = new RemoteServiceMethod("ipe/pagegrid/placement/insert", "POST", true);
    remoteServiceMethod.request(
      params,
      (response) => {console.log("RESPONSE", response);},
      (error) => {console.log("ERROR", error);});
  }

  /**
   * Trigger action on section item.
   *
   * @param content section content containing the item
   * @param sectionItemId id of the section item
   * @param action action to perform
   * @param actionParams optional action parameters
   */
  static triggerSectionItemAction(content: Content, sectionItemId: string, action: string, actionParams = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const params = {
          sectionContent: content,
          sectionItemId: sectionItemId,
          action: action,
          actionParams: actionParams,
        };

        const remoteServiceMethod = new RemoteServiceMethod("ipe/section/item/action", "POST", true);
        remoteServiceMethod.request(
          params,
          (response) => {
            console.log("RESPONSE", response);
            resolve(response.getResponseJSON());
          },
          (error) => {
            console.log("ERROR", error);
            reject(error);
          });
      } catch (e) {
        reject(e);
      }
    });
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
          showThumbnails: true
        });
        break;
      case CapPropertyDescriptorType.MARKUP:
        let markupGrammar = cast(MarkupPropertyDescriptor, descriptor).grammar;
        if (!markupGrammar) {
          console.warn("[InPreviewEditingUtil] No grammar defined for markup property descriptor. Using fallback configuration.");
        }
        propertyField = markupPropertyFieldConfigMap.getConfig(markupGrammar);
        break;
      default:
        propertyField = Config(EmptyState);
      }
    }

    return propertyField;
  }
}

export default InPreviewEditingUtil;
