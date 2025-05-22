import IPropertyEditorRegistry from "./IPropertyEditorRegistry";
import PropertyEditorRegistryImpl from "./PropertyEditorRegistryImpl";

const propertyEditorRegistry: IPropertyEditorRegistry = new PropertyEditorRegistryImpl();

export default propertyEditorRegistry;
