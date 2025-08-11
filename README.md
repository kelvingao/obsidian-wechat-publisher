# Obsidian WeChat Publisher

A plugin for publishing Obsidian notes to WeChat Official Accounts, with support for Markdown conversion, style optimization, and image uploading.

## Features

- ✨ **Markdown Conversion**: Full Markdown syntax support including headers, code blocks, links, and images
- 🎨 **Style Optimization**: CSS styles optimized for WeChat Official Accounts
- 📸 **Image Processing**: Automatic upload of local images to WeChat servers
- 🔗 **Link Management**: Support for footnote-style link display
- 📋 **Preview Function**: Real-time preview of WeChat Official Account effects
- 🚀 **One-click Publishing**: Direct publishing to WeChat Official Account drafts

## Installation

1. Download the latest plugin files
2. Extract to Obsidian plugin directory: `.obsidian/plugins/obsidian-wechat-publisher/`
3. Enable the plugin in Obsidian settings
4. Configure WeChat Official Account AppID and Secret

## Usage

### Basic Configuration

1. Open Obsidian Settings → Community Plugins → WeChat Publisher
2. Enter your WeChat Official Account AppID and Secret
3. Set default author (optional)

### Publishing Articles

1. Open the Markdown file you want to publish
2. Click the share icon in the left ribbon or use the command palette
3. Review the effects in the preview window
4. Click "Publish to Draft" to complete publishing

### Front Matter Configuration

Add YAML configuration at the top of your Markdown file:

```yaml
---
title: "Article Title"
author: "Author Name"
digest: "Article Summary"
banner: "Cover Image Path"
show_cover_pic: true
need_open_comment: true
content_source_url: "Original Article URL"
---
```

## Project Structure

### Source Code Directory (`src/`)

```
src/
├── api/
│   └── wechat-api.ts              # WeChat Official Account API wrapper
├── markdown/
│   ├── extension.ts               # Markdown extension base class
│   ├── heading.ts                 # Heading rendering extension
│   ├── code.ts                    # Code block rendering extension (syntax highlighting + line numbers)
│   ├── link.ts                    # Link rendering extension (footnote-style links)
│   └── image.ts                   # Image processing extension (local image upload)
├── converter.ts                   # Content converter (main controller coordinating services)
├── markdown-parser.ts             # Markdown parser (pure parsing logic)
├── article-service.ts             # Article business service (metadata processing, Front Matter parsing, cover upload)
├── wechat-publisher.ts            # WeChat publisher (WeChat formatting, CSS inlining, HTML cleaning)
├── preview-modal.ts               # Preview modal (article preview interface)
├── settings-tab.ts                # Settings interface (plugin configuration page)
├── settings.ts                    # Configuration management (default settings and configuration type definitions)
├── types.ts                       # TypeScript type definitions
└── utils.ts                       # Utility functions (URL validation, CSS parsing, and other common functions)
```

### Architecture Design

This project adopts a clean layered architecture, breaking down the original monolithic file into multiple service classes with clear responsibilities:

#### 🏗️ **Core Architecture Layers**

1. **Controller Layer**: `converter.ts` - Coordinator that integrates various services
2. **Service Layer**: `article-service.ts` - Business logic processing  
3. **Parser Layer**: `markdown-parser.ts` - Pure parsing functionality
4. **Publisher Layer**: `wechat-publisher.ts` - Output formatting
5. **UI Layer**: `preview-modal.ts`, `settings-tab.ts` - User interface

#### 🔧 **Extension System**

- **Extension Base Class**: Unified extension interface
- **Specialized Extensions**: Independent extensions for headers, code, links, images, etc.
- **Pluggable Design**: Easy to add new Markdown processing features

## Development

### Requirements

- Node.js >= 16
- TypeScript >= 4.0

### Build

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Run tests
npm test
```

### Code Standards

- Use TypeScript strict mode
- Follow ESLint configuration rules
- Use Extension pattern for feature extensions
- Single responsibility principle, each class focuses on a single function

## Contributing

Issues and Pull Requests are welcome!

### Development Guide

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Changelog

### v1.1.0
- ✨ Refactored architecture with layered design
- ✨ Optimized Markdown parsing performance
- ✨ Improved image upload mechanism
- ✨ Enhanced error handling
- 🐛 Fixed heading style display issues

### v1.0.0
- 🎉 Initial release
- ✨ Basic Markdown conversion functionality
- ✨ WeChat Official Account publishing support
- ✨ Image upload functionality