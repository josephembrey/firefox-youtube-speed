/**
 * YouTube Speed Control - Firefox Extension
 * 
 * This extension allows precise control of YouTube's playback speed 
 * from 0.1x to 16x with customizable keyboard shortcuts.
 * 
 * @license MIT
 * @version 1.0
 */

// -----------------------------------------------------------------------------
// CONSTANTS & CONFIGURATION
// -----------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
    speedIncrement: 0.25,
    increaseSpeedKey: 'shift+.',
    decreaseSpeedKey: 'shift+,',
    resetSpeedKey: 'shift+?',
    lastSpeed: 1.0,
    persistSpeed: true,
    showResetButton: true,
    showInitialSpeedPopup: false
};

const SPEED_INDICATOR_DISPLAY_TIME = 800; // ms
const TRANSITION_DURATION = 150; // ms for speed transition effects
const MAX_SPEED = 16;

// -----------------------------------------------------------------------------
// INPUT & KEYBOARD HANDLING
// -----------------------------------------------------------------------------

/**
 * Initializes keyboard shortcuts using Hotkeys.js
 * 
 * Sets up key bindings for speed control based on user settings
 * or falls back to default values if settings aren't available.
 */
function initializeShortcuts() {
    // Get settings, or use defaults if not available
    browser.storage.local.get(DEFAULT_SETTINGS).then(settings => {
        const video = document.querySelector('video');
        if (!video) return;
        
        const increment = settings.speedIncrement || DEFAULT_SETTINGS.speedIncrement;
        
        // Clear any existing bindings
        keyHandler.unbindAll();
        
        // Set up the shortcuts with our custom keyHandler
        keyHandler.bind(settings.increaseSpeedKey, function(e) {
            changeSpeed(video, increment, true, false, true); // Force display indicator
            return false; // Prevent default and stop propagation
        });
        
        keyHandler.bind(settings.decreaseSpeedKey, function(e) {
            changeSpeed(video, increment, false, false, true); // Force display indicator
            return false; // Prevent default and stop propagation
        });
        
        keyHandler.bind(settings.resetSpeedKey, function(e) {
            changeSpeed(video, increment, false, true, true); // Force display indicator
            return false; // Prevent default and stop propagation
        });
        
        console.log('YouTube Speed Control: Shortcuts initialized', settings);
    }).catch(error => {
        console.error('Error initializing shortcuts:', error);
    });
}

// -----------------------------------------------------------------------------
// UI & INDICATOR ELEMENTS
// -----------------------------------------------------------------------------

/**
 * Creates or updates the on-screen speed indicator
 * @param {number} speed - The current playback speed
 * @param {boolean} [force=false] - Force display even if showInitialSpeedPopup is disabled
 */
function updateSpeedMenuDisplay(speed, force = false) {
    // Round to 2 decimal places for display
    speed = Math.round(speed * 100) / 100;

    // Always update the button regardless of popup setting
    // Update the reset button tooltip and speed display if they exist
    const resetButton = document.querySelector('.ytp-speed-reset-button');
    if (resetButton) {
        // Update YouTube-style tooltip attributes
        resetButton.setAttribute('aria-label', `Playback speed: ${speed}×`);
        resetButton.setAttribute('data-tooltip-text', `Playback speed: ${speed}×`);
        
        // Update the speed value display (SVG text element)
        const speedValueDisplay = resetButton.querySelector('.speed-value-display');
        if (speedValueDisplay) {
            // Create the speed text, removing trailing zeros for cleaner display
            const speedString = speed.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d+?)0+$/, '$1');
            // Don't add the "×" symbol to save space
            const speedText = speedString;
            
            // Update text content
            speedValueDisplay.textContent = speedText;
            
            // Dynamically adjust font size based on text length
            if (speedText.length > 3) {
                // For longer text like "0.25" or "16.0"
                speedValueDisplay.setAttribute('font-size', '7');
            } else if (speedText.length > 2) {
                // For medium text like "1.5"
                speedValueDisplay.setAttribute('font-size', '9');
            } else {
                // For short text (1-2 chars) like "1" or "2"
                speedValueDisplay.setAttribute('font-size', '10.5');
            }
            
            // No need to set y-position as we're using SVG alignment attributes
            
            // Always use white text to match the circle
            speedValueDisplay.setAttribute('fill', 'white');
        }
    }
    
    // Check if we should show the popup indicator
    // Skip if showInitialSpeedPopup setting is disabled (unless forced)
    if (!force) {
        // Get cached settings if available
        const settings = window._speedControlSettings;
        if (settings && settings.showInitialSpeedPopup === false) {
            return; // Don't show the popup
        }
    }
    
    // Create or update a simple text notification
    const videoPlayer = document.querySelector('.html5-video-player');
    if (!videoPlayer) return;
    
    // Find or create our custom speed indicator
    let indicator = document.querySelector('.custom-speed-indicator');
    if (!indicator) {
        indicator = createSpeedIndicator();
        videoPlayer.appendChild(indicator);
    }
    
    // Update the text and show the indicator
    indicator.textContent = `${speed}×`;
    indicator.style.opacity = '1';
    
    // Hide after a short delay
    clearTimeout(indicator._hideTimeout);
    indicator._hideTimeout = setTimeout(() => {
        indicator.style.opacity = '0';
    }, SPEED_INDICATOR_DISPLAY_TIME);
}

