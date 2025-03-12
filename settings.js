/**
 * YouTube Speed Control - Settings Panel
 * 
 * This script manages the settings UI for the YouTube Speed Control extension.
 * Handles keyboard shortcut bindings, increment adjustments, and storing user preferences.
 * 
 * @license MIT
 * @version 1.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------------------
    // INITIALIZATION & SETUP
    // -----------------------------------------------------------------------------
    
    // Notify content script that settings is open
    notifyContentScriptSettingsState('settingsOpened');
    
    // Add listener for when settings is closed
    window.addEventListener('unload', () => {
        notifyContentScriptSettingsState('settingsClosed');
    });
    
    // Get DOM elements
    const elements = {
        slider: document.getElementById('incrementSlider'),
        valueDisplay: document.querySelector('.value-display'),
        increaseSpeedKey: document.getElementById('increaseSpeedKey'),
        decreaseSpeedKey: document.getElementById('decreaseSpeedKey'),
        resetSpeedKey: document.getElementById('resetSpeedKey'),
        enableShortcutsToggle: document.getElementById('enableShortcutsToggle'),
        persistSpeedToggle: document.getElementById('persistSpeedToggle'),
        showResetButtonToggle: document.getElementById('showResetButtonToggle'),
        enableSpeedPopupToggle: document.getElementById('enableSpeedPopupToggle'),
        showInitialSpeedPopupToggle: document.getElementById('showInitialSpeedPopupToggle'),
        popupPosition: document.getElementById('popupPosition'),
        popupSettings: document.getElementById('popupSettings'),
        resetAllSettings: document.getElementById('resetAllSettings')
    };
    
    // Create floating status indicator
    let statusIndicator = document.getElementById('statusIndicator');
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'statusIndicator';
        statusIndicator.className = 'status-indicator';
        statusIndicator.setAttribute('aria-live', 'polite');
        document.body.appendChild(statusIndicator);
        elements.statusIndicator = statusIndicator;
    } else {
        elements.statusIndicator = statusIndicator;
    }

    // Add CSS for animations
    addAnimationStyles();
    
    // Initialize the UI
    loadSettings();
    
    // Add animations for card hover effects
    initializeCardAnimations();
    
    // Add event listeners
    setupEventListeners();

    // -----------------------------------------------------------------------------
    // COMMUNICATION WITH CONTENT SCRIPT
    // -----------------------------------------------------------------------------
    
    /**
     * Notifies content script about settings panel state (open/closed)
     * 
     * Sends a message to all YouTube tabs to inform them about
     * the settings panel being opened or closed.
     * 
     * @param {string} action - The action to notify ('settingsOpened' or 'settingsClosed')
     */
    function notifyContentScriptSettingsState(action) {
        browser.tabs.query({ url: "*://*.youtube.com/*" })
            .then(tabs => {
                if (tabs.length > 0) {
                    tabs.forEach(tab => {
                        browser.tabs.sendMessage(tab.id, { action: action })
                            .catch(error => {
                                console.log(`Could not notify tab ${tab.id}: ${error.message}`);
                            });
                    });
                }
            })
            .catch(error => {
                console.error('Error querying tabs:', error);
            });
    }

    /**
     * Notifies all YouTube tabs about settings changes
     * 
     * Sends the updated settings to all active YouTube tabs
     * so they can apply the new configuration immediately.
     * 
     * @param {Object} settings - The settings object to send
     */
    function notifyTabsAboutSettingsChange(settings) {
        browser.tabs.query({ url: '*://*.youtube.com/*' })
            .then(tabs => {
                if (tabs.length > 0) {
                    tabs.forEach(tab => {
                        browser.tabs.sendMessage(tab.id, { 
                            action: 'settingsUpdated',
                            settings: settings
                        }).catch(error => {
                            console.log(`Could not notify tab ${tab.id}: ${error.message}`);
                        });
                    });
                }
            })
            .catch(error => {
                console.error('Error querying tabs:', error);
            });
    }

    // -----------------------------------------------------------------------------
    // SETTINGS MANAGEMENT
    // -----------------------------------------------------------------------------
    
    /**
     * Loads all settings from storage and updates the UI
     * 
     * Retrieves stored preferences from browser.storage.local and
     * updates the UI elements to reflect those settings.
     * Falls back to default values if settings aren't found.
     */
    function loadSettings() {
        browser.storage.local.get([
            'speedIncrement', 
            'persistSpeed', 
            'showResetButton', 
            'enableSpeedPopup',
            'showInitialSpeedPopup',
            'popupPosition',
            'enableShortcuts'
        ])
        .then(result => {
            // Load increment slider
            if (result.speedIncrement) {
                const sliderValue = incrementToSlider(result.speedIncrement);
                elements.slider.value = sliderValue;
                updateDisplay(result.speedIncrement);
            } else {
                // Default value
                elements.slider.value = 5; // 0.25x (5 * 0.05 = 0.25)
                updateDisplay(0.25);
            }
            
            // Load enable shortcuts toggle state
            if (result.enableShortcuts !== undefined) {
                elements.enableShortcutsToggle.checked = result.enableShortcuts;
            } else {
                // Default to true if not set
                elements.enableShortcutsToggle.checked = true;
            }
            
            // Load persist speed toggle state
            if (result.persistSpeed !== undefined) {
                elements.persistSpeedToggle.checked = result.persistSpeed;
            } else {
                // Default to false if not set (per DEFAULT_SETTINGS)
                elements.persistSpeedToggle.checked = false;
            }
            
            // Load reset button toggle state
            if (result.showResetButton !== undefined) {
                elements.showResetButtonToggle.checked = result.showResetButton;
            } else {
                // Default to true if not set
                elements.showResetButtonToggle.checked = true;
            }
            
            // Load enable speed popup toggle state
            if (result.enableSpeedPopup !== undefined) {
                elements.enableSpeedPopupToggle.checked = result.enableSpeedPopup;
            } else {
                // Default to true if not set
                elements.enableSpeedPopupToggle.checked = true;
            }
            
            // Update popup settings visibility based on enableSpeedPopup
            if (elements.enableSpeedPopupToggle.checked) {
                elements.popupSettings.style.display = 'block';
                elements.popupSettings.style.maxHeight = '500px';
                elements.popupSettings.style.opacity = '1';
            } else {
                elements.popupSettings.style.display = 'none';
                elements.popupSettings.style.maxHeight = '0';
                elements.popupSettings.style.opacity = '0';
            }
            
            // Load initial speed popup toggle state
            if (result.showInitialSpeedPopup !== undefined) {
                elements.showInitialSpeedPopupToggle.checked = result.showInitialSpeedPopup;
            } else {
                // Default to false if not set (per DEFAULT_SETTINGS)
                elements.showInitialSpeedPopupToggle.checked = false;
            }
            
            // Load popup position
            if (result.popupPosition) {
                elements.popupPosition.value = result.popupPosition;
            } else {
                // Default to center if not set
                elements.popupPosition.value = 'center';
            }
            
            // Load key bindings
            loadButtonText(elements.increaseSpeedKey);
            loadButtonText(elements.decreaseSpeedKey);
            loadButtonText(elements.resetSpeedKey);
        })
        .catch(error => {
            console.error('Error loading settings:', error);
            showStatus('Error loading settings: ' + error.message, true);
        });
    }
    
    /**
     * Saves settings to storage and notifies content scripts
     * 
     * Persists settings to browser.storage.local and sends notifications
     * to all active YouTube tabs about the changed settings.
     * 
     * @param {Object} settings - Settings object to save
     */
    function saveSettings(settings) {
        browser.storage.local.set(settings)
            .then(() => {
                showStatus('Settings saved');
                
                // Get all current settings to send a complete settings object
                browser.storage.local.get().then(allSettings => {
                    // Merge new settings with all existing settings
                    const mergedSettings = { ...allSettings, ...settings };
                    console.log('Sending updated settings to tabs:', mergedSettings);
                    
                    // Notify any active YouTube tabs about the change
                    notifyTabsAboutSettingsChange(mergedSettings);
                });
            })
            .catch(error => {
                showStatus('Error saving settings: ' + error.message, true);
                console.error('Error saving settings:', error);
            });
    }
    
    /**
     * Resets all settings to their default values
     * 
     * Restores all extension settings to the original defaults,
     * updates the UI accordingly, and notifies all active tabs.
     * Also ensures that lastSpeed is at least the minimum increment.
     */
    function resetAllToDefaults() {
        // Get the current last speed to see if we need to update it
        browser.storage.local.get('lastSpeed').then(result => {
            const defaultSettings = {
                speedIncrement: 0.25,
                increaseSpeedKey: 'shift+.',
                decreaseSpeedKey: 'shift+,',
                resetSpeedKey: 'shift+?',
                persistSpeed: false,
                showResetButton: true,
                enableSpeedPopup: true,
                showInitialSpeedPopup: false,
                popupPosition: 'center',
                enableShortcuts: true
            };
            
            // If lastSpeed exists and is less than the default minimum, update it
            if (result.lastSpeed && result.lastSpeed < defaultSettings.speedIncrement) {
                defaultSettings.lastSpeed = defaultSettings.speedIncrement;
            }
            
            // Continue with the reset using our updated defaultSettings
            completeReset(defaultSettings);
        }).catch(error => {
            // In case of error, just use the standard defaults
            const defaultSettings = {
                speedIncrement: 0.25,
                increaseSpeedKey: 'shift+.',
                decreaseSpeedKey: 'shift+,',
                resetSpeedKey: 'shift+?',
                persistSpeed: false,
                showResetButton: true,
                enableSpeedPopup: true,
                showInitialSpeedPopup: false,
                popupPosition: 'center',
                enableShortcuts: true
            };
            completeReset(defaultSettings);
            console.error('Error checking lastSpeed during reset:', error);
        });
    }
    
    /**
     * Completes the reset process with the provided settings
     * 
     * @param {Object} defaultSettings - The default settings to apply
     */
    function completeReset(defaultSettings) {
        
        browser.storage.local.set(defaultSettings)
            .then(() => {
                // Reload the UI
                loadSettings();
                
                // Show success message
                showStatus('All settings reset to defaults');
                
                // Notify content script with complete settings object
                console.log('Sending reset settings to tabs:', defaultSettings);
                notifyTabsAboutSettingsChange(defaultSettings);
            })
            .catch(error => {
                console.error('Error resetting settings:', error);
                showStatus('Error resetting settings: ' + error.message, true);
            });
    }
    
    // -----------------------------------------------------------------------------
    // UI HELPERS & DISPLAY FUNCTIONS
    // -----------------------------------------------------------------------------
    
    // Adds animation styles to the document
    function addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes update-animation {
                0% { transform: scale(1); filter: brightness(1); }
                50% { transform: scale(1.15); filter: brightness(1.3); }
                100% { transform: scale(1); filter: brightness(1); }
            }
            
            .update-animation {
                animation: update-animation 0.4s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Sets up tooltips with proper positioning
     * 
     * Adds mouseover event handlers to position tooltips accurately
     * relative to their triggering elements, ensuring they're never clipped.
     */
    function setupTooltips() {
        const tooltips = document.querySelectorAll('.tooltip');
        
        tooltips.forEach(tooltip => {
            const icon = tooltip.querySelector('.tooltip-icon');
            const tooltipText = tooltip.querySelector('.tooltip-text');
            
            if (!icon || !tooltipText) return;
            
            // Position tooltip when hovering over the icon
            icon.addEventListener('mouseenter', () => {
                // Get icon position
                const iconRect = icon.getBoundingClientRect();
                
                // Center tooltip above the icon
                const tooltipWidth = tooltipText.offsetWidth;
                const left = iconRect.left + (iconRect.width / 2) - (tooltipWidth / 2);
                
                // Make sure it stays within window bounds
                const adjustedLeft = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));
                
                // Position tooltip above icon with some spacing
                tooltipText.style.top = (iconRect.top - tooltipText.offsetHeight - 10) + 'px';
                tooltipText.style.left = adjustedLeft + 'px';
                
                // Calculate percentage for arrow position
                const arrowPercent = ((iconRect.left + iconRect.width/2) - adjustedLeft) / tooltipWidth * 100;
                
                // Add custom arrow position using a data attribute
                tooltipText.setAttribute('data-arrow-position', arrowPercent + '%');
                
                // Position the arrow (we'll use the data attribute in a custom style)
                const arrowStyle = document.getElementById('tooltip-arrow-style');
                if (!arrowStyle) {
                    const style = document.createElement('style');
                    style.id = 'tooltip-arrow-style';
                    style.textContent = `
                        .tooltip-text::after {
                            left: var(--arrow-pos, 50%);
                            margin-left: -5px;
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // Set the custom arrow position using CSS variable
                tooltipText.style.setProperty('--arrow-pos', arrowPercent + '%');
            });
        });
    }
    
    /**
     * Initializes card hover animations
     * 
     * Sets up mouse enter/leave event listeners for cards
     * to create a visual focus effect when hovering.
     */
    function initializeCardAnimations() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                const otherCards = Array.from(document.querySelectorAll('.card')).filter(c => c !== card);
                otherCards.forEach(c => c.style.opacity = '0.8');
            });
            
            card.addEventListener('mouseleave', () => {
                document.querySelectorAll('.card').forEach(c => c.style.opacity = '1');
            });
        });
    }
    
    /**
     * Shows a status message with animation
     * 
     * Displays a floating toast message to the user with animation
     * and automatically hides it after a delay.
     * 
     * @param {string} message - The message to display
     * @param {boolean} [isError=false] - Whether this is an error message
     */
    function showStatus(message, isError = false) {
        // Clear any existing timers
        if (elements.statusIndicator._hideTimeout) {
            clearTimeout(elements.statusIndicator._hideTimeout);
        }
        
        // Set message and style
        elements.statusIndicator.textContent = message;
        elements.statusIndicator.className = 'status-indicator';
        
        if (isError) {
            elements.statusIndicator.classList.add('error');
        } else {
            elements.statusIndicator.classList.add('success');
        }
        
        // Show with animation
        setTimeout(() => {
            elements.statusIndicator.classList.add('show');
        }, 10);
        
        // Auto-hide after 2.5 seconds
        elements.statusIndicator._hideTimeout = setTimeout(() => {
            elements.statusIndicator.classList.remove('show');
        }, 2500);
    }
    
    /**
     * Updates the slider display with animation
     * 
     * Updates the increment value display with a subtle animation effect
     * and changes the color based on the increment value.
     * 
     * @param {number} value - The speed increment value to display
     */
    function updateDisplay(value) {
        // Update the text
        elements.valueDisplay.textContent = value.toFixed(2) + 'x';
        
        // Add a subtle animation effect
        elements.valueDisplay.classList.remove('update-animation');
        void elements.valueDisplay.offsetWidth; // Force reflow to restart animation
        elements.valueDisplay.classList.add('update-animation');
        
        // Calculate color based on increment value
        let backgroundColor;
        
        if (value < 0.25) {
            // Blue to green gradient for values below 0.25
            // Normalize the value between 0 and 1 (where 0 = 0.05 and 1 = 0.25)
            const normalized = (value - 0.05) / 0.2;
            // Interpolate from blue to green
            const red = Math.round(normalized * 0);  // 0 -> 0
            const green = Math.round(normalized * 200); // 0 -> 200
            const blue = Math.round(200 - normalized * 200); // 200 -> 0
            backgroundColor = `rgb(${red}, ${green}, ${blue})`;
        } else if (value === 0.25) {
            // Exact green for default value (0.25)
            backgroundColor = 'rgb(0, 180, 0)';
        } else {
            // Green to red gradient for values above 0.25
            // Normalize the value between 0 and 1 (where 0 = 0.25 and 1 = 1.0)
            const normalized = Math.min((value - 0.25) / 0.75, 1);
            // Interpolate from green to red
            const red = Math.round(normalized * 220); // 0 -> 220
            const green = Math.round(180 - normalized * 180); // 180 -> 0
            const blue = 0;
            backgroundColor = `rgb(${red}, ${green}, ${blue})`;
        }
        
        // Apply the color with a stronger contrast for better visibility
        elements.valueDisplay.style.background = backgroundColor;
        elements.valueDisplay.style.color = 'white';
        elements.valueDisplay.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.5)';
        elements.valueDisplay.style.fontWeight = 'bold';
    }
    
    /**
     * Sets up all event listeners for the UI
     * 
     * Initializes event listeners for slider, shortcut buttons,
     * and other interactive elements. Also sets up tooltip positioning.
     */
    function setupEventListeners() {
        // Set up tooltip positioning
        setupTooltips();
        
        // Slider input event (live update)
        elements.slider.addEventListener('input', () => {
            const increment = sliderToIncrement(elements.slider.value);
            updateDisplay(increment);
        });
        
        // Slider change event (final value)
        elements.slider.addEventListener('change', () => {
            const increment = sliderToIncrement(elements.slider.value);
            
            // Get current speed to check if it needs updating
            browser.storage.local.get('lastSpeed').then(result => {
                const lastSpeed = result.lastSpeed || 1.0;
                
                // If the current speed is below the new minimum (increment),
                // also update the lastSpeed to the new minimum
                if (lastSpeed < increment) {
                    saveSettings({ 
                        speedIncrement: increment,
                        lastSpeed: increment
                    });
                    showStatus(`Min speed updated to ${increment.toFixed(2)}x`);
                } else {
                    saveSettings({ speedIncrement: increment });
                }
            }).catch(error => {
                // In case of error, just save the increment
                saveSettings({ speedIncrement: increment });
                console.error('Error checking lastSpeed:', error);
            });
        });
        
        // Shortcut button click events
        elements.increaseSpeedKey.addEventListener('click', () => {
            handleKeyBinding(elements.increaseSpeedKey, 'increaseSpeedKey');
        });
        
        elements.decreaseSpeedKey.addEventListener('click', () => {
            handleKeyBinding(elements.decreaseSpeedKey, 'decreaseSpeedKey');
        });
        
        elements.resetSpeedKey.addEventListener('click', () => {
            handleKeyBinding(elements.resetSpeedKey, 'resetSpeedKey');
        });
        
        // Enable shortcuts toggle change
        elements.enableShortcutsToggle.addEventListener('change', () => {
            saveSettings({ enableShortcuts: elements.enableShortcutsToggle.checked });
        });
        
        // Persist speed toggle change
        elements.persistSpeedToggle.addEventListener('change', () => {
            saveSettings({ persistSpeed: elements.persistSpeedToggle.checked });
        });
        
        // Reset button toggle change
        elements.showResetButtonToggle.addEventListener('change', () => {
            saveSettings({ showResetButton: elements.showResetButtonToggle.checked });
        });
        
        // Enable speed popup toggle change
        elements.enableSpeedPopupToggle.addEventListener('change', () => {
            // Update UI visibility with a smooth animation
            if (elements.enableSpeedPopupToggle.checked) {
                // Show the popup settings with a smooth transition
                elements.popupSettings.style.display = 'block';
                // Add a slight delay to allow the display:block to take effect before animating
                setTimeout(() => {
                    elements.popupSettings.style.maxHeight = '500px'; // Large enough for all content
                    elements.popupSettings.style.opacity = '1';
                }, 10);
            } else {
                // Hide with animation
                elements.popupSettings.style.maxHeight = '0';
                elements.popupSettings.style.opacity = '0';
                // Wait for animation to finish before removing from layout
                setTimeout(() => {
                    elements.popupSettings.style.display = 'none';
                }, 300); // Match the transition duration
            }
                
            // Save the setting
            saveSettings({ enableSpeedPopup: elements.enableSpeedPopupToggle.checked });
        });
        
        // Initial speed popup toggle change
        elements.showInitialSpeedPopupToggle.addEventListener('change', () => {
            saveSettings({ showInitialSpeedPopup: elements.showInitialSpeedPopupToggle.checked });
        });
        
        // Popup position change
        elements.popupPosition.addEventListener('change', () => {
            saveSettings({ popupPosition: elements.popupPosition.value });
        });
        
        // Reset all settings button
        elements.resetAllSettings.addEventListener('click', () => {
            resetAllToDefaults();
        });
    }
    
    // -----------------------------------------------------------------------------
    // CONVERSION HELPERS
    // -----------------------------------------------------------------------------
    
    /**
     * Converts slider value (1-20) to increment value (0.05-1.0)
     * 
     * Transforms the slider's integer value to a decimal speed increment.
     * 
     * @param {number} value - The slider value (1-20)
     * @returns {number} The corresponding increment value (0.05-1.0)
     */
    function sliderToIncrement(value) {
        return Math.round((value * 0.05) * 100) / 100;
    }
    
    /**
     * Converts increment value (0.05-1.0) to slider value (1-20)
     * 
     * Transforms a decimal increment value back to the slider's integer value.
     * 
     * @param {number} value - The increment value (0.05-1.0)
     * @returns {number} The corresponding slider value (1-20)
     */
    function incrementToSlider(value) {
        return Math.round(value / 0.05);
    }
    
    /**
     * Formats a key combination for display
     * 
     * Converts the internal key combination format to a user-friendly
     * display format with proper capitalization and symbols.
     * 
     * @param {string} combo - The raw key combination string
     * @returns {string} Formatted key combination for display
     */
    function formatKeyCombination(combo) {
        if (!combo) return 'Not set';
        
        return combo
            .split('+')
            .map(part => {
                const trimmed = part.trim();
                
                // Handle special cases
                if (trimmed === 'wheel_up') return 'Wheel Up';
                if (trimmed === 'wheel_down') return 'Wheel Down';
                if (trimmed === 'middle_click') return 'Middle Click';
                if (trimmed.startsWith('mouse')) {
                    const buttonNumber = trimmed.slice(5);
                    return `Mouse ${buttonNumber}`;
                }
                
                // Special character formatting
                if (trimmed === '.') return '>';
                if (trimmed === ',') return '<';
                
                // Capitalize first letter
                return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            })
            .join(' + ');
    }
    
    // Loads button text from storage or sets defaults
    // button: The button element to update
    function loadButtonText(button) {
        browser.storage.local.get(button.id)
            .then(result => {
                if (result[button.id]) {
                    button.textContent = formatKeyCombination(result[button.id]);
                } else {
                    // Set defaults based on button ID
                    setDefaultButtonText(button);
                }
            })
            .catch(error => {
                console.error(`Error loading setting for ${button.id}:`, error);
                // Set defaults if there's an error
                setDefaultButtonText(button);
            });
    }
    
    // Sets default text for a shortcut button
    // button: The button to set text for
    function setDefaultButtonText(button) {
        if (button.id === 'increaseSpeedKey') {
            button.textContent = 'Shift + >';
        } else if (button.id === 'decreaseSpeedKey') {
            button.textContent = 'Shift + <';
        } else if (button.id === 'resetSpeedKey') {
            button.textContent = 'Shift + ?';
        }
    }
    
    // -----------------------------------------------------------------------------
    // KEY BINDING FUNCTIONALITY
    // -----------------------------------------------------------------------------
    
    // Handles key binding for shortcut buttons
    // button: The button being bound
    // settingName: Name of the setting to save
    function handleKeyBinding(button, settingName) {
        // Clear any other buttons in listening mode
        document.querySelectorAll('button.listening').forEach(btn => {
            if (btn !== button) {
                btn.classList.remove('listening');
            }
        });
        
        // Mark button as listening
        button.classList.add('listening');
        button.textContent = 'Press keys...';
        
        // Variables to store key combination
        let recordTimeout = null;
        
        // We'll use direct event listeners instead of hotkeys.js for key capture
        
        // Function to record key presses
        function recordKeyPress(e) {
            const key = e.key.toLowerCase();
            
            // Handle ESC to cancel
            if (key === 'escape') {
                finishRecording(null);
                return;
            }
            
            // Handle modifier keys pressed alone
            if (key === 'shift' || key === 'control' || key === 'alt') {
                return;
            }
            
            // Use our keyHandler to get a standardized combo
            const combo = keyHandler.getComboFromEvent(e);
            
            if (combo) {
                // Update button text
                button.textContent = formatKeyCombination(combo);
                
                // For keyboard, we'll use a short delay to allow for key combinations
                if (recordTimeout) clearTimeout(recordTimeout);
                recordTimeout = setTimeout(() => finishRecording(combo), 300);
            }
            
            // Prevent default actions
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Function to handle mouse wheel input
        function recordWheel(e) {
            // Use our keyHandler to get a standardized combo
            const combo = keyHandler.getComboFromEvent(e);
            
            if (combo) {
                // Update button text
                button.textContent = formatKeyCombination(combo);
                
                // For wheel events, complete immediately - no delay
                finishRecording(combo);
            }
            
            // Prevent default actions
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Function to handle mouse button input
        function recordMouseButton(e) {
            // For middle click specifically, always proceed (even if click is on the button)
            if (e.button !== 1 && e.target === button) return;
            
            // Get the combo from our keyHandler
            const combo = keyHandler.getComboFromEvent(e);
            
            if (combo) {
                // For setting hotkeys we DO need to prevent default to capture the key
                e.preventDefault();
                e.stopPropagation();
                
                // Update button text
                button.textContent = formatKeyCombination(combo);
                
                // For mouse buttons, complete immediately - no delay
                finishRecording(combo);
                
                // For middle click, make extra sure we prevent the browser action
                if (e.button === 1) {
                    return false;
                }
            }
        }
        
        // Function to clean up and save the shortcut
        function finishRecording(combo) {
            // Set listening flag to false to prevent further captures
            isListening = false;
            
            // Remove all event listeners
            document.removeEventListener('keydown', keydownListener, true);
            document.removeEventListener('wheel', wheelListener, true);
            document.removeEventListener('mousedown', mousedownListener, true);
            document.removeEventListener('click', documentClickListener, true);
            
            // Clear any pending timeouts
            if (recordTimeout) {
                clearTimeout(recordTimeout);
                recordTimeout = null;
            }
            
            // Remove listening state
            button.classList.remove('listening');
            
            // If no combo was recorded or canceled, restore previous value
            if (!combo) {
                loadButtonText(button);
                return;
            }
            
            // Save the setting
            const settings = {};
            settings[settingName] = combo;
            saveSettings(settings);
            
            // Update button text with formatted combo
            button.textContent = formatKeyCombination(combo);
            
            // Add a brief highlight effect
            button.classList.add('update-animation');
            setTimeout(() => button.classList.remove('update-animation'), 400);
        }
        
        // Track if we're still in listening mode
        let isListening = true;
        
        // We'll capture keyboard and mouse events directly - with a check for listening mode
        const keydownListener = (e) => {
            if (!isListening) return; // Skip if no longer listening
            recordKeyPress(e);
        };
        
        const wheelListener = (e) => {
            if (!isListening) return; // Skip if no longer listening
            recordWheel(e);
        };
        
        const mousedownListener = (e) => {
            if (!isListening) return; // Skip if no longer listening
            
            // Always capture events for middle click (button 1)
            if (e.button === 1) {
                recordMouseButton(e);
                e.preventDefault(); // Prevent browser behavior for middle click
                e.stopPropagation();
                return false;
            } 
            
            // For other buttons, only capture if it's not on the button itself
            if (e.target !== button) {
                recordMouseButton(e);
            }
        };
        
        // Attach listeners
        document.addEventListener('keydown', keydownListener, true);
        document.addEventListener('wheel', wheelListener, true);
        document.addEventListener('mousedown', mousedownListener, true);
        
        // Add a document click handler to cancel listening mode if clicking elsewhere
        const documentClickListener = (e) => {
            // If clicking anywhere except the current button or tooltip elements,
            // and we're still in listening mode, cancel the recording
            if (isListening && e.target !== button && !e.target.closest('.tooltip')) {
                isListening = false;
                finishRecording(null);
            }
        };
        
        // Add with a slight delay to avoid interfering with the button click that started this
        setTimeout(() => {
            document.addEventListener('click', documentClickListener, true);
        }, 100);
        
        // Safety timeout
        setTimeout(() => {
            if (button.classList.contains('listening')) {
                finishRecording(null);
            }
        }, 10000);
    }
}); 