#!/usr/bin/env bash
set -euo pipefail

# Optional PHP policy/syntax runner for workspaces without a native PHP CLI.
# Keep this out of the default build/lint gates: WASM cannot verify native
# PHP/MySQL integration, database behavior, or concurrency.
npx --yes --package=@php-wasm/cli@3.1.57 -c '
  set -e
  php-wasm-cli scripts/verify-access-control.php
  for file in $(find api scripts -type f -name "*.php" | sort); do
    php-wasm-cli -l "$file"
  done
'
