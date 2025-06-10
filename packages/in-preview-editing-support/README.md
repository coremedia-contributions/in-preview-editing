# In-Preview-Editing Support

Add this package to your frontend to support for in-preview editing in Studio preview. This packages serves as the frontend part of the in-preview editing feature, allowing users to edit content directly in the preview.

In addition, you need to install the Studio plugin found in `apps/main/in-preview-editing` to enable the feature in Studio.

## Installation
In your frontend, add a dependency to your `package.json`:

```json
{
  "dependencies": {
    "@coremedia-contributions/in-preview-editing-support": "^1.0.0"
  }
}
```

Then include the package in your application:

```javascript
import "@coremedia-contributions/in-preview-editing-support";
```

See `packages/frontend-client-example` for a frontend client example that uses this package.

## Provide the necessary document metadata
In your frontend, you need to provide the document necessary metadata for the in-preview editing feature to work. This includes the content id and property name of the content to be edited as well as a flag indicating, that this property can be edited (`{"editable": true}`) in the preview.

For more details on the metadata format, see the [CoreMedia Documentation](https://documentation.coremedia.com/cmcc-12/artifacts/2412.0/webhelp/cae-developer-en/content/DocumentMetadata_FreeMarker.html).

**Example**
```html
<div data-cm-metadata="[{&quot;_&quot;:{&quot;$Ref&quot;:&quot;content/1234&quot;}}]">
  <h1 data-cm-metadata="[{&quot;_&quot;:&quot;properties.title&quot;},{&quot;editable&quot;:true}]">Editable Headline</h1>
</div>
```
