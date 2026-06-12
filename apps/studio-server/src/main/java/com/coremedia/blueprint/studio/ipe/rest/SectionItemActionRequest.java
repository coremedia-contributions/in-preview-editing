package com.coremedia.blueprint.studio.ipe.rest;

import com.coremedia.cap.content.Content;

import java.util.Map;

public record SectionItemActionRequest(
  Content sectionContent,
  String sectionItemId,
  SectionItemAction action,
  Map<String, Object> actionParams
) {
}
