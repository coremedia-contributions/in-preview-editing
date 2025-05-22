const { jangarooConfig } = require("@jangaroo/core");

module.exports = jangarooConfig({
  type: "code",
  sencha: {
    name: "com.coremedia.blueprint__in-preview-editing-plugin",
    namespace: "com.coremedia.blueprint.studio.ipe",
    studioPlugins: [
      {
        mainClass: "com.coremedia.blueprint.studio.ipe.InPreviewEditingStudioPlugin",
        name: "In-Preview-Editing Plugin",
      },
    ],
  },
});
