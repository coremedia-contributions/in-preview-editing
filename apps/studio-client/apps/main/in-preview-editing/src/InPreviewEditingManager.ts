import messageService from "@coremedia/studio-client.main.editor-components/sdk/messageService";
import PreviewIFrame from "@coremedia/studio-client.main.editor-components/sdk/preview/PreviewIFrame";
import { as, bind } from "@jangaroo/runtime";
import PreviewMessageTypes from "@coremedia/studio-client.main.editor-components/sdk/preview/PreviewMessageTypes";
import session from "@coremedia/studio-client.cap-rest-client/common/session";
import ContentPropertyNames from "@coremedia/studio-client.cap-rest-client/content/ContentPropertyNames";
import ValueExpressionFactory from "@coremedia/studio-client.client-core/data/ValueExpressionFactory";
import ContentType from "@coremedia/studio-client.cap-rest-client/content/ContentType";
import Right from "@coremedia/studio-client.cap-rest-client/content/authorization/Right";
import VariantKeyUtil from "@coremedia/studio-client.main.image-editor-components/VariantKeyUtil";
import Content from "@coremedia/studio-client.cap-rest-client/content/Content";
import ContentLocalizationUtil from "@coremedia/studio-client.cap-base-models/content/ContentLocalizationUtil";
import PropertyEditorUtil from "@coremedia/studio-client.main.editor-components/sdk/util/PropertyEditorUtil";
import ImageUtil from "@coremedia/studio-client.cap-base-models/util/ImageUtil";
import thumbnailService from "@coremedia/studio-client.cap-base-models/thumbnails/thumbnailService";
import toastService from "@coremedia/studio-client.ext.toast-components/toastService";
import ValidationState from "@coremedia/studio-client.ext.ui-components/mixins/ValidationState";
import PublicationResult from "@coremedia/studio-client.cap-rest-client/content/results/PublicationResult";
import Publisher_properties from "@coremedia/studio-client.cap-base-models/publication/Publisher_properties";
import StringUtil from "@jangaroo/ext-ts/String";
import FloatingEditorDialog from "./editors/FloatingEditorDialog";
import InPreviewEditingUtil from "./utils/InPreviewEditingUtil";

class InPreviewEditingManager {
  #previewIframe: PreviewIFrame = null;
  #floatingEditorDialog: FloatingEditorDialog = null;

  static readonly MESSAGE_TYPE_CONTENT_METADATA_REQUEST: string = "com.coremedia.pde.content.metadata.request";
  static readonly MESSAGE_TYPE_CONTENT_METADATA_RESPONSE: string = "com.coremedia.pde.content.metadata.response";
  static readonly MESSAGE_TYPE_PROPERTY_UPDATE: string = "com.coremedia.pde.propertyUpdate";
  static readonly MESSAGE_TYPE_SHOW_EDITOR: string = "com.coremedia.pde.showEditor";
  static readonly MESSAGE_TYPE_OPEN_CONTENT: string = "com.coremedia.pde.openContent";
  static readonly MESSAGE_TYPE_PUBLISH_REQUEST: string = "com.coremedia.pde.content.publish.request";

  constructor(previewIFrame: PreviewIFrame) {
    this.#previewIframe = previewIFrame;

    this.#attachMessageListeners();
  }

  #attachMessageListeners(): void {
    const iframeEl = this.#getIFrameEl();

