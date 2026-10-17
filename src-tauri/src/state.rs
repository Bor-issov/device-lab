use std::collections::HashMap;
use std::sync::atomic::AtomicU32;
use std::sync::Mutex;

use sqlx::SqlitePool;
use tokio::task::AbortHandle;

pub struct AppState {
    pub db: SqlitePool,
    /// Live Android screen streams, keyed by the id handed to the frontend.
    pub streams: Mutex<HashMap<u32, AbortHandle>>,
    pub next_stream: AtomicU32,
}

impl AppState {
    pub fn new(db: SqlitePool) -> Self {
        Self { db, streams: Mutex::new(HashMap::new()), next_stream: AtomicU32::new(1) }
    }
}
