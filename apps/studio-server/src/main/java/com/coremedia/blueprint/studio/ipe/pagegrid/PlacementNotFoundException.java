package com.coremedia.blueprint.studio.ipe.pagegrid;

/**
 * Thrown when a pagegrid placement with a given name cannot be found in the content's pagegrid struct.
 */
public class PlacementNotFoundException extends RuntimeException {

  public PlacementNotFoundException(String placementName) {
    super("Placement not found: " + placementName);
  }

}
