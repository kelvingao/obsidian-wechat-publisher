# Obsidian WeChat Publisher

一个用于将 Obsidian 笔记发布到微信公众号的插件，支持 Markdown 转换、样式优化和图片上传。

## 功能特性

- ✨ **Markdown 转换**: 支持标题、代码块、链接、图片等完整 Markdown 语法
- 🎨 **样式优化**: 针对微信公众号优化的 CSS 样式
- 📸 **图片处理**: 自动上传本地图片到微信服务器
- 🔗 **链接管理**: 支持脚注式链接显示
- 📋 **预览功能**: 实时预览微信公众号效果
- 🚀 **一键发布**: 直接发布到微信公众号草稿箱

## 安装

1. 下载最新版本的插件文件
2. 解压到 Obsidian 插件目录：`.obsidian/plugins/obsidian-wechat-publisher/`
3. 在 Obsidian 设置中启用插件
4. 配置微信公众号 AppID 和 Secret

## 使用方法

### 基础配置

1. 打开 Obsidian 设置 → 社区插件 → WeChat Publisher
2. 填入微信公众号的 AppID 和 Secret
3. 设置默认作者（可选）

### 发布文章

1. 打开要发布的 Markdown 文件
2. 点击左侧功能区的分享图标或使用命令面板
3. 在预览窗口中检查效果
4. 点击"发布到草稿箱"完成发布

### Front Matter 配置

在 Markdown 文件顶部添加 YAML 配置：

```yaml
---
title: "文章标题"
author: "作者名称"
digest: "文章摘要"
banner: "封面图片路径"
show_cover_pic: true
need_open_comment: true
content_source_url: "原文链接"
---
```

## 项目结构

### 源码目录结构 (`src/`)

```
src/
├── api/
│   └── wechat-api.ts              # 微信公众号 API 接口封装
├── markdown/
│   ├── extension.ts               # Markdown 扩展基类
│   ├── heading.ts                 # 标题渲染扩展
│   ├── code.ts                    # 代码块渲染扩展（语法高亮 + 行号）
│   ├── link.ts                    # 链接渲染扩展（脚注式链接）
│   └── image.ts                   # 图片处理扩展（本地图片上传）
├── converter.ts                   # 内容转换器（协调各个服务的主控制器）
├── markdown-parser.ts             # Markdown 解析器（纯解析逻辑，对应 note-to-mp 的 parser.ts）
├── article-service.ts             # 文章业务服务（元数据处理、Front Matter 解析、封面上传）
├── wechat-publisher.ts            # 微信发布器（微信格式化、CSS 内联、HTML 清理）
├── preview-modal.ts               # 预览模态框（文章预览界面）
├── settings-tab.ts                # 设置界面（插件配置页面）
├── settings.ts                    # 配置管理（默认设置和配置类型定义）
├── types.ts                       # TypeScript 类型定义
└── utils.ts                       # 工具函数（URL 验证、CSS 解析等通用功能）
```

### 架构设计

本项目采用清晰的分层架构，将原本单一的大文件拆分为职责明确的多个服务类：

#### 🏗️ **核心架构层次**

1. **Controller 层**: `converter.ts` - 协调器，整合各个服务
2. **Service 层**: `article-service.ts` - 业务逻辑处理  
3. **Parser 层**: `markdown-parser.ts` - 纯解析功能
4. **Publisher 层**: `wechat-publisher.ts` - 输出格式化
5. **UI 层**: `preview-modal.ts`, `settings-tab.ts` - 用户界面

#### 🔧 **扩展系统**

- **Extension 基类**: 统一的扩展接口
- **专用扩展**: 标题、代码、链接、图片等独立扩展
- **可插拔设计**: 易于添加新的 Markdown 处理功能

#### 📦 **与 note-to-mp 的对应关系**

| note-to-mp | 本项目 | 说明 |
|------------|--------|------|
| `note-preview.ts` (948行) | `converter.ts` + 分离的服务类 | 我们采用分层架构替代单一文件 |
| `weixin-api.ts` | `api/wechat-api.ts` | 微信 API 封装 |
| `widgets-modal.ts` | `preview-modal.ts` | 预览界面 |
| `settings.ts`, `setting-tab.ts` | `settings.ts`, `settings-tab.ts` | 配置管理 |

## 开发

### 环境要求

- Node.js >= 16
- TypeScript >= 4.0

### 构建

```bash
# 安装依赖
npm install

# 开发构建（监听模式）
npm run dev

# 生产构建
npm run build

# 运行测试
npm test
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置规则
- 采用 Extension 模式进行功能扩展
- 单一职责原则，每个类专注单一功能

## 贡献

欢迎提交 Issue 和 Pull Request！

### 开发指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 致谢

本项目参考了 [note-to-mp](https://github.com/sunbooshi/note-to-mp) 的架构设计，在此表示感谢。

---

## 更新日志

### v1.1.0
- ✨ 重构架构，采用分层设计
- ✨ 优化 Markdown 解析性能
- ✨ 改进图片上传机制
- ✨ 增强错误处理
- 🐛 修复标题样式显示问题

### v1.0.0
- 🎉 初始版本发布
- ✨ 基础 Markdown 转换功能
- ✨ 微信公众号发布支持
- ✨ 图片上传功能