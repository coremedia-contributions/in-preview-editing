![CoreMedia Content Cloud Version](https://img.shields.io/static/v1?message=2412&label=CoreMedia%20Content%20Cloud&style=for-the-badge&labelColor=666666&color=672779 "This badge shows the CoreMedia version(s) this project is compatible with.
Please read the versioning section of the project to see what other CoreMedia versions are supported and how to find them.")
![Status](https://img.shields.io/static/v1?message=active&label=Status&style=for-the-badge&labelColor=666666&color=2FAC66
"The status badge describes if the project is maintained. Possible values are active and inactive.
If a project is inactive it means that the development has been discontinued and won't support future CoreMedia versions."
)

# In-Preview-Editing Extension

This Blueprint extension enables in-preview editing in Studio.

![In-Preview-Editing in Studio](/docs/images/in-preview-editing-studio.png "In-Preview-Editing in Studio")

The extension adds a new button to the preview toolbar that allows to toggle in-preview-editing mode. In this mode, the user can edit properties of the displayed content directly in the Studio preview. The changes are saved automatically and can be previewed in real-time. String properties are editable in place, while other properties are opened in a dialog.

## Installation

- From the project's root folder, clone this repository as a submodule of the `extensions` folder.
- Make sure to use the branch name that matches your workspace version. 
```
git submodule add https://github.com/coremedia-contributions/in-preview-editing modules/extensions/in-preview-editing
```

- Use the extension tool in the root folder of the project to link the modules to your workspace.
 ```
mvn -f workspace-configuration/extensions com.coremedia.maven:extensions-maven-plugin:LATEST:sync -Denable=in-preview-editing
```

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
