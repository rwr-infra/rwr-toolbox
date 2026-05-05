---
theme: default
class: text-center
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: slide-left
title: RWR Toolbox 功能演示
download: true
---

# RWR Toolbox

## Running With Rifles 玩家与模组作者的桌面工具箱

<p class="text-sm opacity-60 mt-4">
一站式解决服务器浏览、玩家查询、数据解析、模组安装与热键配置
</p>

<div class="abs-bl m-6 text-sm opacity-60">
  开源社区驱动 · MIT License
</div>

<!--
演讲者备注：
- 大家好，今天为大家介绍 RWR Toolbox
- 这是一款专为 Running With Rifles 打造的桌面端工具箱
- 无论你是普通玩家、竞技玩家还是 MOD 作者，都能从中受益
-->

---
layout: center
class: text-center
---

# 一句话定义

<div class="text-2xl font-bold mt-8">
  RWR Toolbox 是 <span v-click class="text-blue-500">为 RWR 社区打造的</span> <span v-click class="text-green-500">一站式桌面工具</span>
</div>

<div class="mt-12 text-lg opacity-80">
  <v-clicks>
    <p>找服务器更快</p>
    <p>查战绩更全</p>
    <p>管模组更安全</p>
    <p>配热键更方便</p>
  </v-clicks>
</div>

<!--
- 不用在浏览器里切来切去查服务器
- 不用手动翻 XML 文件看武器属性
- 不用怕装模组把游戏搞坏
- 所有需求，一个工具搞定
-->

---

# 核心痛点

<div class="grid grid-cols-2 gap-8 mt-6">
  <div v-click>
    <h3 class="text-red-500 font-bold text-lg mb-3">玩家侧</h3>
    <ul class="text-sm space-y-2 opacity-90">
      <li>官方服务器列表功能单一，无法收藏、筛选</li>
      <li>玩家战绩分散在多个数据库，查询不便</li>
      <li>热键配置无法备份、分享或快速切换</li>
    </ul>
  </div>
  <div v-click>
    <h3 class="text-orange-500 font-bold text-lg mb-3">MOD 作者侧</h3>
    <ul class="text-sm space-y-2 opacity-90">
      <li>武器/物品属性散落于 XML，缺乏可视化工具</li>
      <li>手动替换游戏文件，无标准化安装/回滚机制</li>
      <li>缺少规范的 Mod 打包与配置文件校验工具</li>
    </ul>
  </div>
</div>

<div v-click class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
  <strong>RWR Toolbox 的目标：</strong>用一个统一的桌面端工具，把上述所有问题一次性解决。
</div>

<!--
- 先讲玩家痛点：找服难、查数据难、配置管理难
- 再讲作者痛点：数据解析难、模组分发难、打包原始
- 最后引出我们的解决方案
-->

---
layout: two-cols
---

# 01 仪表板 Dashboard

打开应用的第一眼，所有关键信息尽收眼底。

<v-clicks class="text-sm mt-4 space-y-2">
  <li>API 连接与游戏目录配置状态</li>
  <li>全球在线服务器数与玩家总数</li>
  <li>本地已安装模组数量概览</li>
  <li>一键刷新数据、快速跳转设置</li>
  <li>版本更新日志与最近活动流</li>
</v-clicks>

::right::

<div class="h-full flex items-center justify-center">
  <div class="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-sm opacity-50">
    [ Dashboard 截图占位 ]
  </div>
</div>

<!--
- Dashboard 是用户打开应用的第一印象
- 所有状态一目了然，零学习成本
- 未配置游戏路径时会有智能引导
- 这里可以放一张 Dashboard 的实际截图
-->

---
layout: two-cols
---

# 02 服务器浏览器

找国服、找好友房间、找特定地图，快速定位。

<v-clicks class="text-sm mt-4 space-y-2">
  <li>实时对接官方 API，展示全球在线服务器</li>
  <li>按国家、地图、关键词多维筛选</li>
  <li>一键批量 Ping 检测，排序最优节点</li>
  <li>收藏常用服务器，跨会话持久保存</li>
  <li>点击直接通过 Steam 协议加入游戏</li>
</v-clicks>

::right::

<div class="h-full flex items-center justify-center">
  <div class="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-sm opacity-50">
    [ Servers 截图占位 ]
  </div>
</div>

<!--
- 17 个字段可选显示/隐藏
- 800px 以下自动隐藏次要列
- 搜索防抖 + 分页浏览
- 空状态有明确的引导提示
-->

---
layout: two-cols
---

# 03 玩家统计

跨数据库战绩查询，17 项指标全面覆盖。

<v-clicks class="text-sm mt-4 space-y-2">
  <li>Invasion / Pacific / Pre-reset 一键切换</li>
  <li>支持全库玩家搜索，500ms 防抖</li>
  <li>击杀、死亡、K/D、分数、时长、连杀...</li>
  <li>关注高玩或好友，快速查看战绩</li>
  <li>列可见性自定义，只看关心的数据</li>
</v-clicks>

::right::

