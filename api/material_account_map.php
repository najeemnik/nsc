<?php
/**
 * Server-side material category -> Chart of Accounts resolver.
 *
 * This is a helper, not an HTTP endpoint. The same public JSON map is bundled
 * by the client and read here. The server always overwrites submitted
 * accountCode values; clients may submit category identifiers only.
 */
function nscMaterialAccountMapData(): array {
    static $cached = null;
    if (is_array($cached)) return $cached;

    $fallback = [
        'default_account_code' => '5990',
        'categories' => [],
        'legacy_accounts' => [],
    ];
    $path = __DIR__ . '/material_account_map.json';
    $raw = @file_get_contents($path);
    if (!is_string($raw)) {
        error_log('Material account map JSON could not be read.');
        return $cached = $fallback;
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        error_log('Material account map JSON is invalid.');
        return $cached = $fallback;
    }

    $defaultCode = $data['default_account_code'] ?? null;
    if (!is_string($defaultCode) || !preg_match('/^[0-9]{4,5}$/D', $defaultCode)) {
        $defaultCode = '5990';
    }
    $categories = [];
    $rawCategories = $data['categories'] ?? [];
    if (!is_array($rawCategories)) $rawCategories = [];
    foreach ($rawCategories as $category) {
        if (!is_array($category) || !is_string($category['id'] ?? null)
            || !is_string($category['account_code'] ?? null)
            || !preg_match('/^[0-9]{4,5}$/D', $category['account_code'])) continue;
        $categories[strtolower(trim($category['id']))] = $category['account_code'];
    }
    $legacy = [];
    $rawLegacy = $data['legacy_accounts'] ?? [];
    if (!is_array($rawLegacy)) $rawLegacy = [];
    foreach ($rawLegacy as $category => $accountCode) {
        if (!is_string($category) || !is_string($accountCode)
            || !preg_match('/^[0-9]{4,5}$/D', $accountCode)) continue;
        $legacy[strtolower(trim($category))] = $accountCode;
    }

    return $cached = [
        'default_account_code' => $defaultCode,
        'categories' => $categories,
        'legacy_accounts' => $legacy,
    ];
}

/** Resolve a category label/identifier without accepting a client account code. */
function nscResolveMaterialAccountCode($category): string {
    $map = nscMaterialAccountMapData();
    if (!is_string($category) || strlen($category) > 200) {
        return $map['default_account_code'];
    }
    $key = strtolower(trim($category));
    return $map['categories'][$key]
        ?? $map['legacy_accounts'][$key]
        ?? $map['default_account_code'];
}

/** Attach a trusted account-code projection to workspace procurement rows. */
function nscMaterialAnnotateWorkspace(array &$workspace): void {
    if (!isset($workspace['materialProcurements']) || !is_array($workspace['materialProcurements'])) return;
    foreach ($workspace['materialProcurements'] as $index => $record) {
        if (!is_array($record)) continue;
        $category = $record['materialCategory'] ?? $record['material_category'] ?? null;
        $record['accountCode'] = nscResolveMaterialAccountCode($category);
        $workspace['materialProcurements'][$index] = $record;
    }
}
