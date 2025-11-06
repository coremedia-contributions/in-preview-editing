import FloatingEditorDialog from "../editors/FloatingEditorDialog";

abstract class IFloatingEditorDialogService {
  abstract getFloatingDialog(): FloatingEditorDialog;
}

export default IFloatingEditorDialogService;
