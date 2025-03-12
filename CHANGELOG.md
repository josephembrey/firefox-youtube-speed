# Changelog

All notable changes to the YouTube Speed Control extension will be documented in this file.

## [1.3.0] - 2025-03-12

### Added
- Cross-browser compatibility for both Firefox and Chrome
- Browser API compatibility layer (browser-polyfill.js)
- Build script to generate browser-specific packages
- Chrome-specific manifest file

### Changed
- Updated icons to use PNG format for better Chrome compatibility
- Updated extension description to reflect dual-browser support
- Improved extension packaging and distribution

## [1.0.0] - 2025-03-12

### Added
- Initial release of YouTube Speed Control extension
- Speed control from 0.1x to 10x
- Keyboard shortcuts for increasing, decreasing, and resetting speed
- On-screen speed indicator with positioning options
- Integrated speed control button in YouTube player UI
- Persistence setting to maintain speed across videos
- Settings UI for customizing all extension features
- Mouse wheel and button control options
- Toggle to enable/disable keyboard shortcuts

### Changed
- Maximum playback speed reduced from initial 16x to 10x for stability
- Default setting for "Persist Speed Across Videos" changed to off
- Improved UI for popup settings visibility with collapsible sections

### Fixed
- Fixed increment update issue for speed controls
- Ensured speed popup indicator correctly positions based on settings
- Resolved conflicts with YouTube's native speed controls
- Optimized event handling to prevent memory leaks