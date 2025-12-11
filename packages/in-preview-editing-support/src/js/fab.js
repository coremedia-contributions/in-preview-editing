import '../css/fab.css';
import { getScrollPosition, getContentIdFromMetadata, findContentId, findPropertyName } from "./utils";
import { Dropdown } from "./dropdown";
import { pdeEditManager, PDEEditEvents } from "./edit-manager";

/**
 * Floating action button attached to the highlighted element containing the edit action and a dropdown with additional actions.
 */
export class PDEEditFAB {

  constructor() {
    this.render();

    // add event listeners
    pdeEditManager.addEventListener(PDEEditEvents.START_EDIT, this.onEditStart);
    pdeEditManager.addEventListener(PDEEditEvents.END_EDIT, this.onEditEnd);
  }

  render() {
    // FAB root element (button group wrapper)
    this.fab = document.createElement("div");
    this.fab.classList.add("pde-fab", "pde--hidden");

    // Add edit button
    this.editBtn = document.createElement("button");
    this.editBtn.innerHTML = "Edit";
    // this.editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-line-icon lucide-pencil-line"><path d="M13 21h8"/><path d="m15 5 4 4"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>`;
    this.editBtn.addEventListener("click", () => {
      pdeEditManager.startEditing(this.metadataNode, true);
    });
    this.fab.appendChild(this.editBtn);

    // Add cancel button
    this.cancelBtn = document.createElement("button");
    this.cancelBtn.innerHTML = "Cancel";
    this.cancelBtn.classList.add("pde--destructive", "pde--hidden");
    this.cancelBtn.addEventListener("click", () => {
      pdeEditManager.endEditing(this.metadataNode, false);
    });
    this.fab.appendChild(this.cancelBtn);

    // Add save button
    this.saveBtn = document.createElement("button");
    this.saveBtn.innerHTML = "Save";
    this.saveBtn.classList.add("pde--hidden");
    this.saveBtn.addEventListener("click", () => {
      pdeEditManager.endEditing(this.metadataNode, true);
    });
    this.fab.appendChild(this.saveBtn);

    // Add dropdown menu button
    this.menuBtn = document.createElement("button");
    this.menuBtn.classList.add("pde-button-icon-only");
    this.menuBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`;
    this.fab.appendChild(this.menuBtn);

    window.document.body.appendChild(this.fab);


    // create dropdown menu
    this.menu = new Dropdown({
      trigger: this.menuBtn,
      items: [
        {label: "Publish"},
        {label: "---"},
        {label: "Open in Tab", action: () => this.onMenuItemClick(pdeEditManager.openContent)},
        {label: "Show in Library"},
        {label: "---"},
        {label: "Start Publication"},
        {label: "---"},
        {label: "Start Localization"},
      ]
    });
  }

  show() {
    this.fab.classList.remove("pde--hidden");
  }

  hide () {
    this.fab.classList.add("pde--hidden");
    this.menu.close();
  }

  updateEditFABPosition = (element) => {
    if (pdeEditManager.isInlineEditingActive()) {
      // no update during inline-editing
      return;
    }

    // close menu
    this.menu.close();

    // update menu position
    const documentBoundingRect = document.body.getBoundingClientRect();
    const editFABBoundingRect = this.fab.getBoundingClientRect();
    const metadataElementBoundingRect = element.getBoundingClientRect();
    const scrollPosition = getScrollPosition();
    let top = Math.round(metadataElementBoundingRect.top + scrollPosition.scrollTop - editFABBoundingRect.height + 2);
    // let left = Math.round(metadataElementBoundingRect.right - editFABBoundingRect.width);
    let left = Math.round(metadataElementBoundingRect.left);

    if (top < scrollPosition.scrollTop) {
      top = Math.round(scrollPosition.scrollTop) + 10; // add 10px for padding
    }

    this.fab.style.top = `${top}px`;
    this.fab.style.left = `${left}px`;
  }

  setMetadataNode(metadataNode) {
    if (pdeEditManager.isInlineEditingActive()) {
      // no update during inline-editing
      return;
    }
    this.metadataNode = metadataNode;
  }

  onMenuItemClick(delegateAction) {
    console.log("[PDE] FAB menu item clicked.");
    // close the menu
    this.menu.close();

    try {
      const contentRef = findContentId(this.metadataNode);
      const propertyName = findPropertyName(this.metadataNode);

      // delegate to provided action
      delegateAction && delegateAction(contentRef, propertyName);

    } catch (e) {
      console.warn("[PDE] Cannot trigger delegate action.", e);
    }

  }

  onEditStart = (event) => {
    console.log("[PDE] Edit Start Event.");
    this.editBtn.classList.add("pde--hidden");
    this.menuBtn.classList.add("pde--hidden");
    this.saveBtn.classList.remove("pde--hidden");
    this.cancelBtn.classList.remove("pde--hidden");
  }

  onEditEnd = (event) => {
    console.log("[PDE] Edit End Event.");
    this.editBtn.classList.remove("pde--hidden");
    this.menuBtn.classList.remove("pde--hidden");
    this.saveBtn.classList.add("pde--hidden");
    this.cancelBtn.classList.add("pde--hidden");
  }

}
