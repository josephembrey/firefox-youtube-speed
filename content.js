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
    persistSpeed: true
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
            changeSpeed(video, increment, true);
            return false; // Prevent default and stop propagation
        });
        
        keyHandler.bind(settings.decreaseSpeedKey, function(e) {
            changeSpeed(video, increment, false);
            return false; // Prevent default and stop propagation
        });
        
        keyHandler.bind(settings.resetSpeedKey, function(e) {
            changeSpeed(video, increment, false, true);
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
 */
function updateSpeedMenuDisplay(speed) {
    // Round to 2 decimal places for display
    speed = Math.round(speed * 100) / 100;

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
 * @returns {number} The new playback speed value after the change
 */
function changeSpeed(video, increment, increase, reset = false) {
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
    updateSpeedMenuDisplay(newSpeed);
    
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
            
            // Apply last speed if available and if persistSpeed is enabled
            if (result.lastSpeed && result.persistSpeed) {
                const video = document.querySelector('video');
                if (video) {
                    // Add a small delay to ensure YouTube's player is fully initialized
                    setTimeout(() => {
                        video.playbackRate = result.lastSpeed;
                    }, 500);
                }
            } else if (!result.persistSpeed) {
                // If persistSpeed is disabled, ensure we're at 1.0x speed
                const video = document.querySelector('video');
                if (video) {
                    setTimeout(() => {
                        video.playbackRate = 1.0;
                    }, 500);
                }
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
    
    // Re-initialize speed limits in case increment changed
    const video = document.querySelector('video');
    if (video && message.settings && message.settings.speedIncrement) {
        // Update current speed if it's below the new minimum
        const currentSpeed = parseFloat(video.playbackRate.toFixed(2));
        if (currentSpeed < message.settings.speedIncrement) {
            console.log(`Updating speed from ${currentSpeed}x to minimum ${message.settings.speedIncrement}x`);
            video.playbackRate = message.settings.speedIncrement;
            
            // Also update the stored last speed
            browser.storage.local.set({ lastSpeed: message.settings.speedIncrement })
                .catch(err => console.error('Failed to update minimum speed:', err));
                
            // Show the speed indicator with the new minimum
            updateSpeedMenuDisplay(message.settings.speedIncrement);
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