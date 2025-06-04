import './styles.css';
import "@coremedia-contributions/in-preview-editing-support";

export function toggleInPreviewEditing() {
  console.log("Toggle In-Preview Editing: ", this.checked);
  if (this.checked) {
    window.com.coremedia.pde.activateInPageEditing();
    pdeStatusLabel.innerHTML = "In-Preview Editing: on";
  } else {
    window.com.coremedia.pde.deactivateInPageEditing();
    pdeStatusLabel.innerHTML = "In-Preview Editing: off";
  }
}

const pdeStatusLabel = document.getElementById('pdeStatusLabel');
const toggle = document.getElementById('pdeToggleSwitch');
toggle.addEventListener('change', toggleInPreviewEditing);
if (toggle.checked) {
  window.com.coremedia.pde.activateInPageEditing();
  pdeStatusLabel.innerHTML = "In-Preview Editing: on";
}
