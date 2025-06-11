import Component from "@jangaroo/ext-ts/Component";
import { mixin } from "@jangaroo/runtime";
import Config from "@jangaroo/runtime/Config";
import ContentType from "@coremedia/studio-client.cap-rest-client/content/ContentType";
import IPropertyEditorRegistry from "./IPropertyEditorRegistry";

class PropertyEditorRegistryImpl implements IPropertyEditorRegistry {
  #propertyEditors: Map<string, Map<string, Config<Component>>> = new Map();

  registerEditor(contentTypeName: string, propertyName: string, editor: Config<Component>): void {
    const editorsForType = this.#propertyEditors.get(contentTypeName);
    if (!editorsForType) {
      const map = new Map();
      map.set(propertyName, editor);
      this.#propertyEditors.set(contentTypeName, map);
    } else {
      editorsForType.set(propertyName, editor);
    }
  }

  getEditor(contentType: ContentType, propertyName: string): Config<Component> {
    const editorsForType = this.#propertyEditors.get(contentType.getName());
    if (editorsForType) {
      return editorsForType.get(propertyName);
    } else if (contentType.getParent()) {
      return this.getEditor(contentType.getParent(), propertyName);
    }
    return null;
  }
}

mixin(PropertyEditorRegistryImpl, IPropertyEditorRegistry);

export default PropertyEditorRegistryImpl;
