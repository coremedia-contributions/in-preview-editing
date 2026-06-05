package com.coremedia.blueprint.studio.ipe.pagegrid;

import com.coremedia.blueprint.base.pagegrid.PageGridContentKeywords;
import com.coremedia.blueprint.base.pagegrid.internal.PageGridConverter;
import com.coremedia.blueprint.base.pagegrid.internal.Placement;
import com.coremedia.cap.common.CapStructHelper;
import com.coremedia.cap.content.Content;
import com.coremedia.cap.content.ContentRepository;
import com.coremedia.cap.content.ContentType;
import com.coremedia.cap.struct.Struct;
import com.coremedia.cap.struct.StructBuilder;
import com.coremedia.cap.struct.StructService;
import edu.umd.cs.findbugs.annotations.NonNull;
import edu.umd.cs.findbugs.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service that provides write operations on pagegrid placements.
 *
 * <p>Reads the pagegrid struct from a content item, locates the target placement by its section name,
 * modifies the extended-items list, and writes the updated struct back to the content.
 *
 * <p>Checkout/checkin of the content is handled internally. If the content is already checked out by the
 * current session the existing checkout is reused. Content checked out by another user must be rejected
 * before calling this service.
 */
public class PageGridPlacementService {

  private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final ContentRepository contentRepository;

  public PageGridPlacementService(ContentRepository contentRepository) {
    this.contentRepository = contentRepository;
  }

  /**
   * Inserts {@code itemToInsert} into the named placement of a pagegrid struct at the given index.
   *
   * @param pageContent      the content item that owns the pagegrid struct
   * @param pageGridProperty name of the struct property on the content (e.g. {@code "placement"})
   * @param placementName    name of the target placement (matched against the section content's name)
   * @param itemToInsert     the content item to insert
   * @param index            0-based insertion index; clamped to {@code [0, currentSize]};
   *                         {@code null} or {@code -1} appends to the end of the list
   * @throws IllegalArgumentException   if no pagegrid struct exists on the given property
   * @throws PlacementNotFoundException if no placement with the given name exists
   * @throws IllegalStateException      if the placement is locked
   */
  public void insertIntoPlacement(Content pageContent,
                                  String pageGridProperty,
                                  String placementName,
                                  Content itemToInsert,
                                  Integer index) {
    // 1. Read pagegrid struct and parse placements
    Struct rootStruct = getPageGridStruct(pageContent, pageGridProperty);
    PageGridConverter converter = new PageGridConverter();
    Collection<Placement> placements = converter.parsePlacements(rootStruct);

    // 2. Locate target placement by section name
    Placement targetPlacement = findPlacement(placements, placementName);

    // 3. Reject locked placements
    if (targetPlacement.isLocked()) {
      throw new IllegalStateException("Placement '" + placementName + "' is locked and cannot be modified.");
    }

    // 4. Build updated item list
    List<Struct> modifiedExtendedItems = new ArrayList<>(targetPlacement.getExtendedItems());
    int clampedIndex = (index == null || index < 0)
      ? modifiedExtendedItems.size()
      : Math.min(index, modifiedExtendedItems.size());

    StructService structService = contentRepository.getConnection().getStructService();
    ContentType documentType = contentRepository.getDocumentContentType();
    StructBuilder itemBuilder = structService.createStructBuilder();
    itemBuilder.declareLink(
      PageGridContentKeywords.ANNOTATED_LINK_LIST_TARGET_PROPERTY_NAME,
      documentType,
      itemToInsert);
    modifiedExtendedItems.add(clampedIndex, itemBuilder.build());

    // 5. Rebuild all placements as a new struct list
    List<Struct> newPlacementStructs = placements.stream()
      .map(p -> p.equals(targetPlacement)
        ? buildPlacementStruct(p, modifiedExtendedItems, structService)
        : buildPlacementStruct(p, p.getExtendedItems(), structService))
      .collect(Collectors.toList());

    // 6. Update root struct (preserve layout link in placements_2, replace only the placements list)
    StructBuilder rootBuilder = rootStruct.builder();
    rootBuilder.remove(PageGridContentKeywords.PLACEMENTS_STRUCT_LIST_PROPERTY_NAME);
    rootBuilder.declareStructs(
      PageGridContentKeywords.PLACEMENTS_STRUCT_LIST_PROPERTY_NAME,
      newPlacementStructs);
    Struct newRootStruct = rootBuilder.build();

    // 7. Check out content, set struct, check in
    if (pageContent.isCheckedIn()) {
      pageContent.checkOut();
    }
    pageContent.set(pageGridProperty, newRootStruct);
    pageContent.checkIn();

    LOG.debug("Inserted content {} into placement '{}' at index {} on content {}", itemToInsert.getId(), placementName, clampedIndex, pageContent.getId());
  }