/**
 * Creates a new speed indicator element on the video
 * 
 * Builds and styles a div element that displays the current playback speed
 * in the center of the video player.
 * 
 * @returns {HTMLElement} The created speed indicator element
 */
function createSpeedIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'custom-speed-indicator';
    
    // Position in center of video
    indicator.style.position = 'absolute';
    indicator.style.top = '50%';
    indicator.style.left = '50%';
    indicator.style.transform = 'translate(-50%, -50%)';
    
    // Styling for the indicator
    indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    indicator.style.color = 'white';
    indicator.style.padding = '10px 16px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontSize = '20px';
    indicator.style.fontWeight = 'bold';
    indicator.style.zIndex = '2000';
    indicator.style.opacity = '0';
    indicator.style.transition = 'opacity 0.3s ease-in-out';
    indicator.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    
    // Make it non-interactive so it doesn't interfere with clicks
    indicator.style.pointerEvents = 'none';
    
    return indicator;
}

/**
 * Updates YouTube's native speed menu to reflect the current speed
 * @param {number} speed - The current playback speed
 */
function updateYouTubeSpeedMenu(speed) {
    try {
        // Find the speed button in YouTube's menu
        const speedButton = document.querySelector('.ytp-settings-button');
        if (!speedButton) return;

        // Check if menu is open
        const menuPanel = document.querySelector('.ytp-panel-menu');
        if (!menuPanel) return;

        // Look for the speed menu item
        const speedMenuItem = Array.from(menuPanel.children).find(item => 
            item.textContent.includes('Playback speed'));
            
        if (speedMenuItem) {
            // Update the displayed speed value
            const speedValue = speedMenuItem.querySelector('.ytp-menuitem-label');
            if (speedValue && speedValue.textContent.includes('×')) {
                speedValue.textContent = `Playback speed (${speed}×)`;
            }
        }
    } catch (error) {
        console.log('Error updating YouTube speed menu:', error);
    }
}

/**
 * Creates and adds a reset speed button to YouTube player controls
 * 
 * Adds a button to the right control bar that resets playback speed to 1x
 * and allows scrolling to adjust speed
 * 
 * @param {HTMLVideoElement} video - The video element
 * @param {number} increment - The speed increment value (for reset function)
 */
