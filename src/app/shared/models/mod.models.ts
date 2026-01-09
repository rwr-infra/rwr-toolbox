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
