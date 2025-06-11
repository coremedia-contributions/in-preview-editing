import Config from "@jangaroo/runtime/Config";
import ConfigUtils from "@jangaroo/runtime/ConfigUtils";
import TitledStudioAnimation from "@coremedia/studio-client.ext.base-components/animations/TitledStudioAnimation";
import Animations from "@coremedia/studio-client.ext.animation-components/components/Animations";
import AnimationImages from "@coremedia/studio-client.ext.animation-components/components/AnimationImages";
import Labels_properties from "../Labels_properties";

interface EmptyStateConfig extends Config<TitledStudioAnimation> {}

class EmptyState extends TitledStudioAnimation {
  declare Config: EmptyStateConfig;

  constructor(config: Config<EmptyState> = null) {
    super(
      ConfigUtils.apply(
        Config(EmptyState, {
          svgs: AnimationImages.EMPTY_SEARCH_IMAGES,
          animations: Animations.EMPTY_SEARCH_ANIMATIONS,
          title: Labels_properties.FloatingEditorDialog_emptyState_title,
          text: Labels_properties.FloatingEditorDialog_emptyState_text,
        }),
        config,
      ),
    );
  }
}

export default EmptyState;