function createResetSpeedButton(video, increment) {
    if (!video) return;
    
    // Check if button already exists
    if (document.querySelector('.ytp-speed-reset-button')) return;
    
    // Get the YouTube player right controls
    const rightControls = document.querySelector('.ytp-right-controls');
    if (!rightControls) return;
    
    // Get current speed for tooltip
    const currentSpeed = parseFloat(video.playbackRate.toFixed(2));
    
    // Create reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'ytp-button ytp-speed-reset-button';
    
    // Set up proper YouTube-style tooltip attributes
    resetButton.setAttribute('aria-label', `Playback speed: ${currentSpeed}×`);
    resetButton.setAttribute('data-tooltip-text', 'Playback speed');
    resetButton.setAttribute('data-tooltip-shortcut', 'Click to reset to 1× • Scroll to adjust');
    resetButton.setAttribute('aria-haspopup', 'true');
    
    // Set title for non-YouTube tooltip fallback
    resetButton.setAttribute('title', 'Playback speed (Click to reset, Scroll to adjust)');
    
    resetButton.innerHTML = `
        <svg height="100%" viewBox="0 0 36 36" width="100%">
            <circle cx="18" cy="18" r="10" stroke="white" stroke-width="2" fill="none"/>
            <text x="18" y="19" text-anchor="middle" alignment-baseline="central" dominant-baseline="middle" fill="white" font-size="10" font-weight="bold" class="speed-value-display">1</text>
        </svg>
    `;
    
    // Get the speed value display element 
    const speedValueDisplay = resetButton.querySelector('.speed-value-display');
    
    // Update the speed display to show current speed
    function updateSpeedDisplay() {
        const speed = parseFloat(video.playbackRate.toFixed(2));
        
        // Create the speed text, removing trailing zeros for cleaner display
        // e.g., "1.00" becomes "1", "1.50" becomes "1.5"
        const speedString = speed.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d+?)0+$/, '$1');
        // Don't add the "×" symbol to save space
        const speedText = speedString;
        
        // SVG text doesn't use innerHTML, just textContent
        speedValueDisplay.textContent = speedText;
        
        // Update the tooltip and aria-label
        resetButton.setAttribute('aria-label', `Playback speed: ${speed}×`);
        
        // Update the data attributes for YouTube's native tooltip system
        resetButton.setAttribute('data-tooltip-text', `Playback speed: ${speed}×`);
        
        // Dynamically adjust font size based on text length
        if (speedText.length > 3) {
            // For longer text like "0.25" or "16.0"
            speedValueDisplay.setAttribute('font-size', '7');
        } else if (speedText.length > 2) {
            // For medium text like "1.5"
            speedValueDisplay.setAttribute('font-size', '9');
        } else {
            // For short text (1-2 chars) like "1" or "2"
            speedValueDisplay.setAttribute('font-size', '10.5');
        }
        
        // No need to set y-position as we're using SVG alignment attributes
        
        // Always use white text to match the circle
        speedValueDisplay.setAttribute('fill', 'white');
    }
    
    // Initial update
    updateSpeedDisplay();
    
    // Add click event to reset speed
    resetButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        changeSpeed(video, increment, false, true, true); // Reset to 1x and force display indicator
        updateSpeedDisplay();
    });
    
    // Add wheel event for adjusting speed
    resetButton.addEventListener('wheel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Determine scroll direction (up = increase, down = decrease)
        const isIncrease = e.deltaY < 0;
        
        // Change speed
        changeSpeed(video, increment, isIncrease, false, true); // Force display indicator
        updateSpeedDisplay();
    }, { passive: false });
    
    // Add mutation observer to keep the speed display updated
    const observer = new MutationObserver(() => {
        if (video && video.playbackRate) {
            updateSpeedDisplay();
        }
    });
    
    // Observe video playbackRate changes via the data-custom-speed attribute
    if (video.hasAttribute('data-custom-speed-enabled')) {
        observer.observe(video, { 
            attributes: true, 
            attributeFilter: ['data-custom-speed'] 
        });
    }
    
    // Insert before the settings button (or at the start if not found)
    const settingsButton = rightControls.querySelector('.ytp-settings-button');
    if (settingsButton) {
        rightControls.insertBefore(resetButton, settingsButton);
    } else {
        rightControls.insertBefore(resetButton, rightControls.firstChild);
    }
}

// -----------------------------------------------------------------------------
// SPEED CONTROL FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Changes the video playback speed
 * 
 * Modifies the video's playback rate based on the specified parameters.
 * Handles speed increase, decrease, and reset operations with proper
 * bounds checking and UI updates.
 * 
 * @param {HTMLVideoElement} video - The video element to modify
 * @param {number} increment - The speed increment value for adjustments
 * @param {boolean} increase - Whether to increase (true) or decrease (false) speed
 * @param {boolean} [reset=false] - Whether to reset to default speed (1.0)
 * @param {boolean} [forceDisplay=false] - Whether to force display of the speed indicator
 * @returns {number} The new playback speed value after the change
 */
