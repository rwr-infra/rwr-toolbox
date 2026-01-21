# RWR Toolbox

> [!WARNING] > **Active Development**: This project is in its early stages and should be considered **unstable**. Features may change or break without notice.

A high-performance desktop utility designed for **Running With Rifles** players and modders. Built with safety and speed in mind, RWR Toolbox provides a comprehensive suite of tools to manage game data, servers, and configurations.

## Disclaimer

**RWR Toolbox** is a community-driven project and is **not** affiliated with, authorized, maintained, sponsored, or endorsed by **Osumia Games**.

All **Running With Rifles** related content, assets, and trademarks—including but not limited to the game data parsed by this tool—are the sole property of **Osumia Games**. This utility is provided purely as a community resource to interface with game files provided by the original installation.

## Key Features

- **Data Explorer**: Parallel scanning of game directories to browse Weapons and Items with full XML attribute parsing.
- **Server Browser**: Real-time server listing with favorite tracking and low-latency pinging.
- **Player Statistics**: Track and search player rankings across multiple game databases.
- **Mod Management**: Streamlined installation and bundling of local mods with backup support.
- **Hotkey Manager**: Read, create, and share custom keyboard profiles for the game.
- **Modern UX**: Fully responsive UI (800x600 compliant) with dark mode, search highlighting, and i18n support.

## Tech Stack

- **Frontend**: Angular v20, TypeScript, Tailwind CSS v4, DaisyUI v5.
- **Backend**: Rust, Tauri v2.x.
- **Performance**: Rayon for parallel file processing, Quick-XML for efficient parsing.
- **State Management**: Angular Signals.
- **Internationalization**: Transloco.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Rust](https://www.rust-lang.org/) (stable)
- [pnpm](https://pnpm.io/)

### Development

Install dependencies:

```bash
pnpm install
```

Start the application in development mode:

```bash
pnpm tauri dev
```

### Build

Build the production-ready installer:

```bash
pnpm tauri build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE) - see the file for details.

Copyright (c) 2026 **rwr-toolbox**
