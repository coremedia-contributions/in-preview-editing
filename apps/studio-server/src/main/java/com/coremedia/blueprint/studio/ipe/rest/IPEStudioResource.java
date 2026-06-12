package com.coremedia.blueprint.studio.ipe.rest;

import com.coremedia.blueprint.studio.ipe.pagegrid.PageGridPlacementService;
import com.coremedia.blueprint.studio.ipe.pagegrid.PlacementNotFoundException;
import com.coremedia.blueprint.studio.ipe.sections.SectionNotFoundException;
import com.coremedia.blueprint.studio.ipe.sections.SectionsService;
import com.coremedia.cap.content.Content;
import edu.umd.cs.findbugs.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.lang.invoke.MethodHandles;
import java.util.List;

@RestController
@RequestMapping(value = "ipe", produces = MediaType.APPLICATION_JSON_VALUE)
public class IPEStudioResource {

  private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final PageGridPlacementService pageGridPlacementService;
  private final SectionsService sectionsService;

  public IPEStudioResource(PageGridPlacementService pageGridPlacementService, SectionsService sectionsService) {
    this.pageGridPlacementService = pageGridPlacementService;
    this.sectionsService = sectionsService;
  }

  /**
   * Inserts content into the given pagegrid placement at a provided index.
   *
   * @param request
   * @throws Exception
   */
  @PostMapping(value = "pagegrid/placement/insert")
  public ResponseEntity<InsertIntoPlacementResponse> insertInPagegridPlacement(@RequestBody @NonNull InsertIntoPlacementRequest request) throws Exception {
    Content pageContent = request.context();
    Content contentToInsert = request.contentToInsert();

    // Check for checkout conflict: content must not be checked out by another user
    if (pageContent.isCheckedOut() && !pageContent.isCheckedOutByCurrentSession()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Content " + pageContent + " is checked out by another user.");
    }

    String placementName = request.placementName();
    try {
      pageGridPlacementService.insertIntoPlacement(pageContent, placementName, contentToInsert, request.insertAt());
    } catch (PlacementNotFoundException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
    } catch (IllegalStateException e) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
    } catch (Exception e) {
      LOG.error("Failed to insert content {} into placement '{}' on content {}", request.contentToInsert(), placementName, request.context(), e);
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error during placement insert.");
    }

    List<Content> placementItems = pageGridPlacementService.getPlacementItems(pageContent, placementName);
    InsertIntoPlacementResponse responseBody = new InsertIntoPlacementResponse(true, placementName, pageContent, placementItems, null);
    return ResponseEntity.ok(responseBody);
  }

  @PostMapping(value = "section/item/action")
  public ResponseEntity<SectionItemActionResponse> sectionItemAction(@RequestBody @NonNull SectionItemActionRequest request) {
    Content sectionContent = request.sectionContent();

    if (sectionContent.isCheckedOut() && !sectionContent.isCheckedOutByCurrentSession()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Content " + sectionContent + " is checked out by another user.");
    }

    try {
      switch (request.action()) {
        case DELETE -> sectionsService.deleteSectionItem(sectionContent, request.sectionItemId());
        case DUPLICATE -> sectionsService.duplicateSectionItem(sectionContent, request.sectionItemId());
        case MOVE_DOWN -> sectionsService.moveSectionItem(sectionContent, request.sectionItemId(), SectionsService.MoveDirection.DOWN);
        case MOVE_UP -> sectionsService.moveSectionItem(sectionContent, request.sectionItemId(), SectionsService.MoveDirection.UP);
        case MOVE_TO -> sectionsService.moveSectionItemToIndex(sectionContent, request.sectionItemId(), request.actionParams().get("move_to"));
      }
    } catch (SectionNotFoundException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
    } catch (Exception e) {
      LOG.error("Failed to perform action {} on section '{}' of content {}", request.action(), request.sectionItemId(), sectionContent, e);
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error during section item action.");
    }

    SectionItemActionResponse responseBody = new SectionItemActionResponse(true, request.action(), sectionContent, null);
    return ResponseEntity.ok(responseBody);
  }


}