function changeSpeed(video, increment, increase, reset = false, forceDisplay = false) {
    if (!video) return;
    
    let newSpeed;
    
    if (reset) {
        newSpeed = 1.0;
    } else {
        const currentSpeed = parseFloat(video.playbackRate.toFixed(2));
        newSpeed = increase ? currentSpeed + increment : currentSpeed - increment;
    }
    
    // Ensure speed is within valid range (using increment as minimum) and rounded to 2 decimal places
    newSpeed = Math.max(increment, Math.min(MAX_SPEED, newSpeed));
    newSpeed = Math.round(newSpeed * 100) / 100;
    
    // Apply smooth transition effect
    applySpeedWithTransition(video, newSpeed);
    
    // Display on-screen notification
    updateSpeedMenuDisplay(newSpeed, forceDisplay);
    
    // Try to update YouTube's native speed menu if it's open
    try {
        const menuPanel = document.querySelector('.ytp-panel-menu');
        if (menuPanel) {
            const speedMenuItem = Array.from(menuPanel.children).find(item => 
                item.textContent.includes('Playback speed'));
                
            if (speedMenuItem) {
                const speedValue = speedMenuItem.querySelector('.ytp-menuitem-label');
                if (speedValue && speedValue.textContent.includes('×')) {
                    speedValue.textContent = `Playback speed (${newSpeed}×)`;
                }
            }
        }
    } catch (error) {
        // Not critical if this fails, so just log it
        console.log('Error updating YouTube speed menu:', error);
    }
    
    // Save the current speed to storage
    browser.storage.local.set({ lastSpeed: newSpeed })
        .catch(err => console.error('Failed to save speed:', err));
    
    return newSpeed;
}

/**
 * Applies speed change with a smooth transition effect
 * @param {HTMLVideoElement} video - The video element
 * @param {number} targetSpeed - The target speed to transition to
 */
function applySpeedWithTransition(video, targetSpeed) {
    const currentSpeed = video.playbackRate;
    const startTime = performance.now();
    
    // Only apply transition if the change is significant
    if (Math.abs(targetSpeed - currentSpeed) > 0.3) {
        function animateSpeed(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
            
            // Easing function for smooth transition
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            const currentValue = currentSpeed + (targetSpeed - currentSpeed) * easeProgress;
            video.playbackRate = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animateSpeed);
            } else {
                video.playbackRate = targetSpeed;
            }
        }
        
        requestAnimationFrame(animateSpeed);
    } else {
        // For small changes, just set directly
        video.playbackRate = targetSpeed;
    }
}

/**
 * Removes YouTube's default speed limitations
 * 
 * Overrides YouTube's native playbackRate property to allow for
 * speeds beyond the normal limits (0.1x to 16x instead of 0.25x to 2x).
 * Uses JavaScript property descriptors to hook into the native API.
 * 
 * @returns {Promise<boolean>} Promise that resolves to true if successful, false otherwise
 */
function removeSpeedLimit() {
    const video = document.querySelector('video');
    if (!video) return Promise.resolve(false);

    // Check if we've already applied our speed limiter
    if (video.hasAttribute('data-custom-speed-enabled')) {
        return Promise.resolve(true); // Already enabled
    }

    return browser.storage.local.get({ speedIncrement: 0.05 })
        .then(result => {
            const minSpeed = result.speedIncrement || 0.05;
            
            console.log('YouTube Speed Control: Setting minimum speed to', minSpeed);
            
            try {
                // Disable YouTube's native speed indicator
                disableYouTubeNativeSpeedIndicator();
                
                // Store the original descriptor to restore if needed
                const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
                
                // Mark video as enhanced
                video.setAttribute('data-custom-speed-enabled', 'true');
                
                // Set initial speed value if needed
                if (!video.hasAttribute('data-custom-speed')) {
                    video.setAttribute('data-custom-speed', video.playbackRate || 1);
                }
    
                // Override the playbackRate property
                Object.defineProperty(video, 'playbackRate', {
                    configurable: true, // Allow future redefinitions
                    get: function() {
                        return parseFloat(this.getAttribute('data-custom-speed')) || 1;
                    },
                    set: function(speed) {
                        // Always use the latest increment value for minimum speed
                        let currentMinSpeed = minSpeed;
                        if (window._speedControlSettings && window._speedControlSettings.speedIncrement) {
                            currentMinSpeed = window._speedControlSettings.speedIncrement;
                        }
                        
                        // Enforce sensible limits (use increment value as minimum speed, up to MAX_SPEED)
                        speed = Math.max(currentMinSpeed, Math.min(MAX_SPEED, speed));
                        speed = Math.round(speed * 100) / 100; // Round to 2 decimal places
                        
                        this.setAttribute('data-custom-speed', speed);
                        
                        try {
                            // Call the original setter with our speed
                            originalDescriptor.set.call(this, speed);
                            
                            // Update the UI popup to reflect the new speed
                            updateSpeedMenuDisplay(speed);
                        } catch (e) {
                            console.warn('Failed to set playback rate:', e);
                        }
                    }
                });
    
                // Hook into YouTube's player object for better integration
                hookYouTubePlayerAPI(video, originalDescriptor);
                
                return true;
            } catch (e) {
                console.error('Failed to remove speed limit:', e);
                return false;
            }
        }).catch(e => {
            console.error('Failed to get speedIncrement from storage:', e);
            return false;
        });
}

