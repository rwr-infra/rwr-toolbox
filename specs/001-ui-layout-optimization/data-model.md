# Data Model: UI Layout and Performance Optimization (Iteration 3)

## Worker Communication

### Worker Request

| Field     | Type                             | Description                              |
| --------- | -------------------------------- | ---------------------------------------- |
| `type`    | `'SCAN_WEAPONS' \| 'SCAN_ITEMS'` | The operation to perform.                |
| `payload` | `any`                            | Parameters like `gamePath`, `directory`. |
| `id`      | `string`                         | Unique request ID for cancellation.      |

### Worker Response

| Field       | Type                                    | Description                            |
| ----------- | --------------------------------------- | -------------------------------------- |
| `type`      | `'DATA_CHUNK' \| 'COMPLETE' \| 'ERROR'` | Message type.                          |
| `payload`   | `any`                                   | Processed data chunk or error message. |
| `requestId` | `string`                                | Matches the original request.          |

## Channel Events (Rust to Worker)

### ScanEvent

```rust
#[derive(Serialize)]
#[serde(tag = "event", content = "data")]
pub enum ScanEvent<T> {
    Chunk(Vec<T>),
    Progress { current: usize, total: usize },
    Error(String),
    Finished
}
```
