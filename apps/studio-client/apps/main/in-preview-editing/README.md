# In-Preview-Editing Studio Plugin

Add this plugin to your Studio to enable in-preview editing. This plugin provides the necessary backend functionality to support in-preview editing in Studio preview in combination with a frontend client that uses the `in-preview-editing-support` package.

## Registration of specific property editors for the editor overlay

For some properties, you might want to register a specific property editor, such as the image editor for pictures or the taxonomy editors for taxonomy properties. You can do this by adding the following to your Studio plugin code:

```typescript
class MyStudioPlugin extends StudioPlugin {
  
  override init(editorContext: IEditorContext) {
    super.init(editorContext);

    // registers the ImageEditorPropertyField for the "data" property of CMPicture.
    propertyEditorRegistry.registerEditor(
      "CMPicture",
      "data",
      Config(ImageEditorPropertyField, {
        imageSettingsPropertyName: "localSettings",
      }),
    );

    // registers the TaxonomyPropertyField for the "subjectTaxonomy" and "locationTaxonomy" properties of CMTeasable
    propertyEditorRegistry.registerEditor(
      "CMTeasable",
      "subjectTaxonomy",
      Config(TaxonomyPropertyField, {
        taxonomyIdExpression: ValueExpressionFactory.createFromValue("Subject"),
      }),
    );
    propertyEditorRegistry.registerEditor(
      "CMTeasable",
      "locationTaxonomy",
      Config(TaxonomyPropertyField, {
        taxonomyIdExpression: ValueExpressionFactory.createFromValue("Location"),
      }),
    );
    
  }
  
}
```

See `InPreviewEditingStudioPlugin.ts` for the default property editor registrations.
