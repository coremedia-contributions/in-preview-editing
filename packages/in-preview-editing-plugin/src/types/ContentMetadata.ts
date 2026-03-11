export interface ContentMetadata {
  contentRef: string;
  contentId: string;
  contentName: string;
  contentType: string;
  contentTypeLabel: string;
  status: string;
  siteLocale: string;
  translationStatus: string;
  userMayPerformPublish: boolean;
  contentThumbnail: string;
  propertyName: string;
  propertyLabel: string;
  propertyType: string;
  breadcrumb: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  contentRef: string;
  contentId: string;
  contentName: string;
  contentType: string;
  contentTypeLabel: string;
}
