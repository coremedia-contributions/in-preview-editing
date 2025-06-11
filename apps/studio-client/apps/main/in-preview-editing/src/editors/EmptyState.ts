import Config from "@jangaroo/runtime/Config";
import ConfigUtils from "@jangaroo/runtime/ConfigUtils";
import Labels_properties from "../Labels_properties";
import EmptyContainer from "@coremedia/studio-client.ext.ui-components/components/EmptyContainer";

interface EmptyStateConfig extends Config<EmptyContainer> {}

class EmptyState extends EmptyContainer {
  declare Config: EmptyStateConfig;

  constructor(config: Config<EmptyState> = null) {
    super(
      ConfigUtils.apply(
        Config(EmptyState, {
          title: Labels_properties.FloatingEditorDialog_emptyState_title,
          text: Labels_properties.FloatingEditorDialog_emptyState_text,
        }),
        config,
      ),
    );
  }
}

export default EmptyState;
