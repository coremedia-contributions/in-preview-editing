import SvgIconUtil from "@coremedia/studio-client.base-models/util/SvgIconUtil";
import { openWcsInTab } from "@coremedia/studio-client.common-icons";

interface Labels_properties {
  FloatingEditorDialog_emptyState_text: string;
  FloatingEditorDialog_emptyState_title: string;
  FloatingEditorDialog_finishAction_text: string;
  FloatingEditorDialog_finishAndPublishAction_text: string;
  FloatingEditorDialog_openInTabAction_text: string;
  FloatingEditorDialog_title: string;
  ToggleInPreviewEditingButton_icon: string;
  ToggleInPreviewEditingButton_text: string;
  ToggleInPreviewEditingButton_tooltip: string;
}

const Labels_properties: Labels_properties = {
  FloatingEditorDialog_emptyState_text: "Editing for this property is not supported yet.",
  FloatingEditorDialog_emptyState_title: "Ooops!",
  FloatingEditorDialog_finishAction_text: "Save",
  FloatingEditorDialog_finishAndPublishAction_text: "Save & Publish",
  FloatingEditorDialog_openInTabAction_text: "Open in Tab",
  FloatingEditorDialog_title: "Floating Editor",
  ToggleInPreviewEditingButton_icon: SvgIconUtil.getIconStyleClassForSvgIcon(openWcsInTab),
  ToggleInPreviewEditingButton_text: "Toggle in-preview editing",
  ToggleInPreviewEditingButton_tooltip: "Toggle in-preview editing",
};

export default Labels_properties;
