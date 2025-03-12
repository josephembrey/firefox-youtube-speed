/**
 * KeyHandler - A lightweight keyboard/mouse shortcut handler
 * 
 * Custom implementation for YouTube Speed Control extension
 * that handles keyboard, mouse wheel, and mouse button events.
 * 
 * Supports:
 * - Keyboard shortcuts with modifiers (shift, ctrl, alt)
 * - Mouse wheel scrolling (up/down)
 * - Mouse buttons (left, middle/wheel click, right)
 * - Combinations of modifiers with any input
 */

(function(window) {
    'use strict';
    
    // Store for active bindings
    const bindings = [];
    
    // Key code mappings for special keys
    const KEY_MAP = {
        // Special keys
        'backspace': 8,
        'tab': 9,
        'enter': 13,
        'return': 13,
        'esc': 27,
        'escape': 27,
        'space': 32,
        'left': 37,
        'up': 38,
        'right': 39,
        'down': 40,
        'del': 46,
        'delete': 46,
        
        // Punctuation
        '.': 190,
        ',': 188,
        '/': 191,
        '`': 192,
        '-': 189,
        '=': 187,
        ';': 186,
        '\'': 222,
        '[': 219,
        ']': 221,
        '\\': 220,
        
        // Modifier keys
        'shift': 16,
        'ctrl': 17,
        'control': 17,
        'alt': 18,
        'option': 18,
        'cmd': 91,
        'command': 91,
        'meta': 91,
    };
    
    // Add F1-F12 keys
    for (let i = 1; i <= 12; i++) {
        KEY_MAP['f' + i] = 111 + i;
    }
    
    // Track the state of modifier keys
    const modifierState = {
        shift: false,
        ctrl: false,
        alt: false,
        meta: false
    };
    
    /**
     * Parses a key combination string into individual keys
     * @param {string} combo - Key combination like 'shift+a' or 'ctrl+alt+delete'
     * @returns {Array} Array of individual key names
     */
    function parseCombo(combo) {
        if (!combo) return [];
        return combo.toLowerCase().split('+').map(key => key.trim());
    }
    
    /**
     * Normalizes a key name
     * @param {string} key - Key name to normalize
     * @returns {string} Normalized key name
     */
    function normalizeKey(key) {
        if (key === 'control') return 'ctrl';
        if (key === 'command' || key === 'meta') return 'cmd';
        if (key === 'option') return 'alt';
        if (key === '>') return '.';
        if (key === '<') return ',';
        if (key === ' ') return 'space';
        return key.toLowerCase();
    }
    
    /**
     * Builds a key combo string from an event
     * @param {Event} event - The keyboard or mouse event
     * @returns {string} Key combo string like 'shift+ctrl+a'
     */
    function getComboFromEvent(event) {
        const keys = [];
        
        // Add modifiers first
        if (event.shiftKey) keys.push('shift');
        if (event.ctrlKey) keys.push('ctrl');
        if (event.altKey) keys.push('alt');
        if (event.metaKey) keys.push('cmd');
        
        // Handle mouse wheel events
        if (event.type === 'wheel') {
            keys.push(event.deltaY < 0 ? 'wheel_up' : 'wheel_down');
            return keys.join('+');
        }
        
        // Handle mouse button events
        if (event.type === 'mousedown') {
            // Standard button mapping:
            // 0 = left button
            // 1 = middle button (scroll wheel click)
            // 2 = right button
            
            // Handle middle mouse click specially for better readability
            if (event.button === 1) {
                keys.push('middle_click');
            } else {
                keys.push('mouse' + (event.button + 1)); // Convert from 0-based to 1-based
            }
            return keys.join('+');
        }
        
        // Handle keyboard events
        let key = event.key.toLowerCase();
        
        // Skip if it's just a modifier key press
        if (key === 'shift' || key === 'control' || key === 'alt' || key === 'meta') {
            return '';
        }
        
        // Normalize key name
        key = normalizeKey(key);
        keys.push(key);
        
        return keys.join('+');
    }
    
    /**
     * Binds a key combination to a callback function
     * @param {string} combo - Key combination like 'shift+a'
     * @param {Function} callback - Function to call when combo is pressed
     * @returns {number} Binding ID that can be used to unbind
     */
    function bind(combo, callback) {
        if (!combo || typeof callback !== 'function') return -1;
        
        const id = Date.now() + Math.floor(Math.random() * 1000);
        const keys = parseCombo(combo);
        
        bindings.push({
            id: id,
            keys: keys,
            combo: combo,
            callback: callback
        });
        
        return id;
    }
    
    /**
     * Unbinds a previously bound key combination
     * @param {number|string} idOrCombo - Binding ID or key combo string
     * @returns {boolean} True if successfully unbound
     */
    function unbind(idOrCombo) {
        if (!idOrCombo) return false;
        
        // If it's a number, treat as an ID
        if (typeof idOrCombo === 'number') {
            const index = bindings.findIndex(binding => binding.id === idOrCombo);
            if (index !== -1) {
                bindings.splice(index, 1);
                return true;
            }
            return false;
        }
        
        // Otherwise treat as a combo string
        let found = false;
        for (let i = bindings.length - 1; i >= 0; i--) {
            if (bindings[i].combo === idOrCombo) {
                bindings.splice(i, 1);
                found = true;
            }
        }
        return found;
    }
    
    /**
     * Unbinds all key combinations
     */
    function unbindAll() {
        bindings.length = 0;
    }
    
    /**
     * Handles keyboard events
     * @param {KeyboardEvent} event - The keyboard event
     */
    function handleKeyEvent(event) {
        // Update modifier state
        if (event.type === 'keydown') {
            if (event.key === 'Shift') modifierState.shift = true;
            else if (event.key === 'Control') modifierState.ctrl = true;
            else if (event.key === 'Alt') modifierState.alt = true;
            else if (event.key === 'Meta') modifierState.meta = true;
        } else if (event.type === 'keyup') {
            if (event.key === 'Shift') modifierState.shift = false;
            else if (event.key === 'Control') modifierState.ctrl = false;
            else if (event.key === 'Alt') modifierState.alt = false;
            else if (event.key === 'Meta') modifierState.meta = false;
        }
        
        // Only process on keydown
        if (event.type !== 'keydown') return;
        
        const combo = getComboFromEvent(event);
        if (!combo) return;
        
        // Check if combo matches any bindings
        for (const binding of bindings) {
            if (binding.combo === combo) {
                // Matched! Execute callback
                const result = binding.callback(event);
                
                // Prevent default behavior if callback returned false
                if (result === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        }
    }
    
    /**
     * Handles mouse events
     * @param {MouseEvent} event - The mouse event
     */
    function handleMouseEvent(event) {
        const combo = getComboFromEvent(event);
        if (!combo) return;
        
        // Check if combo matches any bindings
        for (const binding of bindings) {
            if (binding.combo === combo) {
                // Matched! Execute callback
                const result = binding.callback(event);
                
                // Event defaults are already prevented in the calling code
                // when we've verified the combo is bound
                return;
            }
        }
    }
    
    // Set up global event listeners
    document.addEventListener('keydown', handleKeyEvent, true);
    document.addEventListener('keyup', handleKeyEvent, true);
    document.addEventListener('wheel', handleMouseEvent, { passive: false, capture: true });
    
    // Only add mousedown for specific mouse buttons - not left click (button 0)
    // This ensures we don't interfere with normal play/pause click behavior
    document.addEventListener('mousedown', (event) => {
        // Only process non-left clicks (middle, right, etc.)
        if (event.button !== 0) {
            // Get the combo string for this event
            const combo = getComboFromEvent(event);
            
            // Check if this combo is bound to anything before preventing defaults
            let comboBound = false;
            for (const binding of bindings) {
                if (binding.combo === combo) {
                    comboBound = true;
                    break;
                }
            }
            
            // Only if we have a binding for this combo, handle it and prevent defaults
            if (comboBound) {
                // Now we can prevent defaults and handle the event
                event.preventDefault();
                event.stopPropagation();
                handleMouseEvent(event);
            }
            // Otherwise, let the browser handle it normally (middle-click scrolling, etc.)
        }
    }, true);
    
    // Public API
    window.keyHandler = {
        bind: bind,
        unbind: unbind,
        unbindAll: unbindAll,
        getComboFromEvent: getComboFromEvent
    };
    
})(window);