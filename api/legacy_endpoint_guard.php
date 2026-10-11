<?php
/**
 * Fail-closed guard for legacy relational endpoints whose tables do not yet have
 * consistently migrated tenant keys and server-enforced project/module/action ACLs.
 * Keep these routes unavailable until their schema and authorization are reviewed.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

function nscBlockLegacyRelationalEndpoint(): void {
    sendSecurityHeaders();
    $user = authenticateUser(false);
    requireTenantOwner($user);
    jsonResponse(false, null, 'This legacy endpoint is disabled pending a reviewed tenant-scoped migration. Use workspace persistence.', 410);
}