  public void insertIntoPlacement(Content pageContent,
                                  String placementName,
                                  Content itemToInsert,
                                  Integer index) {
    insertIntoPlacement(pageContent, PageGridContentKeywords.PAGE_GRID_STRUCT_PROPERTY, placementName, itemToInsert, index);
  }

  /**
   * Returns the ordered list of content items linked in the named placement of the given page content.
   *
   * @param pageContent          the content item that owns the pagegrid struct
   * @param placementName        name of the target placement (matched against the section content's name)
   * @param pageGridPropertyName name of the struct property on the content (e.g. {@code "placement"})
   * @return ordered list of content items in the placement; never {@code null}
   * @throws IllegalArgumentException   if no pagegrid struct exists on the given property
   * @throws PlacementNotFoundException if no placement with the given name exists
   */
  public List<Content> getPlacementItems(@NonNull Content pageContent, @NonNull String placementName, @Nullable String pageGridPropertyName) {
    String pageGridProperty = pageGridPropertyName != null ? pageGridPropertyName : PageGridContentKeywords.PAGE_GRID_STRUCT_PROPERTY;
    Struct rootStruct = getPageGridStruct(pageContent, pageGridProperty);
    PageGridConverter converter = new PageGridConverter();
    Collection<Placement> placements = converter.parsePlacements(rootStruct);
    Placement targetPlacement = findPlacement(placements, placementName);


    return targetPlacement.getExtendedItems().stream()
      .map(itemStruct -> CapStructHelper.getLink(itemStruct, PageGridContentKeywords.ANNOTATED_LINK_LIST_TARGET_PROPERTY_NAME))
      .filter(content -> content != null)
      .collect(Collectors.toList());
  }

  public List<Content> getPlacementItems(@NonNull Content pageContent, @NonNull String placementName) {
    return getPlacementItems(pageContent, placementName, PageGridContentKeywords.PAGE_GRID_STRUCT_PROPERTY);
  }

  // --- private helpers --------------------------------------------

  private Struct getPageGridStruct(Content pageContent, String pageGridProperty) {
    Struct rootStruct = CapStructHelper.getStruct(pageContent, pageGridProperty);
    if (rootStruct == null) {
      throw new IllegalArgumentException("No pagegrid struct found on property '" + pageGridProperty + "' of content " + pageContent.getId());
    }
    return rootStruct;
  }

  private Placement findPlacement(Collection<Placement> placements, String placementName) {
    return placements.stream()
      .filter(p -> p.getSection() != null && placementName.equals(p.getSection().getName()))
      .findFirst()
      .orElseThrow(() -> new PlacementNotFoundException(placementName));
  }

  /**
   * Builds a single placement struct from a {@link Placement} and an explicit extended-items list.
   * Always writes the modern {@code extendedItems} format; the legacy {@code items} link-list is never written.
   */
  private Struct buildPlacementStruct(Placement placement,
                                      List<Struct> extendedItems,
                                      StructService structService) {
    StructBuilder builder = structService.createStructBuilder();
    if (placement.getSection() != null) {
      builder.declareLink(PageGridContentKeywords.SECTION_PROPERTY_NAME,
        placement.getSection().getType(), placement.getSection());
    }
    builder.declareStructs(PageGridContentKeywords.EXTENDED_ITEMS_PROPERTY_NAME, extendedItems);
    if (placement.getViewType() != null) {
      builder.declareLink(PageGridContentKeywords.VIEWTYPE_PROPERTY_NAME,
        placement.getViewType().getType(), placement.getViewType());
    }
    if (placement.getLocked() != null) {
      builder.declareBoolean(PageGridContentKeywords.PLACEMENT_IS_LOCKED_FOR_CHILDREN, placement.isLocked());
    }
    if (placement.getInherited() != null) {
      builder.declareBoolean(PageGridContentKeywords.PLACEMENT_IS_INHERITED, placement.isInherited());
    }
    return builder.build();
  }
}
