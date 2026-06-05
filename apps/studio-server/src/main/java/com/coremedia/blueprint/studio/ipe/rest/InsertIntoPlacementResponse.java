package com.coremedia.blueprint.studio.ipe.rest;

import com.coremedia.cap.content.Content;
import edu.umd.cs.findbugs.annotations.Nullable;

import java.util.List;

/**
 * Response returned after a successful or failed placement insertion operation.
 *
 * @param success indicates whether the insertion was successful or not
 * @param placementName name of the affected placement
 * @param context the content whose pagegrid was modified
 * @param items the list of items in the placement after the operation
 * @param errorMessage human-readable error description, or {@code null} on success
 */
public record InsertIntoPlacementResponse(
  boolean success,
  String placementName,
  Content context,
  List<Content> items,
  @Nullable String errorMessage
) {
}
