/**
 * Feature flag configuration for optional features.
 */

type FeatureConfig = {
  independenceFeaturesEnabled: boolean;
};

// Default config – can be overridden by backend or local storage
const defaultConfig: FeatureConfig = {
  independenceFeaturesEnabled: true,
};

/**
 * Retrieve the current feature configuration.
 * In a real app this would fetch from backend or use persisted storage.
 */
export function getFeatureConfig(): FeatureConfig {
  if (typeof window === 'undefined') return defaultConfig;
  try {
    const raw = localStorage.getItem('sonexa.featureConfig');
    if (!raw) return defaultConfig;
    return { ...defaultConfig, ...JSON.parse(raw) } as FeatureConfig;
  } catch {
    return defaultConfig;
  }
}

/**
 * Update a single feature flag and persist it.
 */
export function setFeatureFlag(key: keyof FeatureConfig, value: boolean) {
  const config = getFeatureConfig();
  config[key] = value;
  if (typeof window !== 'undefined') {
    localStorage.setItem('sonexa.featureConfig', JSON.stringify(config));
  }
}

/**
 * Helper to quickly check if Independence features are enabled.
 */
export function isIndependenceEnabled(): boolean {
  return getFeatureConfig().independenceFeaturesEnabled;
}
