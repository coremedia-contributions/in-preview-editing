package com.coremedia.blueprint.studio.ipe;

import com.coremedia.blueprint.studio.ipe.pagegrid.PageGridPlacementService;
import com.coremedia.blueprint.studio.ipe.rest.IPEStudioResource;
import com.coremedia.blueprint.studio.ipe.sections.SectionsService;
import com.coremedia.cap.content.ContentRepository;
import edu.umd.cs.findbugs.annotations.NonNull;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
public class IPEStudioAutoConfiguration {

  @Bean
  public PageGridPlacementService pageGridPlacementService(@NonNull ContentRepository contentRepository) {
    return new PageGridPlacementService(contentRepository);
  }

  @Bean
  public SectionsService sectionsService(@NonNull ContentRepository contentRepository) {
    return new SectionsService(contentRepository);
  }

  @Bean
  public IPEStudioResource ipeStudioResource(@NonNull PageGridPlacementService pageGridPlacementService,
                                              @NonNull SectionsService sectionsService) {
    return new IPEStudioResource(pageGridPlacementService, sectionsService);
  }
}
