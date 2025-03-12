#!/bin/bash

# YouTube Speed Control - Browser Build Script
# Generates browser-specific packages for Firefox and Chrome

# Set up colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Create build directory if it doesn't exist
mkdir -p build

echo -e "${BLUE}Building extensions for Firefox and Chrome...${NC}"

# Check if zip command is available
if command -v zip >/dev/null 2>&1; then
    ZIP_AVAILABLE=true
else
    ZIP_AVAILABLE=false
    echo -e "${YELLOW}Warning: 'zip' command not found. Will create directories only without ZIP files.${NC}"
    echo -e "${YELLOW}To create ZIP files, please install zip with 'sudo apt-get install zip' or equivalent.${NC}"
fi

# Build Firefox version
echo -e "${GREEN}Building Firefox version...${NC}"
rm -rf build/firefox
mkdir -p build/firefox
cp -r *.js *.html manifest.json icons PRIVACY.md LICENSE build/firefox/

# Create zip if available
if [ "$ZIP_AVAILABLE" = true ]; then
    cd build/firefox
    zip -r ../youtube-speed-control-firefox.zip *
    cd ../..
    echo -e "${GREEN}Firefox version ZIP file created!${NC}"
fi

echo -e "${GREEN}Firefox version built successfully!${NC}"

# Build Chrome version
echo -e "${GREEN}Building Chrome version...${NC}"
rm -rf build/chrome
mkdir -p build/chrome
cp -r *.js *.html icons PRIVACY.md LICENSE build/chrome/
cp manifest.chrome.json build/chrome/manifest.json

# Create zip if available
if [ "$ZIP_AVAILABLE" = true ]; then
    cd build/chrome
    zip -r ../youtube-speed-control-chrome.zip *
    cd ../..
    echo -e "${GREEN}Chrome version ZIP file created!${NC}"
fi

echo -e "${GREEN}Chrome version built successfully!${NC}"

echo -e "${BLUE}Build complete! Extension files are in the build directory:${NC}"
if [ "$ZIP_AVAILABLE" = true ]; then
    echo -e "  ${GREEN}Firefox:${NC} build/youtube-speed-control-firefox.zip"
    echo -e "  ${GREEN}Chrome:${NC} build/youtube-speed-control-chrome.zip"
else
    echo -e "  ${GREEN}Firefox:${NC} build/firefox/"
    echo -e "  ${GREEN}Chrome:${NC} build/chrome/"
fi

echo -e "${BLUE}To load unpacked extensions:${NC}"
echo -e "  ${GREEN}Firefox:${NC} Open about:debugging -> This Firefox -> Load Temporary Add-on -> Select build/firefox/manifest.json"
echo -e "  ${GREEN}Chrome:${NC} Open chrome://extensions/ -> Enable Developer Mode -> Load Unpacked -> Select build/chrome/ folder"