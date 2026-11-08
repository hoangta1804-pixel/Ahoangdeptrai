export interface FeatureFlags {
  shouldHave: {
    carousel360: boolean;
    prevNextProduct: boolean;
    reorder: boolean;
  };
  couldHave: {
    notifyBackInStock: boolean;
  };
  mockup: {
    arPlaceholder: boolean;
  };
}

export const defaultFeatureFlags: FeatureFlags = {
  shouldHave: {
    carousel360: true,
    prevNextProduct: true,
    reorder: true,
  },
  couldHave: {
    notifyBackInStock: true,
  },
  mockup: {
    arPlaceholder: false,
  },
};

const STORAGE_KEY = 'dss_feature_flags';

export function getFeatureFlags(): FeatureFlags {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultFeatureFlags;
    const parsed = JSON.parse(raw);
    return {
      shouldHave: { ...defaultFeatureFlags.shouldHave, ...parsed.shouldHave },
      couldHave: { ...defaultFeatureFlags.couldHave, ...parsed.couldHave },
      mockup: { ...defaultFeatureFlags.mockup, ...parsed.mockup },
    };
  } catch {
    return defaultFeatureFlags;
  }
}

export function saveFeatureFlags(flags: FeatureFlags): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    window.dispatchEvent(new CustomEvent('dss:flags-changed', { detail: flags }));
  } catch (e) {
    console.error('Failed to save feature flags', e);
  }
}
