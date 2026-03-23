import type { PluginFeatures } from "../types/PluginFeatures.ts";

export const IPE_ACTIVATE_EVENT = "coremedia:ipe:activate";
export const IPE_DEACTIVATE_EVENT = "coremedia:ipe:deactivate";

export interface IPEActivateEventDetail {
  lang?: string;
  features?: PluginFeatures;
}
