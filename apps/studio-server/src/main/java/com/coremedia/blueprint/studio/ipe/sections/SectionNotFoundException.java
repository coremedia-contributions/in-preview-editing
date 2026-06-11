package com.coremedia.blueprint.studio.ipe.sections;

/**
 * Thrown when a section with a given sectionItemId cannot be found in the content's layout struct.
 */
public class SectionNotFoundException extends RuntimeException {

  public SectionNotFoundException(String sectionItemId) {
    super("Section not found: " + sectionItemId);
  }

}

