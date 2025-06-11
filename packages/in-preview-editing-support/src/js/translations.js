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
    },
    "de": {
      "loading": "Laden ...",
      "edit": "Bearbeiten",
      "edit_inline": "Bearbeiten",
      "publish": "Publizieren",
      "publishing": "Publizieren ...",
      "save": "Speichern",
      "cancel": "Abbrechen",
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
export const t = (key) => IPETranslations.t[key];
