use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "event", content = "data", rename_all = "camelCase")]
pub enum ScanEvent<T> {
    Chunk(Vec<T>),
    Progress { current: usize, total: usize },
    Error(String),
    Finished,
}
