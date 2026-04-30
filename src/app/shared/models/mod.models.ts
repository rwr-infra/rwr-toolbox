/**
 * Mod 文件条目（包含路径和大小，用于选择性安装）
 */
export interface ModFileEntry {
    /** 文件在 zip 中的路径 */
    path: string;
    /** 文件大小（字节） */
    size: number;
}

/**
 * Mod 读取信息（从 RWRMI ZIP 中解析）
 * 对应 Rust 端 OutputConfig 结构
 */
export interface ModReadInfo {
    /** Mod 标题 */
    title: string;
    /** Mod 描述 */
    description: string;
    /** 作者列表 */
    authors: string[];
    /** 版本号 */
    version: string;
    /** 适配游戏版本 */
    game_version: string;
    /** 文件信息列表（用于展示，包含文件名和大小） */
    file_log_info: string[];
    /** 文件路径列表（用于备份） */
    file_path_list: string[];
    /** 文件条目列表（用于选择性安装） */
    file_entries: ModFileEntry[];
    /** README.md 内容（Markdown 格式） */
    readme_content: string;
    /** CHANGELOG.md 内容（Markdown 格式） */
    changelog_content: string;
}

/**
 * Mod 安装选项
 */
export interface ModInstallOptions {
    /** 安装前备份原始文件 */
    backup: boolean;
    /** 覆盖已存在的文件 */
    overwrite: boolean;
    /** 用户选中的要安装的文件路径列表 */
    selectedFiles: string[];
}

/**
 * 游戏路径信息
 */
export interface GamePathInfo {
    /** 游戏根目录 */
    gamePath: string;
    /** 路径是否有效 */
    isValid: boolean;
    /** 验证时间戳 */
    verifiedAt: number;
}

/**
 * Mod 打包信息
 */
export interface ModBundleInfo {
    /** Mod 标题 */
    title: string;
    /** Mod 描述 */
    description: string;
    /** 作者列表 */
    authors: string[];
    /** 版本号 */
    version: string;
    /** 适配游戏版本 */
    game_version: string;
}

/**
 * Mod 安装历史记录
 */
export interface ModInstallHistory {
    /** Mod 标题 */
    title: string;
    /** 操作类型 */
    action: 'install' | 'uninstall' | 'backup' | 'recover';
    /** 时间戳 */
    timestamp: number;
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
}

/**
 * Mod 归档条目（assets 列表展示）
 */
export interface ModArchiveEntry {
    /** 唯一标识 */
    id: string;
    /** 归档文件绝对路径 */
    filePath: string;
    /** 原始文件名 */
    fileName: string;
    /** 归档时间戳 */
    archivedAt: number;
    /** 缓存的元数据 */
    title?: string;
    description?: string;
    version?: string;
    gameVersion?: string;
    authors?: string[];
}
