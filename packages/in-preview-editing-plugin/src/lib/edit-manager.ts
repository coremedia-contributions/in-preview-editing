import {
  getCurrentValue,
  getPropertyNameFromMetadata,
  findContentId,
  getPreviousValue,
  findPropertyName, getContentIdBreadcrumb
} from "./utils";
import PDEActionManager from "./action-manager.ts";

export const PDEEditEvents = Object.freeze({
  START_EDIT: "pde:edit:start",
  END_EDIT: "pde:edit:end",
});

class PDEEditManager extends EventTarget {

  private static instance: PDEEditManager;

  private inlineEditingActive = false;

  private constructor() {
    super();
  }

  public static getInstance() {
    if (!PDEEditManager.instance) {
      PDEEditManager.instance = new PDEEditManager();
    }
    return PDEEditManager.instance;
  }

  startEditing(element: HTMLElement | undefined, inline = false) {
    if (!element) {
      return;
    }

    if (inline) {
      element.contentEditable = "plaintext-only";
      element.classList.add("pde-edit-input");
      element.addEventListener("keydown", this.manageEditKeyInput.bind(null, element));

      // save value for restore in case edit is canceled
      let currentValue = getCurrentValue(element);
      if (currentValue) {
        element.dataset.pbePrevValue = currentValue;
      }
      element.focus();

      this.inlineEditingActive = true;
    } else {
      const contentId = findContentId(element);
      const propertyName = findPropertyName(element);
      const elementCoords = element.getBoundingClientRect();
      PDEActionManager.getInstance().requestFloatingEditor(contentId, propertyName, elementCoords);
    }

    console.log("[PDE] dispatch START_EDIT");
    // @ts-ignore
    this.dispatchEvent(new CustomEvent(PDEEditEvents.START_EDIT, { element: element, inline: inline }));
  }

  endEditing = (element: HTMLElement | undefined, save = false) => {
    if (!element) {
      return;
    }

    element.contentEditable = "false";
    element.classList.remove("pde-edit-input");
    element.removeEventListener("keydown", this.manageEditKeyInput.bind(null, element));

    this.inlineEditingActive = false;

    if (save) {
      let updatedValue = element.childNodes[0]?.nodeValue;

      // calculate property name
      const propertyName = getPropertyNameFromMetadata(element);

      // calculate content id
      const contentId = findContentId(element);
      PDEActionManager.getInstance().postPropertyUpdate(contentId, propertyName, updatedValue);
    } else {
      // edit canceled, restore previous value
      const previousValue = getPreviousValue(element);
      if (previousValue && element.childNodes?.length > 0) {
        element.childNodes[0].nodeValue = previousValue;
      }
    }

    const contentId = findContentId(element);
    const propertyName = findPropertyName(element);
    const breadcrumbIds = getContentIdBreadcrumb(element);
    if (contentId && propertyName) {
      PDEActionManager.getInstance().requestContentMetadata(contentId, propertyName, breadcrumbIds);
    }

    console.log("[PDE] dispatch END_EDIT");
    // @ts-ignore
    this.dispatchEvent(new CustomEvent(PDEEditEvents.END_EDIT, { element: element, save: save }));
  };

  manageEditKeyInput = (element: HTMLElement, event: KeyboardEvent) => {
    event.stopPropagation();

    // Prevent Enter from inserting anything, but instead use it to save the changes and end editing
    if (event.key === "Enter") {
      event.preventDefault();
      this.endEditing(element, true);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.endEditing(element, false);
    }
  };

  isInlineEditingActive = () => {
    return this.inlineEditingActive;
  };

}

export default PDEEditManager;
