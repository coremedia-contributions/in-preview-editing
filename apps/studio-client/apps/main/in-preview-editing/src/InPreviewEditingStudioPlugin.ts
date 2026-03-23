import StudioPlugin from "@coremedia/studio-client.main.editor-components/configuration/StudioPlugin";
import Config from "@jangaroo/runtime/Config";
import ConfigUtils from "@jangaroo/runtime/ConfigUtils";
import InnerPreviewPanel from "@coremedia/studio-client.main.editor-components/sdk/preview/InnerPreviewPanel";
import IEditorContext from "@coremedia/studio-client.main.editor-components/sdk/IEditorContext";
import ImageEditorPropertyField from "@coremedia/studio-client.main.image-editor-components/ImageEditorPropertyField";
import TaxonomyPropertyField from "@coremedia-blueprint/studio-client.main.taxonomy-studio/taxonomy/selection/TaxonomyPropertyField";
import ValueExpressionFactory from "@coremedia/studio-client.client-core/data/ValueExpressionFactory";
import PreviewIFrameToolbar from "@coremedia/studio-client.main.editor-components/sdk/preview/PreviewIFrameToolbar";
import RichTextPropertyField from "@coremedia/studio-client.main.editor-components/sdk/premular/fields/richtext/RichTextPropertyField";
import ImageMapEditor from "@coremedia/studio-client.main.image-map-editor-components/ImageMapEditor";
import AttachInPreviewEditingManagerPlugin from "./plugins/AttachInPreviewEditingManagerPlugin";
import propertyEditorRegistry from "./editors/propertyEditorRegistry";
import AddInPreviewEditingTogglePlugin from "./plugins/AddInPreviewEditingTogglePlugin";

interface InPreviewEditingStudioPluginConfig extends Config<StudioPlugin> {}

class InPreviewEditingStudioPlugin extends StudioPlugin {
  declare Config: InPreviewEditingStudioPluginConfig;

  static readonly xtype: string = "com.coremedia.blueprint.studio.ipe.config.inPreviewEditingStudioPlugin";

  constructor(config: Config<InPreviewEditingStudioPlugin> = null) {
    super(
      ConfigUtils.apply(
        Config(InPreviewEditingStudioPlugin, {
          rules: [
            Config(InnerPreviewPanel, {
              plugins: [Config(AttachInPreviewEditingManagerPlugin)],
            }),

            Config(PreviewIFrameToolbar, {
              plugins: [Config(AddInPreviewEditingTogglePlugin)],
            }),
          ],
          configuration: [],
        }),
        config,
      ),
    );
  }

  override init(editorContext: IEditorContext) {
    super.init(editorContext);

    // register specific property editors
    propertyEditorRegistry.registerEditor(
      "CMPicture",
      "data",
      Config(ImageEditorPropertyField, {
        imageSettingsPropertyName: "localSettings",
      }),
    );
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
    propertyEditorRegistry.registerEditor(
      "CMTeasable",
      "teaserText",
      Config(RichTextPropertyField, {
        editorType: "withStyles",
      }),
    );
    propertyEditorRegistry.registerEditor(
      "CMImageMap",
      "localSettings.image-map",
      Config(ImageMapEditor, {
        structPropertyName: "localSettings",
        areaContentType: "CMTeasable",
      }),
    );
  }
}

export default InPreviewEditingStudioPlugin;
