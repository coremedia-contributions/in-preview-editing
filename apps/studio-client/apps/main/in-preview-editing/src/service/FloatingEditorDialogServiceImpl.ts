import FloatingEditorDialog from "../editors/FloatingEditorDialog";
import IFloatingEditorDialogService from "./IFloatingEditorDialogService";

class FloatingEditorDialogServiceImpl implements IFloatingEditorDialogService {
  #floatingEditorDialog: FloatingEditorDialog;

  getFloatingDialog(): FloatingEditorDialog {
    return this.#getFloatingEditorDialog();
  }

  #getFloatingEditorDialog(): FloatingEditorDialog {
    if (!this.#floatingEditorDialog) {
      this.#floatingEditorDialog = new FloatingEditorDialog();
    }
    return this.#floatingEditorDialog;
  }
}

export default FloatingEditorDialogServiceImpl;
