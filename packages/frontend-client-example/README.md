# Frontend Client Example

This package provides an example of a frontend client that can be used to interact with the in-preview-editing feature.

The example shows how to include the in-preview-editing feature in a frontend application, how to configure it, and how to use it to edit content.

## Quick Start
```shell
cd packages/frontend-client-example
pnpm install
pnpm run start
```

## Detailed Instructions

Basically, the in-preview-editing-support package is referenced as a dependency in the `package.json` file:

```json
{
  "dependencies": {
    "@coremedia-contributions/in-preview-editing-support": "workspace:*"
  }
}
```

### Loading the required JS
The package can be imported in your JS like this (also see `main.js`):

```javascript
import "@coremedia-contributions/in-preview-editing-support";
```

### Using script tags
As an alternative to loading the required JS with an `import`, the package can also be included in a plain HTML `<script>` tag like this:

```html
<script src="../node_modules/@coremedia-contributions/in-preview-editing-support/dist/coremedia.in-preview-editing-support.js"></script>
<script>
  // call the init function to initialize the in-preview-editing feature
  CoreMediaInPreviewEditing.init();
  
  // activate the in-page editing feature
  window.com.coremedia.pde.activateInPageEditing();
</script>
```

