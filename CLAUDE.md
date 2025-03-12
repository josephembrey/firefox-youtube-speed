# YouTube Speed Control - Development Guide

## Commands

### Development
- `about:debugging` -> Load Temporary Add-on -> Select manifest.json (for Firefox testing)
- No explicit build commands needed - vanilla JavaScript extension

### Testing
- Test manually on YouTube.com videos using keyboard shortcuts
- Verify shortcuts work: Shift+>, Shift+<, Shift+?
- Test settings UI by clicking extension icon

### Dependencies
- Uses custom keyhandler.js for keyboard and mouse input handling
- No external dependencies

## Code Style

This project adheres to a consistent code style described below. All new code contributions should follow these guidelines.

### JavaScript
- Use ES6+ features but maintain Firefox compatibility (Firefox 109.0+)
- Organize code into logical sections with clear comment dividers
- Error handling: Use try/catch blocks with console.error logging
- Browser API interactions should include error handling with .catch()
- Use const for variables that won't be reassigned, let otherwise
- Use arrow functions for callbacks and event handlers
- Use traditional functions for named functions
- Promises should be properly chained with .then() and include .catch()

### Formatting
- 4-space indentation throughout all JavaScript files
- Consistent spacing around operators and control structures
- Opening braces on the same line as statement

### Comments
- Use JSDoc-style comments for ALL functions:
  ```javascript
  /**
   * Function description with clear purpose statement
   * 
   * Additional details about behavior if needed
   *
   * @param {type} paramName - Parameter description
   * @returns {type} Return value description
   */
  ```
- Use section dividers with following format:
  ```javascript
  // -----------------------------------------------------------------------------
  // SECTION NAME IN UPPERCASE
  // -----------------------------------------------------------------------------
  ```

### Naming Conventions
- camelCase for variables and functions
- Functions should have descriptive names indicating their purpose
- Constants in ALL_CAPS with underscores
- Variable names should be clear and descriptive
- Boolean variables should use is/has/should prefixes

### File Structure
- content.js: Main extension functionality for YouTube integration
- settings.js: UI logic for extension popup
- settings.html: Extension popup UI
- manifest.json: Extension definition and permissions

### Browser APIs
- Use browser.storage.local for persistent data
- Use browser.tabs and browser.runtime for extension communication