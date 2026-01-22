# Contracts: Tauri Commands (Game Path Setup)

Created: 2026-01-22

This document lists the expected command-level interactions needed to support the feature.

## Directory Validation

### Validate Game Installation Directory

Purpose:

- Determine whether the configured game installation directory can provide game content.

Inputs:

- path: string

Outputs:

- valid: boolean
- message: string
- errorCode: string (optional)

Notes:

- Must accept macOS and Windows/Linux directory layouts.
- Validation should match the scan logic so “valid” implies scans can succeed.

## Data Scanning

### Scan Weapons / Items using combined roots

Purpose:

- Data pages must scan from combined roots: (game install dir optional) + (scan directories list).

Inputs:

- combinedRoots: string[]

Outputs:

- weapons/items arrays (with de-duplication semantics)
- errors array

Notes:

- Must not block navigation.
- Must avoid redundant downstream path/icon requests.