/**
 * Modifies YouTube's native speed indicator popup
 * 
 * Instead of completely disabling it, we ensure our custom controls
 * don't interfere with the native YouTube player behavior.
 */
function disableYouTubeNativeSpeedIndicator() {
    // We no longer need to disable YouTube's native speed indicator
    // This is intentionally left empty to preserve compatibility with
    // the rest of the codebase that calls this function
    
    // The play/pause functionality is now preserved by making our
    // speed indicator non-interactive (pointer-events: none)
}

/**
 * Hooks into YouTube's player API for better integration
 * @param {HTMLVideoElement} video - The video element
 * @param {PropertyDescriptor} originalDescriptor - Original playbackRate property descriptor
 */
function hookYouTubePlayerAPI(video, originalDescriptor) {
    try {
        const player = findYouTubePlayer();
        
        if (player) {
            // Store original methods if we haven't already
            if (!player._originalGetPlaybackRate) {
                player._originalGetPlaybackRate = player.getPlaybackRate;
            }
            if (!player._originalSetPlaybackRate) {
                player._originalSetPlaybackRate = player.setPlaybackRate;
            }
            
            // Override getPlaybackRate
            player.getPlaybackRate = function() {
                return parseFloat(video.getAttribute('data-custom-speed')) || 
                       player._originalGetPlaybackRate.call(player);
            };

            // Override setPlaybackRate
            player.setPlaybackRate = function(speed) {
                video.playbackRate = speed; 
                return player._originalSetPlaybackRate.call(player, speed);
            };
        }
    } catch (e) {
        console.warn('Failed to hook into YouTube player API:', e);
    }
}

/**
 * Helper function to find YouTube player object
 * @returns {Object|null} YouTube player object or null if not found
 */
function findYouTubePlayer() {
    // Look for player by class - most reliable method
    const playerElement = document.querySelector('.html5-video-player');
    if (playerElement && typeof playerElement.getPlaybackRate === 'function') {
        return playerElement;
    }
    
    return null;
}

// -----------------------------------------------------------------------------
// INITIALIZATION & MAIN LOGIC
// -----------------------------------------------------------------------------

/**
 * Main initialization function
 */
function init() {
    // Check if we're on a YouTube video page
    if (!window.location.href.includes('youtube.com/watch')) {
        return;
    }
    
    console.log('YouTube Speed Control: Initializing...');
    
    // Set up the keyboard shortcuts
    initializeShortcuts();
    
    // Pre-load and cache settings
    loadAndApplySettings();
    
    // Try to override speed limit with simple retry
    initWithRetry();
}

/**
 * Loads settings from storage and applies them
 */
function loadAndApplySettings() {
    browser.storage.local.get(DEFAULT_SETTINGS)
        .then(result => {
            // Cache settings globally for quick access
            window._speedControlSettings = result;
            
            const video = document.querySelector('video');
            if (video) {
                // Add a small delay to ensure YouTube's player is fully initialized
                setTimeout(() => {
                    // Track if we actually change the speed (to determine if we show popup)
                    let speedChanged = false;
                    let initialSpeed = video.playbackRate;
                    
                    // Apply last speed if available and if persistSpeed is enabled
                    if (result.lastSpeed && result.persistSpeed) {
                        // Only update if different from current speed
                        if (Math.abs(video.playbackRate - result.lastSpeed) > 0.01) {
                            video.playbackRate = result.lastSpeed;
                            speedChanged = true;
                        }
                    } else if (!result.persistSpeed) {
                        // If persistSpeed is disabled, ensure we're at 1.0x speed
                        if (Math.abs(video.playbackRate - 1.0) > 0.01) {
                            video.playbackRate = 1.0;
                            speedChanged = true;
                        }
                    }
                    
                    // Show popup if speed changed and showInitialSpeedPopup is enabled
                    if (speedChanged && result.showInitialSpeedPopup) {
                        updateSpeedMenuDisplay(video.playbackRate);
                    }
                    
                    // Create reset speed button if enabled in settings
                    if (result.showResetButton) {
                        createResetSpeedButton(video, result.speedIncrement);
                    } else {
                        // Remove button if it exists but setting is disabled
                        const resetButton = document.querySelector('.ytp-speed-reset-button');
                        if (resetButton) {
                            resetButton.remove();
                        }
                    }
                }, 500);
            }
        })
        .catch(error => {
            console.error('Error caching settings:', error);
        });
}

