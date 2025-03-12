/**
 * Browser API Compatibility Layer
 * 
 * Provides a unified API that works across Firefox and Chrome by detecting
 * the browser environment and mapping APIs accordingly.
 *
 * @license MIT
 * @version 1.0
 */

(function(window) {
    'use strict';
    
    // Only define the polyfill if the browser object doesn't exist
    // (in Firefox it exists, in Chrome it doesn't)
    if (typeof window.browser === 'undefined') {
        window.browser = {
            // Storage API
            storage: {
                local: {
                    get: function(keys) {
                        return new Promise((resolve, reject) => {
                            chrome.storage.local.get(keys, (result) => {
                                if (chrome.runtime.lastError) {
                                    reject(chrome.runtime.lastError);
                                } else {
                                    resolve(result);
                                }
                            });
                        });
                    },
                    set: function(items) {
                        return new Promise((resolve, reject) => {
                            chrome.storage.local.set(items, () => {
                                if (chrome.runtime.lastError) {
                                    reject(chrome.runtime.lastError);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    }
                }
            },
            
            // Tabs API
            tabs: {
                query: function(queryInfo) {
                    return new Promise((resolve, reject) => {
                        chrome.tabs.query(queryInfo, (tabs) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(tabs);
                            }
                        });
                    });
                },
                sendMessage: function(tabId, message) {
                    return new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(tabId, message, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(response);
                            }
                        });
                    });
                }
            },
            
            // Runtime API
            runtime: {
                onMessage: {
                    addListener: function(listener) {
                        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                            // Process the message with the listener
                            const response = listener(message, sender);
                            
                            // Return true for async response handling
                            return true;
                        });
                    }
                }
            }
        };
    }
})(window);