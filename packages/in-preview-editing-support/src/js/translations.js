const IPETranslations = {
  lang: "en", // Default language
  translations: {
    "en": {
      "loading": "Loading ...",
      "edit": "Edit",
      "edit_inline": "Edit",
      "publish": "Publish",
      "publishing": "Publishing ...",
      "save": "Save",
      "cancel": "Cancel",
      "open_in_tab": "Open in Tab",
      "show_in_library": "Show in Library",
      "move_up": "Move Up",
      "move_down": "Move Down",
      "open_navigation_manager": "Open Navigation Manager",
      "create_page_from_template": "Create Page from Template",
      "start_localization_workflow": "Start Localization",
      "start_publication_workflow": "Start Publication",
      "cut_placement_item": "Cut Item",
      "copy_placement_item": "Copy Item",
      "paste_placement_item": "Paste Item",
      "remove_placement_item": "Remove Item from Placement",
      "move_placement_item_up": "Move Item Up",
      "move_placement_item_down": "Move Item Down",
      "lifecycle": "Lifecycle",
      "localization": "Localization",
      "metrics": "Metrics",
      "metric_pages": "Page Views",
      "metric_visits": "Sessions",
      "metric_visitors_unique": "Unique Visitors",
      "exit_rate": "Exit Rate",
      "rollback": "Rollback",
    },
    "de": {
      "loading": "Laden ...",
      "edit": "Bearbeiten",
      "edit_inline": "Bearbeiten",
      "publish": "Publizieren",
      "publishing": "Publizieren ...",
      "save": "Speichern",
      "cancel": "Abbrechen",
      "open_in_tab": "Im Tab öffnen",
      "show_in_library": "In Bibliothek anzeigen",
      "move_up": "Nach oben verschieben",
      "move_down": "Nach unten verschieben",
      "open_navigation_manager": "Navigation Manager öffnen",
      "create_page_from_template": "Seite aus Vorlage erstellen",
      "start_localization_workflow": "Lokalisierung starten",
      "start_publication_workflow": "Publikation starten",
      "cut_placement_item": "Element ausschneiden",
      "copy_placement_item": "Element kopieren",
      "paste_placement_item": "Element einfügen",
      "remove_placement_item": "Element entfernen",
      "move_placement_item_up": "Element nach oben verschieben",
      "move_placement_item_down": "Element nach unten verschieben",
      "lifecycle": "Lifecycle",
      "localization": "Lokalisierung",
      "metrics": "Metriken",
      "metric_pages": "Seitenaufrufe",
      "metric_visits": "Sessions",
      "metric_visitors_unique": "Unique Visitors",
      "exit_rate": "Exit Rate"
    }
  },
  setLang(newLang) {
    if (this.translations[newLang]) {
      this.lang = newLang;
    } else {
      console.warn(`Language '${newLang}' not supported. Falling back to 'en'.`);
      this.lang = "en";
    }
  },
  getLang() {
    return this.lang;
  },
  t(key) {
    return this.translations[this.lang][key] || key;
  }
};

export const setLang = (newLang) => IPETranslations.setLang(newLang);
export const getLang = () => IPETranslations.getLang();
export const t = (key) => IPETranslations.t(key);
