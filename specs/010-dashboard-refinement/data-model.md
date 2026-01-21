# Data Model: Dashboard Refinement

## Entities

### DashboardStats (Extended)

| Field        | Type           | Description                                      |
| ------------ | -------------- | ------------------------------------------------ |
| serverCount  | number         | Count of active servers                          |
| playerCount  | number         | Total players online                             |
| modCount     | number         | Total packages found in all active directories   |
| apiStatus    | string         | 'online', 'offline', 'loading'                   |
| apiPing      | number \| null | Latency to RWR official API in ms                |
| hasValidPath | boolean        | True if at least one valid game directory exists |
| lastUpdate   | number         | Timestamp of last sync                           |

### SystemStatus (Extended)

| Field              | Type           | Description                   |
| ------------------ | -------------- | ----------------------------- |
| apiConnected       | boolean        | True if API is reachable      |
| apiPing            | number \| null | Current latency               |
| cacheEnabled       | boolean        |                               |
| gamePathConfigured | boolean        | True if valid directories > 0 |
| lastUpdate         | number         |                               |
