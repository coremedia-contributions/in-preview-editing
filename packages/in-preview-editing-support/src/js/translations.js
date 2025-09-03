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
      "start_localization_workflow": "Start Localization",
      "start_publication_workflow": "Start Publication",
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
      "start_localization_workflow": "Lokalisierung starten",
      "start_publication_workflow": "Publikation starten",
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
