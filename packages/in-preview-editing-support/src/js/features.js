const IPEFeatures = {
  // defaults
  features: {
    metrics: "disabled"
  },
  set (features) {
    this.features = features;
  },
  enable(feature) {
    this.features[feature] = "enabled";
  },
  disable(feature) {
    this.features[feature] = "disable";
  },
  isEnabled(feature) {
    return this.features[feature] === "enabled";
  },
  isDisabled(feature) {
    return !this.isEnabled(feature);
  }
};

export const setFeatures = (features) => IPEFeatures.set(features);
export const enableFeature = (feature) => IPEFeatures.enabled(feature);
export const disableFeature = (feature) => IPEFeatures.disable(feature);
export const isFeatureEnabled = (feature) => IPEFeatures.isEnabled(feature);
export const isFeatureDisabled = (feature) => IPEFeatures.isDisabled(feature);
