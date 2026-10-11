const STORAGE_PREFIX = 'nik_smart_count_';

const LEGACY_EXPORT_KEYS: Record<string, string> = {
  lang: 'language',
  currentProjId: 'currentProjectId',
  projects: 'projects',
  expenses: 'expenses',
  steel: 'steelRecords',
  concrete: 'concreteRecords',
  contractors: 'contractors',
  suppliers: 'suppliers',
  labor: 'laborRecords',
  assets: 'assets',
  apartments: 'apartments',
  payments: 'payments',
  documents: 'documents',
  projectPartners: 'projectPartners',
  projectInvestments: 'projectInvestments',
  partnerEquityTransfers: 'partnerEquityTransfers',
  projectBudgets: 'projectBudgets',
  appSettings: 'appSettings',
};

const SECRET_KEYS = new Set([
  'password', 'passwords', 'passwordhash', 'token', 'accesstoken', 'refreshtoken', 'session', 'sessionid',
  'csrf', 'csrftoken', 'gatekey', 'apikey', 'geminiapikey', 'clientsecret', 'secretkey', 'secret',
  'idtoken', 'oauthtoken', 'firebaseidtoken', 'privatekey', 'credential', 'credentials', 'authorization', 'cookie',
  'otp', 'otpcode', 'verificationcode', 'onetimepassword',
]);

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSecretKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return SECRET_KEYS.has(normalized)
    || /(?:password|passwd|secret|token|credential|authorization|cookie|session|csrf|otp|totp|twofactor|privatekey|apikey|clientsecret|bearer|mfa)/.test(normalized);
}

function withoutSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutSecrets);
  if (!value || typeof value !== 'object') return value;
  const clean: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (isSecretKey(key)) continue;
    clean[key] = withoutSecrets(child);
  }
  return clean;
}

/**
 * Explicit, read-only export of legacy browser business records. It intentionally excludes
 * local accounts, current sessions, audit/security logs, and any secret-like fields. Nothing
 * is imported automatically or removed from localStorage.
 */
export function exportLegacyBrowserData(): { success: boolean; exportedCount?: number; error?: string } {
  try {
    const legacyData: Record<string, unknown> = {
      version: 'legacy-browser-export-v1',
      exportedAt: new Date().toISOString(),
      appName: 'NSC legacy browser business data',
      source: 'Explicit browser-storage export; review before importing',
    };
    let exportedCount = 0;

    for (const [legacyKey, exportKey] of Object.entries(LEGACY_EXPORT_KEYS)) {
      const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${legacyKey}`);
      if (raw === null) continue;
      let value: unknown;
      try {
        value = JSON.parse(raw);
      } catch {
        return { success: false, error: `Legacy item "${legacyKey}" contains invalid JSON. No file was created.` };
      }
      legacyData[exportKey] = withoutSecrets(value);
      exportedCount += 1;
    }

    if (exportedCount === 0) {
      return { success: false, exportedCount: 0, error: 'No legacy NSC business records were found in this browser.' };
    }

    const json = JSON.stringify(legacyData, null, 2);
    if (json.length > 15 * 1024 * 1024) {
      return { success: false, error: 'Legacy browser data is larger than the supported reviewed-import size.' };
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nsc_legacy_business_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { success: true, exportedCount };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Could not read legacy browser data.' };
  }
}
