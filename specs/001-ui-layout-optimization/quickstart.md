# Quickstart: Performance Profiling for Zero-Blockage

## 1. Verify Main-Thread Freedom

1. Open Chrome DevTools in the Tauri app (`Ctrl+Shift+I` or `Cmd+Option+I`).
2. Go to the **Performance** tab.
3. Click the **Record** button.
4. Navigate to **Data > Weapons** and click **Refresh**.
5. While the scan is running, click **Dashboard** and **Players** multiple times.
6. Stop recording.
7. **Expectation**: Look for the "Main" track. There should be NO red bars (Long Tasks > 50ms). The "Worker" track should show the processing activity instead.

## 2. Verify Progressive Rendering

1. Navigate to a directory with 1000+ items.
2. Observe the table.
3. **Expectation**: The first 50-100 items should appear almost instantly, with the rest populating smoothly as the scroll bar shrinks.

## 3. Verify Cancellation

1. Start a large scan.
2. Immediately switch to the **About** page.
3. Open the **Console**.
4. **Expectation**: You should see a log entry `[Scanner] Scan aborted by user`.
