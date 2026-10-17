-- Persisted Lab settings (the Zustand store), keyed by store name.
CREATE TABLE settings (
    key        TEXT PRIMARY KEY NOT NULL,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- User-defined device presets. `spec` is the validated JSON preset.
CREATE TABLE presets (
    id         TEXT PRIMARY KEY NOT NULL,
    name       TEXT NOT NULL,
    spec       TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Console history forwarded by the preview bridge, trimmed to the newest rows on insert.
CREATE TABLE logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    level     TEXT NOT NULL,
    message   TEXT NOT NULL,
    at        INTEGER NOT NULL
);

CREATE TABLE screenshots (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id  TEXT NOT NULL,
    path       TEXT NOT NULL,
    width      INTEGER NOT NULL,
    height     INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX screenshots_created_at ON screenshots (created_at);
