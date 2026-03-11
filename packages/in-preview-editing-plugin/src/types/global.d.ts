export {};

declare global {
  interface Window {
    com?: {
      coremedia?: {
        pde?: {
          activateInPageEditing: (lang?: string) => void;
          deactivateInPageEditing: () => void;
          destroyPlugin: () => void;
        };
      };
    };
  }
}
