package com.coremedia.blueprint.studio.ipe.sections;

import com.coremedia.cap.common.CapStructHelper;
import com.coremedia.cap.content.Content;
import com.coremedia.cap.content.ContentRepository;
import com.coremedia.cap.content.results.CopyResult;
import com.coremedia.cap.struct.Struct;
import com.coremedia.cap.struct.StructBuilder;
import edu.umd.cs.findbugs.annotations.NonNull;
import edu.umd.cs.findbugs.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class SectionsService {

  private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String LAYOUT_PROPERTY = "layout";
  private static final String SECTIONS_PROPERTY = "sections";
  private static final String SECTION_ITEM_ID_PROPERTY = "sectionId";
  private static final String VALUES_PROPERTY = "values";
  private static final String ITEMS_PROPERTY = "items";
  private static final String ITEM_TYPE_PROPERTY = "type";
  private static final String ITEM_NAME_PROPERTY = "name";
  private static final String LINK_ITEM_TYPE = "link";

  private final ContentRepository contentRepository;

  public SectionsService(ContentRepository contentRepository) {
    this.contentRepository = contentRepository;
  }

  /**
   * Deletes the section item with the given {@code sectionItemId} from the {@code layout.sections}
   * StructList of the provided content.
   *
   * @param content   the CMSection content to modify
   * @param sectionItemId the unique id of the section to delete
   * @throws IllegalArgumentException if no {@code layout} struct is found on the content
   * @throws SectionNotFoundException if no section with the given {@code sectionItemId} exists
   */
  public boolean deleteSectionItem(@NonNull Content content, @NonNull String sectionItemId) {
    LOG.debug("Deleting section item {} from content {}", sectionItemId, content.getId());

    Struct layoutStruct = getLayoutStruct(content);
    List<Struct> sections = getSections(layoutStruct, sectionItemId);

    List<Struct> updatedSections = sections.stream()
      .filter(s -> !sectionItemId.equals(s.get(SECTION_ITEM_ID_PROPERTY)))
      .collect(Collectors.toList());

    if (updatedSections.size() == sections.size()) {
      throw new SectionNotFoundException(sectionItemId);
    }

    persistSections(content, layoutStruct, updatedSections);

    LOG.debug("Successfully deleted section item {} from content {}", sectionItemId, content.getId());
    return true;
  }

  /**
   * Duplicates the section item with the given {@code sectionItemId} and inserts the copy
   * directly after the original in {@code layout.sections}. The duplicate gets a new unique
   * {@code sectionItemId}; all other properties ({@code name}, {@code type}, {@code items}, {@code values})
   * are copied from the source. Any linked content referenced in {@code values} is copied
   * to the same folder as the section content, and the duplicate points to the new copies.
   *
   * @param content   the CMSection content to modify
   * @param sectionItemId the unique id of the section to duplicate
   * @throws IllegalArgumentException if no {@code layout} struct is found on the content
   * @throws SectionNotFoundException if no section with the given {@code sectionItemId} exists
   */
  public boolean duplicateSectionItem(@NonNull Content content, @NonNull String sectionItemId) {
    LOG.debug("Duplicating section item {} in content {}", sectionItemId, content.getId());

    Struct layoutStruct = getLayoutStruct(content);
    List<Struct> sections = getSections(layoutStruct, sectionItemId);
    int sourceIndex = findSectionIndex(sections, sectionItemId);
    Struct sourceSection = sections.get(sourceIndex);

    // Copy any linked content in the values struct to the same folder as the section content
    Content targetFolder = content.getParent();
    Struct updatedValues = copyLinkedContentsInValues(sourceSection, targetFolder);

    // Build a copy with a new unique sectionItemId and updated values
    String newSectionItemId = "section_" + System.currentTimeMillis();
    StructBuilder duplicateBuilder = sourceSection.builder();
    duplicateBuilder.remove(SECTION_ITEM_ID_PROPERTY);
    duplicateBuilder.declareString(SECTION_ITEM_ID_PROPERTY, Integer.MAX_VALUE, newSectionItemId);
    if (updatedValues != null) {
      duplicateBuilder.remove(VALUES_PROPERTY);
      duplicateBuilder.declareStruct(VALUES_PROPERTY, updatedValues);
    }
    Struct duplicateSection = duplicateBuilder.build();

    // Insert the duplicate directly after the source
    List<Struct> updatedSections = new ArrayList<>(sections);
    updatedSections.add(sourceIndex + 1, duplicateSection);

    persistSections(content, layoutStruct, updatedSections);

    LOG.debug("Successfully duplicated section item {} as {} in content {}", sectionItemId, newSectionItemId, content.getId());
    return true;
  }

  public enum MoveDirection {
    UP, DOWN
  }

  /**
   * Moves the section item with the given {@code sectionItemId} one position up or down
   * in {@code layout.sections}.
   *
   * @param content       the CMSection content to modify
   * @param sectionItemId the unique id of the section to move
   * @param direction     {@link MoveDirection#UP} to move towards index 0,
   *                      {@link MoveDirection#DOWN} to move towards the end of the list
   * @throws IllegalArgumentException if no {@code layout} struct is found on the content,
   *                                  or the section is already at the boundary in the requested direction
   * @throws SectionNotFoundException if no section with the given {@code sectionItemId} exists
   */
  public boolean moveSectionItem(@NonNull Content content, @NonNull String sectionItemId, @NonNull MoveDirection direction) {
    LOG.debug("Moving section item {} {} in content {}", sectionItemId, direction, content.getId());

    Struct layoutStruct = getLayoutStruct(content);
    List<Struct> sections = getSections(layoutStruct, sectionItemId);
    int sourceIndex = findSectionIndex(sections, sectionItemId);

    int targetIndex = direction == MoveDirection.UP ? sourceIndex - 1 : sourceIndex + 1;
    if (targetIndex < 0) {
      throw new IllegalArgumentException("Section '" + sectionItemId + "' is already at the top and cannot be moved up.");
    }
    if (targetIndex >= sections.size()) {
      throw new IllegalArgumentException("Section '" + sectionItemId + "' is already at the bottom and cannot be moved down.");
    }

    // Swap the two entries
    List<Struct> updatedSections = new ArrayList<>(sections);
    Struct moving = updatedSections.remove(sourceIndex);
    updatedSections.add(targetIndex, moving);

    persistSections(content, layoutStruct, updatedSections);

    LOG.debug("Successfully moved section item {} from index {} to {} in content {}", sectionItemId, sourceIndex, targetIndex, content.getId());
    return true;
  }

  /**
   * Moves the section item with the given {@code sectionItemId} to the specified index
   * in {@code layout.sections}.
   *
   * @param content       the CMSection content to modify
   * @param sectionItemId the unique id of the section to move
   * @param moveTo        the target index (0-based) within the sections list
   * @throws IllegalArgumentException if no {@code layout} struct is found on the content,
   *                                  or the target index is out of bounds
   * @throws SectionNotFoundException if no section with the given {@code sectionItemId} exists
   */
  boolean moveSectionItemToIndex(@NonNull Content content, @NonNull String sectionItemId, @NonNull Integer moveTo) {
    LOG.debug("Moving section item {} to index {} in content {}", sectionItemId, moveTo, content.getId());

    Struct layoutStruct = getLayoutStruct(content);
    List<Struct> sections = getSections(layoutStruct, sectionItemId);

    if (moveTo < 0 || moveTo >= sections.size()) {
      throw new IllegalArgumentException("Target index " + moveTo + " is out of bounds for sections list of size " + sections.size() + ".");
    }

    int sourceIndex = findSectionIndex(sections, sectionItemId);

    if (sourceIndex == moveTo) {
      LOG.debug("Section item {} is already at index {}, no move needed", sectionItemId, moveTo);
      return true;
    }

    List<Struct> updatedSections = new ArrayList<>(sections);
    Struct moving = updatedSections.remove(sourceIndex);
    updatedSections.add(moveTo, moving);

    persistSections(content, layoutStruct, updatedSections);

    LOG.debug("Successfully moved section item {} from index {} to {} in content {}", sectionItemId, sourceIndex, moveTo, content.getId());
    return true;
  }

  /**
   * Returns the {@code layout} struct of the given content, or throws if absent.
   */
  @NonNull
  private Struct getLayoutStruct(@NonNull Content content) {
    Struct layoutStruct = CapStructHelper.getStruct(content, LAYOUT_PROPERTY);
    if (layoutStruct == null) {
      throw new IllegalArgumentException("No layout struct found on content " + content.getId());
    }
    return layoutStruct;
  }

  /**
   * Returns the {@code sections} StructList from the given layout struct, or throws if absent or empty.
   */
  @SuppressWarnings("unchecked")
  @NonNull
  private List<Struct> getSections(@NonNull Struct layoutStruct, @NonNull String sectionItemId) {
    List<Struct> sections = (List<Struct>) layoutStruct.get(SECTIONS_PROPERTY);
    if (sections == null || sections.isEmpty()) {
      throw new SectionNotFoundException(sectionItemId);
    }
    return sections;
  }

  /**
   * Returns the index of the section with the given {@code sectionItemId}, or throws if not found.
   */
  private int findSectionIndex(@NonNull List<Struct> sections, @NonNull String sectionItemId) {
    for (int i = 0; i < sections.size(); i++) {
      if (sectionItemId.equals(sections.get(i).get(SECTION_ITEM_ID_PROPERTY))) {
        return i;
      }
    }
    throw new SectionNotFoundException(sectionItemId);
  }

  /**
   * Saves the updated sections list back into the layout struct of the given content,
   * checking the content out if necessary and checking it back in afterwards.
   */
  private void persistSections(@NonNull Content content, @NonNull Struct layoutStruct, @NonNull List<Struct> updatedSections) {
    StructBuilder layoutBuilder = layoutStruct.builder();
    layoutBuilder.remove(SECTIONS_PROPERTY);
    layoutBuilder.declareStructs(SECTIONS_PROPERTY, updatedSections);
    Struct newLayoutStruct = layoutBuilder.build();

    if (content.isCheckedIn()) {
      content.checkOut();
    }
    content.set(LAYOUT_PROPERTY, newLayoutStruct);
    content.checkIn();
  }

  /**
   * Iterates over all {@code link}-type items in the section's schema, copies each referenced
   * content item to {@code targetFolder}, and returns an updated {@code values} struct
   * pointing to the copies. Returns the original struct unchanged if no links are found.
   */
  @SuppressWarnings("unchecked")
  @Nullable
  private Struct copyLinkedContentsInValues(@NonNull Struct sourceSection, @NonNull Content targetFolder) {
    Struct valuesStruct = (Struct) sourceSection.get(VALUES_PROPERTY);
    if (valuesStruct == null) {
      return null;
    }

    List<Struct> itemSchemas = (List<Struct>) sourceSection.get(ITEMS_PROPERTY);
    if (itemSchemas == null || itemSchemas.isEmpty()) {
      return valuesStruct;
    }

    StructBuilder valuesBuilder = valuesStruct.builder();
    boolean modified = false;

    for (Struct itemSchema : itemSchemas) {
      String itemType = (String) itemSchema.get(ITEM_TYPE_PROPERTY);
      String itemName = (String) itemSchema.get(ITEM_NAME_PROPERTY);

      if (!LINK_ITEM_TYPE.equals(itemType) || itemName == null) {
        continue;
      }

      List<Content> linkedContents = (List<Content>) valuesStruct.get(itemName);
      if (linkedContents == null || linkedContents.isEmpty()) {
        continue;
      }

      List<Content> nonNullContents = linkedContents.stream()
        .filter(Objects::nonNull)
        .collect(Collectors.toList());
      if (nonNullContents.isEmpty()) {
        continue;
      }

      // Copy all linked contents to the target folder; "{3} ({1})" avoids name conflicts
      CopyResult copyResult = contentRepository.copyRecursivelyTo(nonNullContents, "{3} ({1})", targetFolder);
      List<Content> copiedContents = copyResult.getResults().stream()
        .filter(item -> item.getCopy().isDocument())
        .map(item -> {
          Content copy = item.getCopy();
          if (copy.isCheckedOut()) {
            copy.checkIn();
          }
          return copy;
        })
        .collect(Collectors.toList());

      if (copiedContents.isEmpty()) {
        continue;
      }

      LOG.debug("Copied {} linked content item(s) for property '{}' to folder {}", copiedContents.size(), itemName, targetFolder.getPath());

      // Replace the link list in values with the copied content
      valuesBuilder.remove(itemName);
      valuesBuilder.declareLinks(itemName, contentRepository.getContentContentType(), Collections.emptyList());
      copiedContents.forEach(c -> valuesBuilder.add(itemName, c));
      modified = true;
    }

    return modified ? valuesBuilder.build() : valuesStruct;
  }

}