<div class="h-full flex items-center justify-center">
  <div class="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-sm opacity-50">
    [ Players 截图占位 ]
  </div>
</div>

<!--
- 对竞技玩家来说，数据就是一切
- 分页器 20/50/100 条可选
- 序号列固定，偏好持久化
-->

---
layout: two-cols
---

# 04 数据浏览器

武器与物品的深度解析，MOD 作者的"显微镜"。

<v-clicks class="text-sm mt-4 space-y-2">
  <li>武器分类浏览：突击、狙击、机枪、霰弹...</li>
  <li>姿态精度矩阵：跑步、站立、蹲伏、卧倒...</li>
  <li>物品属性全覆盖：重量、价格、容量、生成率</li>
  <li>多维度筛选与排序</li>
  <li>一键在默认编辑器中打开原始文件</li>
</v-clicks>

::right::

<div class="h-full flex items-center justify-center">
  <div class="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-sm opacity-50">
    [ Data Explorer 截图占位 ]
  </div>
</div>

<!--
- 首次进入自动静默扫描
- 详情抽屉展示完整属性
- 关联变体自动归类
- 把散落的 XML 变成可搜索的知识库
-->

---

# 05 模组管理

从安装到打包，全流程覆盖，安全可回滚。

<div class="grid grid-cols-2 gap-6 mt-6 text-sm">
  <div v-click class="p-4 border rounded-lg">
    <h4 class="font-bold text-blue-500 mb-2">安装向导</h4>
    <p class="opacity-80">三步完成安装：选择文件 → 预览信息 → 确认写入。支持备份原文件与覆盖选项。</p>
  </div>
  <div v-click class="p-4 border rounded-lg">
    <h4 class="font-bold text-green-500 mb-2">打包分发</h4>
    <p class="opacity-80">将本地 media/ 文件夹打包为标准分发格式，自动生成配置文件模板。</p>
  </div>
  <div v-click class="p-4 border rounded-lg">
    <h4 class="font-bold text-purple-500 mb-2">归档库</h4>
    <p class="opacity-80">每次安装自动保留原始 zip，支持随时重新安装或清理旧版本。</p>
  </div>
  <div v-click class="p-4 border rounded-lg">
    <h4 class="font-bold text-orange-500 mb-2">安全机制</h4>
    <p class="opacity-80">安装前自动备份，一键恢复。路径校验防止误写入。</p>
  </div>
</div>

<!--
- 不再怕装模组把游戏搞坏
- 从"手动复制 → 怕改坏"到"三步安装 + 一键回滚"
- RWRMI 标准格式支持
-->

---
layout: two-cols
---

# 06 热键管理器

让键盘配置也能"版本化"，支持社区分享。

<v-clicks class="text-sm mt-4 space-y-2">
  <li>直接从游戏目录读取当前热键配置</li>
  <li>创建多套 Profile，随时切换</li>
  <li>表格视图编辑，实时冲突检测</li>
  <li>导出 JSON / 剪贴板分享</li>
  <li>一键写回游戏目录，立即生效</li>
</v-clicks>

::right::

<div class="h-full flex items-center justify-center">
  <div class="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-sm opacity-50">
    [ Hotkeys 截图占位 ]
  </div>
</div>

<!--
- 步兵 / 载具 / 指挥官 不同流派用不同键位
- 社区大神分享配置，新人一键导入
- 版本更新热键被重置时快速恢复
-->

---

# 07 更多实用功能

<div class="grid grid-cols-3 gap-4 mt-8 text-sm">
  <div v-click class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
    <div class="text-2xl mb-2">⚙️</div>
    <h4 class="font-bold">应用设置</h4>
    <p class="opacity-70 mt-1">语言切换、主题切换、游戏路径配置</p>
  </div>
  <div v-click class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
    <div class="text-2xl mb-2">🚀</div>
    <h4 class="font-bold">Steam 启动</h4>
    <p class="opacity-70 mt-1">带参数启动游戏，调试模式一键开启</p>
  </div>
  <div v-click class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
    <div class="text-2xl mb-2">📦</div>
    <h4 class="font-bold">本地模组浏览</h4>
    <p class="opacity-70 mt-1">查看已安装 Mod 的来源与文件结构</p>
  </div>
  <div v-click class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
    <div class="text-2xl mb-2">🌐</div>
    <h4 class="font-bold">运行时国际化</h4>
    <p class="opacity-70 mt-1">中英文一键切换，无需重启</p>
  </div>
  <div v-click class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
    <div class="text-2xl mb-2">🖥️</div>
    <h4 class="font-bold">极端分辨率兼容</h4>
    <p class="opacity-70 mt-1">800×600 到 4K 均完整可用</p>
  </div>
  <div v-click class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
    <div class="text-2xl mb-2">⌨️</div>
    <h4 class="font-bold">键盘快捷键</h4>
    <p class="opacity-70 mt-1">全局快捷键支持，提升操作效率</p>
  </div>
</div>

<!--
- 设置页面：语言、主题、路径、多目录扫描
- Steam 启动：支持各种调试参数
- 真正为桌面环境设计的工具
-->

