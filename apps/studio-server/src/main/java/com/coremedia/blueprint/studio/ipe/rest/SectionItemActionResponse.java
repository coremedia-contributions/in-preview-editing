package com.coremedia.blueprint.studio.ipe.rest;

import com.coremedia.cap.content.Content;
import edu.umd.cs.findbugs.annotations.Nullable;

public record SectionItemActionResponse(
  boolean success,
  SectionItemAction action,
  Content sectionContent,
  @Nullable String errorMessage
) {
}
