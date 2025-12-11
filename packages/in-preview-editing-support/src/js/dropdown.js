import "../css/dropdown.css";

export class Dropdown {

  constructor({ trigger: trigger, items = [] }) {
    this.trigger = trigger;
    this.items = items;
    this.isOpen = false;
    this.render();
  }

  render() {
    // init menu
    this.menu = document.createElement("div");
    this.menu.classList.add("pde-dropdown", "pde--hidden");

    // add menu items
    this.items.forEach(item => {
      const el = document.createElement("div");

      if (item.label === "---") {
        // add separator
        el.classList.add("pde-dropdown-separator");
      } else {
        el.textContent = item.label;
        el.classList.add("pde-dropdown-item");

        el.addEventListener("click", () => {
          item.action?.();
          this.close();
        });
      }



      this.menu.appendChild(el);
    });

    // insert menu to dom
    document.body.appendChild(this.menu);

    // register toggle handler
    this.trigger.addEventListener("click", () => this.toggle());
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    const rect = this.trigger.getBoundingClientRect();

    this.menu.style.left = rect.left + "px";
    this.menu.style.top = rect.bottom + "px"; // directly under the button
    this.menu.classList.remove("pde--hidden");

    this.isOpen = true;
    document.addEventListener("click", this.handleOutsideClick);
  }

  close() {
    this.menu.classList.add("pde--hidden");
    this.isOpen = false;
    document.removeEventListener("click", this.handleOutsideClick);
  }

  handleOutsideClick = (e) => {
    if (!this.menu.contains(e.target) && !this.trigger.contains(e.target)) {
      this.close()
    }
  }

}
