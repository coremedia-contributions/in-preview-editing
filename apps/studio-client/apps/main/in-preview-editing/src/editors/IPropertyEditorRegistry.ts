import Config from "@jangaroo/runtime/Config";
import Component from "@jangaroo/ext-ts/Component";
import { ContentType } from "@coremedia/studio-client.cap-rest-client";

abstract class IPropertyEditorRegistry {
  abstract registerEditor(contentTypeName: string, propertyName: string, editor: Config<Component>): void;
  abstract getEditor(contentType: ContentType, propertyName: string): Config<Component>;
}

export default IPropertyEditorRegistry;
