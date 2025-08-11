# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-01-11

### Added
- **Draft Update Functionality**: Intelligent detection of existing drafts and ability to update them
  - Smart button switching: "发布到草稿箱" → "更新草稿箱" when `media_id` exists in frontmatter
  - New `updateDraft` API method for modifying existing WeChat drafts
  - Automatic status tracking with `publish_status` field (drafted, published, updated, failed, update_failed)
  - Enhanced error handling and user feedback for draft update operations

- **Enhanced Code Highlighting**: Comprehensive improvements for WeChat mobile display
  - Fixed line break preservation in code blocks (converts `\n` to `<br>` tags)
  - Mobile-optimized CSS with responsive design for iOS WeChat viewing
  - Multiple syntax highlighting themes: Default, GitHub, Dark, Monokai
  - Integration with highlight.js for professional code syntax highlighting
  - Improved code block scrolling and display on mobile devices

- **User Interface Enhancements**: 
  - New format settings panel with theme selection dropdowns
  - Enhanced settings interface with code highlighting theme picker
  - Real-time button state updates based on frontmatter content
  - Improved preview modal with better mobile compatibility

### Enhanced
- **ArticleMetadata Interface**: Added new fields for draft management
  - `media_id`: Draft ID for updating existing drafts
  - `last_publish_time`: Timestamp tracking for publishing operations  
  - `publish_status`: Detailed status tracking for all publishing states

### Fixed
- WeChat editor line break filtering issues that caused code to display incorrectly
- Mobile WeChat code wrapping problems on iOS devices
- TypeScript compilation errors with missing method definitions
- Code block display inconsistencies across different WeChat clients

### Technical
- Added `ensureValidToken` method for robust API authentication
- Enhanced markdown parser with dual code processing pipeline (highlighting + rendering)
- Improved CSS architecture with mobile-first responsive design
- Better separation of concerns between code highlighting and code rendering

## [1.1.0] - 2025-01-10

### Added
- WeChat Official Account API integration with full draft creation support
- Content converter for Markdown to WeChat-compatible HTML format  
- Comprehensive settings management with AppID/Secret configuration
- Preview modal with real-time content preview and publishing capabilities
- Multiple publishing modes (draft only vs direct publish to platform)
- Enhanced debugging and logging for API operations
- Ribbon icon, commands, and context menu for easy access
- Connection testing functionality
- Image upload and processing capabilities
- Front matter support for article metadata (title, author, digest, etc.)
- Automatic image URL replacement and media upload to WeChat servers
- Code syntax highlighting and mathematical formula support
- Customizable default author and publishing settings

### Fixed
- HTTP 501 error in WeChat draft creation API (removed problematic Content-Type header)
- Access token refresh mechanism with proper error handling and retry logic
- TypeScript type definitions and optional chaining issues
- Token expiration validation and automatic refresh workflow

### Changed
- Complete rewrite of plugin architecture from sample plugin template
- Project renamed from `obsidian-sample-plugin` to `obsidian-wechat-publisher`
- Updated project dependencies (added marked ^9.1.6 for enhanced markdown processing)
- Enhanced user interface with custom styling and better user feedback
- Improved error handling and user notifications throughout the application
- Manifest description updated to reflect WeChat publishing functionality

### Technical
- Added comprehensive debug logging for API operations and token management
- Enhanced TypeScript support with DOM libraries for browser APIs
- Implemented modular architecture with separate API, converter, and settings modules
- Added proper type definitions for all data structures and API responses
- Integrated marked library for robust markdown to HTML conversion
- Added error boundaries and graceful failure handling
- Implemented secure credential management for WeChat API keys

## [1.0.0] - 2025-01-09

### Added
- Initial plugin structure and basic functionality
- Basic UI components and modal system
- Development environment configuration
- Project scaffolding with TypeScript and build system
- Essential plugin lifecycle management
- Basic settings framework
- Initial WeChat Publisher component architecture