    if (iframeEl) {
      window.setTimeout(() => {
        console.log("[InPreviewEditingManager] register message listeners on iframe: ", iframeEl);

        // register preview init listener
        messageService.registerMessageListener(iframeEl, PreviewMessageTypes.INIT, bind(this, this.#initListener));

        // register preview ready listener
        messageService.registerMessageListener(iframeEl, PreviewMessageTypes.READY, bind(this, this.#readyListener));

        // register property update listener
        messageService.registerMessageListener(
          iframeEl,
          InPreviewEditingManager.MESSAGE_TYPE_PROPERTY_UPDATE,
          bind(this, this.#propertyUpdateListener),
        );

        // register show floating editor listener
        messageService.registerMessageListener(
          iframeEl,
          InPreviewEditingManager.MESSAGE_TYPE_SHOW_EDITOR,
          bind(this, this.#showFloatingEditorListener),
        );

        // register content metadata listener
        messageService.registerMessageListener(
          iframeEl,
          InPreviewEditingManager.MESSAGE_TYPE_CONTENT_METADATA_REQUEST,
          bind(this, this.#contentMetadataListener),
        );

        // register open content listener
        messageService.registerMessageListener(
          iframeEl,
          InPreviewEditingManager.MESSAGE_TYPE_OPEN_CONTENT,
          bind(this, this.#openContentListener),
        );

        // register publish request listener
        messageService.registerMessageListener(
          iframeEl,
          InPreviewEditingManager.MESSAGE_TYPE_PUBLISH_REQUEST,
          bind(this, this.#contentPublishListener),
        );

        this.activateInPreviewEditingIfEnabled();
      }, 10000);
    }
  }

  activateInPreviewEditingIfEnabled(): void {
    // send message to activate in-page editing
    const inPreviewEditingPreferenceExpr = InPreviewEditingUtil.inPreviewEditingPreferenceExpr();
    inPreviewEditingPreferenceExpr.loadValue((inPreviewEditingEnabled) => {
      InPreviewEditingUtil.toggleInPageEditing(this.#previewIframe, inPreviewEditingEnabled);
    });

    inPreviewEditingPreferenceExpr.addChangeListener((ve) => {
      const activated = ve.getValue();
      InPreviewEditingUtil.toggleInPageEditing(this.#previewIframe, activated);
    });
  }

  #initListener() {
    console.log("[InPreviewEditingManager] Received init event");
  }

  #readyListener() {
    console.log("[InPreviewEditingManager] Received ready event");
    this.activateInPreviewEditingIfEnabled();
  }

  #propertyUpdateListener(event: { contentId: string; propertyName: string; propertyValue: any }): void {
    console.log("[InPreviewEditingManager] Received property update event: ", event);

    if (event.contentId && event.propertyName && event.propertyValue) {
      const contentId = event.contentId.startsWith("content/") ? event.contentId : `content/${event.contentId}`;
      const content = session._.getConnection().getContentRepository().getContent(contentId);
      if (content) {
        const propertyPath = `${ContentPropertyNames.PROPERTIES}.${event.propertyName}`;
        const propertyExpression = ValueExpressionFactory.create(propertyPath, content);
        propertyExpression.loadValue((oldValue) => {
          if (event.propertyValue !== oldValue) {
            console.log(
              `[InPreviewEditingManager] Updating content ${content}. (oldValue: ${oldValue}, updatedValue: ${event.propertyValue}`,
            );
            propertyExpression.setValue(event.propertyValue);
          }
        });
      }
    }
  }

  #showFloatingEditorListener(event: { contentId: string; propertyName: string; coords: DOMRect }): void {
    const dialog = this.getFloatingEditorDialog();

    const iframeEl = this.#getIFrameEl();
    const posX = iframeEl.getBoundingClientRect().x + 200;
    const posY = iframeEl.getBoundingClientRect().y;

    dialog.show();
    dialog.setXY([posX, posY]);
    dialog.setPropertyName(event.propertyName);
    dialog.setContentRef(event.contentId);
    dialog.updateEditor();
  }

  #openContentListener(event: { contentRef: string }) {
    InPreviewEditingUtil.openContentInTab(event.contentRef);
  }

  #contentMetadataListener(event: { contentRef: string; propertyName: string }): void {
    console.log("[InPreviewEditingManager] Received content metadata request event: ", event);
    this.#calculateContentMetadata(event.contentRef, event.propertyName)
      .then(bind(this, this.#sendContentMetadataResponse))
      .catch((e) => {
        console.log("[InPreviewEditingManager] Error while loading content metadata: ", e);
      });
  }

  #calculateContentMetadata(contentRef: string, propertyName: string) {
    return new Promise<unknown>((resolve, reject) => {
      const content = session._.getConnection().getContentRepository().getContent(contentRef);
      if (!content || !propertyName) {
        reject();
      }

      Promise.all([
        this.#loadContentName(content),
        this.#loadContentTypeName(content),
        this.#loadContentStatus(content),
        this.#loadUserMayPerformPublish(content),
        this.#loadContentThumbnail(content),
        this.#loadPropertyMetadata(content, propertyName),
      ])
        .then((results) => {
          const metadata = Object.assign({ contentRef: contentRef, contentId: content.getId() }, ...results);
          resolve(metadata);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  #contentPublishListener(event: { contentRef: string; propertyName: string }): void {
    // TODO: Consider publication rights and decide to either directly publish or show start workflow dialog instead
    console.log("[InPreviewEditingManager] Received content publish request event: ", event);
    const contentRepository = session._.getConnection().getContentRepository();
    const content = contentRepository.getContent(event.contentRef);
    if (content) {
      contentRepository
        .getPublicationService()
        .approveWithPathAndPublish(content)
        .then((result: PublicationResult) => {
          if (result.successful) {
            const title = Publisher_properties.publicationNotification_approvePublish_succeeded_title;
            const text = StringUtil.format(
              Publisher_properties.publicationNotification_approvePublish_succeeded_single_text,
              content.getName(),
            );
            toastService._.showToast(title, text, ValidationState.SUCCESS);
          } else {
            const title = Publisher_properties.publicationResult_approvePublish_failed_title;
            const text = Publisher_properties.publicationResult_approvePublish_failed_changeSet_sg_message;
            toastService._.showToast(title, text, ValidationState.ERROR);
          }

          this.#calculateContentMetadata(event.contentRef, event.propertyName)
            .then(bind(this, this.#sendContentMetadataResponse))
            .catch((e) => {
              console.log("[InPreviewEditingManager] Error while loading content metadata: ", e);
            });
        })
        .catch((e) => {
          console.log("[InPreviewEditingManager] Error while publishing content: ", e);
        });
    }
  }

  #loadContentName(content: Content) {
    return new Promise((resolve, reject) => {
      if (!content) {
        reject();
      } else {
        ValueExpressionFactory.create(ContentPropertyNames.NAME, content).loadValue((name: string) => {
          resolve({ contentName: name });
        });
      }
    });
  }

  #loadContentTypeName(content: Content) {
    return new Promise((resolve, reject) => {
      if (!content) {
        reject();
      } else {
        ValueExpressionFactory.create(ContentPropertyNames.TYPE, content).loadValue((contentType: ContentType) => {
          const localizedName = ContentLocalizationUtil.localizeDocumentTypeName(contentType.getName());
          resolve({
            contentType: contentType.getName(),
            contentTypeLabel: localizedName,
          });
        });
      }
    });
  }

  #loadContentStatus(content: Content) {
    return new Promise((resolve, reject) => {
      if (!content) {
        reject();
      } else {
        content.load().then(() => {
          resolve({ status: content.getLifecycleStatus() });
        });
      }
    });
  }

  #loadUserMayPerformPublish(content: Content) {
    return new Promise((resolve, reject) => {
      if (!content) {
        reject();
      } else {
        ValueExpressionFactory.createFromFunction(() => {
          return (
            !content.isCheckedOutByOther() &&
            content.getRepository().getAccessControl().mayPerform(content, Right.PUBLISH)
          );
        }).loadValue((mayPerformPublish) => {
          resolve({ userMayPerformPublish: mayPerformPublish });
        });
      }
    });
  }

  #loadContentThumbnail(content: Content) {
    return new Promise((resolve, reject) => {
      if (!content) {
        reject();
      } else {
        ValueExpressionFactory.createFromFunction(() =>
          thumbnailService._.getThumbnailUri(content, ImageUtil.getCroppingOperation(50, 50)),
        ).loadValue((thumbUri) => {
          resolve({ contentThumbnail: thumbUri ? `${window.location.origin}/${thumbUri}` : null });
        });
      }
    });
  }

  #loadPropertyMetadata(content: Content, propertyName: string) {
    return new Promise((resolve, reject) => {
      if (!content || !propertyName) {
        reject();
      } else {
        ValueExpressionFactory.create(ContentPropertyNames.TYPE, content).loadValue((contentType: ContentType) => {
          let localizedPropertyLabel = PropertyEditorUtil.getLocalizedLabel(contentType.getName(), propertyName);
          if ((!localizedPropertyLabel || localizedPropertyLabel === propertyName) && propertyName.indexOf(".") > 0) {
            // special case image editor crops
            const propertyLabel = PropertyEditorUtil.getLocalizedLabel(
              contentType.getName(),
              InPreviewEditingUtil.sanitizePropertyName(propertyName),
            );
            const cropLabel = VariantKeyUtil.getVariantDisplayName(propertyName.split(".").reverse()[0]);
            if (propertyLabel != propertyName) {
              localizedPropertyLabel = propertyLabel + `${cropLabel ? ` (${cropLabel})` : ""}`;
            } else if (cropLabel) {
              localizedPropertyLabel = cropLabel;
            }
          }

          // get property descriptor
          const propertyDescriptor = InPreviewEditingUtil.getPropertyDescriptor(contentType, propertyName);

          resolve({
            propertyName: propertyName,
            propertyLabel: localizedPropertyLabel,
            propertyType: propertyDescriptor?.type || "unknown",
          });
        });
      }
    });
  }

  #sendContentMetadataResponse(metadata: any): void {
    const contentWindow = this.#previewIframe.getContentWindow();
    const data = {
      metadata: metadata,
    };
    console.log("[InPreviewEditingManager] Sending content metadata response: ", data);
    messageService.sendMessage(contentWindow, InPreviewEditingManager.MESSAGE_TYPE_CONTENT_METADATA_RESPONSE, data);
  }

  getFloatingEditorDialog(): FloatingEditorDialog {
    if (!this.#floatingEditorDialog) {
      this.#floatingEditorDialog = new FloatingEditorDialog();
    }
    return this.#floatingEditorDialog;
  }

  #getIFrameEl(): HTMLIFrameElement {
    return as(this.#previewIframe.getEl().dom, HTMLIFrameElement);
  }
}

export default InPreviewEditingManager;
