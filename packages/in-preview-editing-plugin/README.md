# In-Preview-Editing Plugin

Add this package to your frontend to support for in-preview editing in Studio preview. This package serves as the frontend part of the in-preview editing feature, allowing users to edit content directly in the preview.

In addition, you need to install the Studio plugin found in `apps/main/in-preview-editing` to enable the feature in Studio.

## Installation
In your frontend, add the following dependency in your `package.json`:

```json
{
  "dependencies": {
    "@coremedia-contributions/in-preview-editing-plugin": "^2.0.0"
  }
}
```

Then include the package in your application:

```javascript
import "@coremedia-contributions/in-preview-editing-plugin";
```

See `packages/frontend-client-example` for a frontend client example that uses this package.

## Provide the necessary document metadata
In your frontend, you need to provide the document necessary metadata for the in-preview editing feature to work. This includes the content id and property name of the content to be edited as well as a flag indicating, that this property can be edited (`{"editable": true}`) in the preview.

For more details on the metadata format, see the [CoreMedia Documentation](https://documentation.coremedia.com/cmcc-12/artifacts/2412.0/webhelp/cae-developer-en/content/DocumentMetadata_FreeMarker.html).

**Example**
```html
<div data-cm-metadata="[{'_':{'$Ref':'content/1234'}}]">
  <h1 data-cm-metadata="[{'_':'properties.title'},{'editable':true}]">Editable Headline</h1>
</div>
```
