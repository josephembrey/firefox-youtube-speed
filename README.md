# YouTube Speed Control

A browser extension for Firefox and Chrome that lets you precisely control YouTube's playback speed from 0.1x to 10x with customizable shortcuts.

## Features

- Control YouTube playback speed from 0.1x to 10x
- Integrates seamlessly with YouTube's native playback controls
- Fully customizable keyboard shortcuts
- Support for mouse wheel and button controls
- Displays on-screen speed indicator
- Remembers your last playback speed
- Persists across video changes
- Works reliably with YouTube's single-page application
- Modern, dark-themed user interface

## Keyboard Shortcuts

By default, the extension uses these shortcuts:
- **Shift + >** to increase speed beyond 2x (in customizable increments)
- **Shift + <** to decrease speed (in customizable increments)
- **Shift + ?** to reset to normal speed (1x)

All shortcuts can be fully customized in the extension popup menu.

## Installation

### Temporary Installation (Development)

#### Firefox

1. Download this repository or clone it with Git:
   ```
   git clone https://github.com/josephembrey/firefox-youtube-speed.git
   ```

2. Open Firefox and go to `about:debugging`

3. Click "This Firefox" in the left sidebar

4. Click "Load Temporary Add-on"

5. Navigate to the downloaded folder and select the `manifest.json` file

Note: Temporary installations are removed when Firefox restarts.

#### Chrome

1. Download this repository or clone it with Git:
   ```
   git clone https://github.com/josephembrey/firefox-youtube-speed.git
   ```

2. Run the build script to generate Chrome-specific files:
   ```
   ./build.sh
   ```

3. Open Chrome and go to `chrome://extensions/`

4. Enable "Developer mode" (toggle in the top-right corner)

5. Click "Load unpacked"

6. Navigate to the `build/chrome` folder and select it

Note: The extension will remain until you remove it manually.

### Permanent Installation

#### Firefox
1. Download the extension from the [Firefox Add-ons Store](https://addons.mozilla.org/firefox/)
2. Click "Add to Firefox"

#### Chrome
1. Download the extension from the [Chrome Web Store](https://chrome.google.com/webstore/)
2. Click "Add to Chrome"

## Usage

1. Go to any YouTube video
2. Use the keyboard shortcuts (default: Shift+> and Shift+<) to change the playback speed
3. Customize your settings by clicking the extension icon in the toolbar

### Customization Options

- **Speed Increment**: Change the amount that each key press changes the speed (0.05x to 1.0x)
- **Keyboard Shortcuts**: Set custom key combinations for increasing, decreasing and resetting speed
- **Mouse Controls**: Optionally set mouse wheel or mouse button controls

## Technical Details

The extension works by:
1. Overriding YouTube's playbackRate property using JavaScript property descriptors
2. Integrating with YouTube's native speed control system
3. Adding event listeners to detect keyboard shortcuts and mouse interactions
4. Maintaining speed settings across video changes with the browser's storage API
5. Using a browser compatibility layer to work in both Firefox and Chrome

### Building for Different Browsers

The repository includes a build script that creates both Firefox and Chrome versions:

```bash
./build.sh
```

This will create two ZIP files in the `build` directory:
- `youtube-speed-control-firefox.zip` - For Firefox
- `youtube-speed-control-chrome.zip` - For Chrome

## Troubleshooting

If you encounter any issues:

1. Make sure you're on a YouTube video page (youtube.com/watch)
2. Try refreshing the page
3. Check that no other extensions are conflicting by temporarily disabling them
4. If the problem persists, please [submit an issue](https://github.com/josephembrey/firefox-youtube-speed/issues)

## Privacy

This extension:
- Does not collect any user data
- Does not track your browsing history
- Does not communicate with any external servers
- Only requires permissions for YouTube.com and for storing your settings

## License

MIT License 