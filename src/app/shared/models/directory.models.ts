/**
 * Directory Models
 *
 * Models for managing scan directory configuration, validation, and progress tracking.
 */

/**
 * Represents a user-configured directory for scanning game data
 */
export interface ScanDirectory {
    /** Unique identifier for this directory configuration */
    id: string;

    /** Full file system path to the directory */
    path: string;

    /** Current validation status */
    status: DirectoryStatus;

    /** Display name (extracted from path or user-provided) */
    displayName: string;

    /** Timestamp when this directory was added */
    addedAt: number;

    /** Timestamp of last successful scan (0 if never scanned) */
    lastScannedAt: number;

    /** Number of items found in last scan */
    itemCount?: number;

    /** Number of weapons found in last scan */
    weaponCount?: number;

    /** Optional: Type classification (game/workshop/other) */
    type?: 'game' | 'workshop' | 'other';

    /** Include this directory in scans (default: true) */
    active?: boolean;

    /** Number of package subdirectories */
    packageCount?: number;

    /** Last validation error if status is 'invalid' */
    lastError?: ValidationResult;
}

/**
 * Validation status of a directory
 */
export type DirectoryStatus =
    | 'valid' // Directory exists and contains media subdirectory
    | 'invalid' // Directory failed validation
    | 'pending'; // Validation in progress

/**
 * Result of directory validation from backend
 */
export interface ValidationResult {
    /** Whether the directory is valid for scanning */
    valid: boolean;

    /** Error code if validation failed */
    errorCode: DirectoryErrorCode | null;

    /** Localized error message for display */
    message: string;

    /** Optional: Additional context */
    details?: {
        /** Whether the path exists */
        pathExists: boolean;
        /** Whether the path is a directory */
        isDirectory: boolean;
        /** Whether the path is readable */
        isReadable: boolean;
        /** Whether media subdirectory exists */
        hasMediaSubdirectory: boolean;
    };

    /** Number of package subdirectories found */
    packageCount?: number;
}

/**
 * Error codes for directory validation
 */
export type DirectoryErrorCode =
    | 'path_not_found' // Path does not exist on filesystem
    | 'not_a_directory' // Path exists but is not a directory
    | 'access_denied' // Directory exists but cannot be read
    | 'missing_media_subdirectory' // Directory exists but lacks media subdirectory
    | 'duplicate_directory'; // Directory already in configured list

/**
 * Progress tracking for multi-directory scanning
 */
export interface ScanProgress {
    /** Total number of directories to scan */
    total: number;

    /** Number of directories completed */
    completed: number;

    /** Currently scanning directory path */
    currentPath: string | null;

    /** Scan state */
    state: ScanState;

    /** Errors encountered during scan (path → error message) */
    errors: Record<string, string>;
}

/**
 * Scan state during multi-directory scanning
 */
export type ScanState =
    | 'idle' // Not scanning
    | 'scanning' // Currently scanning directories
    | 'completed' // All directories scanned
    | 'partial'; // Some directories failed, others succeeded
