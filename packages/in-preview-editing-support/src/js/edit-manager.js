import {
  getCurrentValue,
  getPropertyNameFromMetadata,
  findContentId,
  getPreviousValue,
  findPropertyName, getContentIdBreadcrumb
} from "./utils";
import { pdeActionManager } from "./action-manager";

export const PDEEditEvents = Object.freeze({
  START_EDIT: "pde:edit:start",
  END_EDIT: "pde:edit:end",
});

class PDEEditManager extends EventTarget {

  constructor() {
    super();

    if (PDEEditManager.instance) {
      return PDEEditManager.instance;
    }

    PDEEditManager.instance = this;

    this.inlineEditingActive = false;
  }

  startEditing(element, inline = false) {
    if (inline) {
      element.contentEditable = "plaintext-only";
      element.classList.add("pde-edit-input");
      element.addEventListener('keydown', this.manageEditKeyinput.bind(null, element));

      // save value for restore in case edit is canceled
      element.dataset.pbePrevValue = getCurrentValue(element);
      element.focus();

      this.inlineEditingActive = true;
    } else {
      pdeActionManager.requestFloatingEditor(element);
    }

    console.log("[PDE] dispatch START_EDIT");
    this.dispatchEvent(new CustomEvent(PDEEditEvents.START_EDIT, { element: element, inline: inline }));
  }

  endEditing = (element, save = false) => {
    element.contentEditable = false;
    element.classList.remove("pde-edit-input");
    element.removeEventListener("keydown", this.manageEditKeyinput.bind(null, element));

    this.inlineEditingActive = false;

    if (save) {
      let updatedValue = element.childNodes[0]?.nodeValue;

      // calculate property name
      const propertyName = getPropertyNameFromMetadata(element);

      // calculate content id
      const contentId = findContentId(element);
      pdeActionManager.postPropertyUpdate(contentId, propertyName, updatedValue);
    } else {
      // edit canceled, restore previous value
      if (element.childNodes?.length > 0) {
        element.childNodes[0].nodeValue = getPreviousValue(element);
      }
    }

    const contentId = findContentId(element);
    const propertyName = findPropertyName(element);
    const breadcrumbIds = getContentIdBreadcrumb(element);
    if (contentId && propertyName) {
      pdeActionManager.requestContentMetadata(contentId, propertyName, breadcrumbIds);
    }

    console.log("[PDE] dispatch END_EDIT");
    this.dispatchEvent(new CustomEvent(PDEEditEvents.END_EDIT, { element: element, save: save }));
  }

  manageEditKeyinput = (element, event) => {
    //console.log("[PDE] key entered: " + event.key);
    event.stopPropagation();

    // Prevent Enter from inserting anything
    if (event.key === "Enter") {
      event.preventDefault();
    }
  }

  isInlineEditingActive = () => {
    return this.inlineEditingActive;
  }

}

export const pdeEditManager = new PDEEditManager();