---

# 产品亮点

<div class="mt-6 space-y-4">
  <div v-click class="flex items-start gap-4">
    <div class="text-2xl">🎯</div>
    <div>
      <h4 class="font-bold">一站式整合</h4>
      <p class="text-sm opacity-70">服务器、玩家、数据、模组、热键，一个工具全搞定，无需在多个网页与脚本间切换。</p>
    </div>
  </div>
  <div v-click class="flex items-start gap-4">
    <div class="text-2xl">🛡️</div>
    <div>
      <h4 class="font-bold">安全可回滚</h4>
      <p class="text-sm opacity-70">模组安装前自动备份，一键恢复；归档库保留历史版本，随时重新安装。</p>
    </div>
  </div>
  <div v-click class="flex items-start gap-4">
    <div class="text-2xl">📊</div>
    <div>
      <h4 class="font-bold">高信息密度</h4>
      <p class="text-sm opacity-70">针对桌面环境深度优化，800×600 完整可用，4K 不撕裂，长时间使用不疲劳。</p>
    </div>
  </div>
  <div v-click class="flex items-start gap-4">
    <div class="text-2xl">🌍</div>
    <div>
      <h4 class="font-bold">社区驱动</h4>
      <p class="text-sm opacity-70">MIT 协议完全开源，无广告无追踪，欢迎提交 Issue 与 PR。</p>
    </div>
  </div>
</div>

<!--
- 亮点总结：从用户价值出发
- 一站式 = 省时
- 安全 = 放心
- 高密度 = 高效
- 开源 = 可信
-->

---

# 路线图

<div class="mt-4">
  <h3 class="text-green-600 font-bold mb-3">✅ 已上线 (v0.1.2)</h3>
  <div class="grid grid-cols-3 gap-3 text-sm mb-6">
    <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">仪表板 Dashboard</div>
    <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">服务器浏览器</div>
    <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">玩家统计</div>
    <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">武器/物品浏览器</div>
    <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">模组安装/打包/归档</div>
    <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">热键 Profile 管理</div>
  </div>

  <h3 class="text-blue-600 font-bold mb-3">🚧 近期计划 (v0.2.x)</h3>
  <div class="grid grid-cols-2 gap-3 text-sm mb-6">
    <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">📂 <strong>单机存档浏览器</strong> — 浏览、备份与分享本地战役进度</div>
    <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">✨ 全局交互优化 — 搜索体验、空状态、操作反馈</div>
  </div>

  <h3 class="text-purple-600 font-bold mb-3">🔮 远期愿景：全面游戏数据解析</h3>
  <div class="grid grid-cols-4 gap-3 text-sm">
    <div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">阵营数据查看</div>
    <div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">声音与音效数据预览</div>
    <div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">地图与地形数据预览</div>
  </div>
  <p class="text-xs text-center mt-3 opacity-60">目标：成为 RWR 游戏数据的"百科全书"级浏览与查询工具</p>
</div>

<!--
- 展示项目成熟度：核心功能已经可用
- 近期计划显示持续迭代
- 远期愿景展示想象空间
-->

---
layout: center
class: text-center
---

# 参与贡献

<div class="text-lg mt-8">
  RWR Toolbox 是一个社区驱动的开源项目
</div>

<div class="grid grid-cols-4 gap-6 mt-12 text-sm">
  <div v-click>
    <div class="text-3xl mb-2">🐛</div>
    <div class="font-bold">提交 Issue</div>
    <div class="opacity-60 mt-1">反馈 Bug 与建议</div>
  </div>
  <div v-click>
    <div class="text-3xl mb-2">🔧</div>
    <div class="font-bold">提交 PR</div>
    <div class="opacity-60 mt-1">修复与功能实现</div>
  </div>
  <div v-click>
    <div class="text-3xl mb-2">🌐</div>
    <div class="font-bold">翻译</div>
    <div class="opacity-60 mt-1">扩展更多语言</div>
  </div>
  <div v-click>
    <div class="text-3xl mb-2">📣</div>
    <div class="font-bold">分享传播</div>
    <div class="opacity-60 mt-1">推荐给社区伙伴</div>
  </div>
</div>

<div v-click class="mt-12 text-sm opacity-60">
  GitHub 仓库 · MIT License · 欢迎 Star
</div>

<!--
- 鼓励社区参与
- 多种参与方式，门槛低
- 不只是写代码，翻译、测试、传播都欢迎
-->

---
layout: cover
class: text-center
---

# 感谢聆听

## RWR Toolbox — 为 Running With Rifles 社区而生

<div class="mt-12 text-lg opacity-80">
  <p>"Created with ❤️ for the RWR Community"</p>
</div>

<div class="mt-16">
  <p class="text-sm opacity-60">开源 · 免费 · 社区驱动</p>
</div>

<div class="abs-bl m-6 text-sm opacity-40">
  RWR Toolbox 与 Osumia Games 无关联，纯属社区贡献。
</div>

<!--
- 结束语
- 强调非官方、社区驱动的属性
- 欢迎试用与反馈
-->
