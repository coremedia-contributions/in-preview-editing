import floatingEditorPanel from "../editors/FloatingEditorPanel";
import IFloatingEditorPanelService from "./IFloatingEditorPanelService";

class floatingEditorPanelServiceImpl implements IFloatingEditorPanelService {
  #floatingEditorPanel: floatingEditorPanel;

  getFloatingDialog(): floatingEditorPanel {
    return this.#getfloatingEditorPanel();
  }

  #getfloatingEditorPanel(): floatingEditorPanel {
    if (!this.#floatingEditorPanel) {
      this.#floatingEditorPanel = new floatingEditorPanel();
    }
    return this.#floatingEditorPanel;
  }
}

export default floatingEditorPanelServiceImpl;