/**
 * Initializes with simple retry
 */
function initWithRetry() {
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 500; // ms
    
    function attemptInit() {
        attempts++;
        
        removeSpeedLimit().then(success => {
            if (!success && attempts < maxAttempts) {
                console.log(`YouTube Speed Control: Retrying in ${retryDelay}ms (attempt ${attempts}/${maxAttempts})`);
                setTimeout(attemptInit, retryDelay);
            } else if (success) {
                console.log('YouTube Speed Control: Successfully initialized');
            } else {
                console.warn('YouTube Speed Control: Failed to initialize after multiple attempts');
            }
        }).catch(error => {
            console.error('Error in removeSpeedLimit:', error);
            if (attempts < maxAttempts) {
                setTimeout(attemptInit, retryDelay);
            }
        });
    }
    
    // Start initialization process
    attemptInit();
}

/**
 * Handles messages from the popup or background script
 * @param {Object} message - The message object
 */
function handleMessage(message) {
    console.log('YouTube Speed Control: Received message', message.action);
    
    if (message.action === 'settingsUpdated' || message.action === 'applySettings') {
        handleSettingsUpdate(message);
    } else if (message.action === 'settingsOpened') {
        setSettingsOpenState(true);
    } else if (message.action === 'settingsClosed') {
        setSettingsOpenState(false);
        
        // Re-initialize shortcuts when settings are closed
        initializeShortcuts();
    }
    
    return false; // Don't keep the channel open
}

/**
 * Handles settings update messages
 * @param {Object} message - The message with settings data
 */
function handleSettingsUpdate(message) {
    // Update cached settings
    if (message.settings) {
        console.log('YouTube Speed Control: Updating settings to', message.settings);
        window._speedControlSettings = message.settings;
    } else {
        // If no settings provided, get updated ones from storage
        browser.storage.local.get(DEFAULT_SETTINGS).then(result => {
            console.log('YouTube Speed Control: Loaded settings from storage', result);
            window._speedControlSettings = result;
        });
    }
    
    // Reinitialize shortcuts with new settings
    initializeShortcuts();
    
    // Get the settings from message or cached settings
    const settings = message.settings || window._speedControlSettings;
    const video = document.querySelector('video');
    
    if (video) {
        // Re-initialize speed limits in case increment changed
        if (settings && settings.speedIncrement) {
            // Update current speed if it's below the new minimum
            const currentSpeed = parseFloat(video.playbackRate.toFixed(2));
            if (currentSpeed < settings.speedIncrement) {
                console.log(`Updating speed from ${currentSpeed}x to minimum ${settings.speedIncrement}x`);
                video.playbackRate = settings.speedIncrement;
                
                // Also update the stored last speed
                browser.storage.local.set({ lastSpeed: settings.speedIncrement })
                    .catch(err => console.error('Failed to update minimum speed:', err));
                    
                // Show the speed indicator with the new minimum
                updateSpeedMenuDisplay(settings.speedIncrement);
            }
        }
        
        // Handle reset button toggle
        if (settings && typeof settings.showResetButton !== 'undefined') {
            if (settings.showResetButton) {
                // Create button if it doesn't exist
                createResetSpeedButton(video, settings.speedIncrement || DEFAULT_SETTINGS.speedIncrement);
            } else {
                // Remove button if setting is disabled
                const resetButton = document.querySelector('.ytp-speed-reset-button');
                if (resetButton) {
                    resetButton.remove();
                }
            }
        }
    }
}

/**
 * Sets the settings open state to enable/disable keyboard shortcuts
 * @param {boolean} isOpen - Whether settings is open
 */
function setSettingsOpenState(isOpen) {
    const indicator = document.querySelector('.custom-speed-indicator');
    if (indicator) {
        indicator.setAttribute('data-settings-open', isOpen ? 'true' : 'false');
    }
}

// Watch for navigation changes (for single-page-application support)
function setupUrlObserver() {
    let lastUrl = location.href;
    
    // Create a simplified observer that only watches for URL changes
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            
            // If we're on a YouTube video page, reinitialize
            if (location.href.includes('youtube.com/watch')) {
                setTimeout(init, 1000); // Wait for video player to load
            }
        }
    }, 1000); // Check every second
}

// -----------------------------------------------------------------------------
// STARTUP SEQUENCE
// -----------------------------------------------------------------------------

// Run main initialization on page load
init();

// Setup URL observer for navigation changes
setupUrlObserver();

// Add message listener for settings updates
browser.runtime.onMessage.addListener(handleMessage); 