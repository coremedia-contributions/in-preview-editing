package com.coremedia.blueprint.studio.ipe.rest;

import com.coremedia.cap.content.Content;

public record SectionItemActionRequest(
  Content sectionContent,
  String sectionItemId,
  SectionItemAction action
) {
}
