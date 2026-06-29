// Barrel re-exports for backward compatibility.
// Prefer direct imports from submodules (e.g. `@/utils/dates`, `@/utils/metrics`)
// during future cleanup.

export * from './metrics';
export * from './dates';
export * from './text';
export * from './keywords';

// Note: icons, emoji, video, keywords are imported via their direct subpaths
// (e.g. `@/utils/icons`) to avoid pulling server-only code (react-dom/server in icons)
// into client bundles or static routes via the barrel.
