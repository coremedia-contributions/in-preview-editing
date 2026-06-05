package com.coremedia.blueprint.studio.ipe.rest;

import com.coremedia.cap.content.Content;

/**
 * Request body for inserting a content into a named pagegrid placement.
 *
 * @param context the content whose pagegrid should be modified
 * @param contentToInsert the content to insert into the pagegrid placement
 * @param placementName the name of the pagegrid placement to insert into
 * @param pageGridPropertyName the name of the pagegrid struct property (e.g. "pageGrid") to modify
 * @param insertAt the index at which the content should be inserted; 0-based, clamped to [0, currentSize]
 */
public record InsertIntoPlacementRequest(
  Content context,
  Content contentToInsert,
  String placementName,
  String pageGridPropertyName,
  int insertAt
) { }
