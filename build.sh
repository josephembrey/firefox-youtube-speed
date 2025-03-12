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
    PACKAGE_METHOD="zip"
elif command -v tar >/dev/null 2>&1 && command -v gzip >/dev/null 2>&1; then
    ZIP_AVAILABLE=true
    PACKAGE_METHOD="tar"
    echo -e "${YELLOW}Note: 'zip' command not found, but 'tar' and 'gzip' are available. Will use them instead.${NC}"
else
    ZIP_AVAILABLE=false
    PACKAGE_METHOD="none"
    echo -e "${YELLOW}Warning: Neither 'zip' nor 'tar+gzip' found. Will create directories only without packages.${NC}"
    echo -e "${YELLOW}To create packages, install zip with 'sudo apt-get install zip' or equivalent.${NC}"
fi

# Build Firefox version
echo -e "${GREEN}Building Firefox version...${NC}"
rm -rf build/firefox
mkdir -p build/firefox
cp -r *.js *.html manifest.json icons PRIVACY.md LICENSE build/firefox/

# Create package if available
if [ "$ZIP_AVAILABLE" = true ]; then
    if [ "$PACKAGE_METHOD" = "zip" ]; then
        cd build/firefox
        zip -r ../youtube-speed-control-firefox.zip *
        cd ../..
        echo -e "${GREEN}Firefox version ZIP file created!${NC}"
    elif [ "$PACKAGE_METHOD" = "tar" ]; then
        cd build/firefox
        tar -czf ../youtube-speed-control-firefox.tar.gz *
        cd ../..
        echo -e "${GREEN}Firefox version TAR.GZ file created!${NC}"
    fi
fi

echo -e "${GREEN}Firefox version built successfully!${NC}"

# Build Chrome version
echo -e "${GREEN}Building Chrome version...${NC}"
rm -rf build/chrome
mkdir -p build/chrome
cp -r *.js *.html icons PRIVACY.md LICENSE build/chrome/
cp manifest.chrome.json build/chrome/manifest.json

# Create package if available
if [ "$ZIP_AVAILABLE" = true ]; then
    if [ "$PACKAGE_METHOD" = "zip" ]; then
        cd build/chrome
        zip -r ../youtube-speed-control-chrome.zip *
        cd ../..
        echo -e "${GREEN}Chrome version ZIP file created!${NC}"
    elif [ "$PACKAGE_METHOD" = "tar" ]; then
        cd build/chrome
        tar -czf ../youtube-speed-control-chrome.tar.gz *
        cd ../..
        echo -e "${GREEN}Chrome version TAR.GZ file created!${NC}"
    fi
fi

echo -e "${GREEN}Chrome version built successfully!${NC}"

echo -e "${BLUE}Build complete! Extension files are in the build directory:${NC}"
if [ "$ZIP_AVAILABLE" = true ]; then
    if [ "$PACKAGE_METHOD" = "zip" ]; then
        echo -e "  ${GREEN}Firefox:${NC} build/youtube-speed-control-firefox.zip"
        echo -e "  ${GREEN}Chrome:${NC} build/youtube-speed-control-chrome.zip"
    elif [ "$PACKAGE_METHOD" = "tar" ]; then
        echo -e "  ${GREEN}Firefox:${NC} build/youtube-speed-control-firefox.tar.gz"
        echo -e "  ${GREEN}Chrome:${NC} build/youtube-speed-control-chrome.tar.gz"
    fi
else
    echo -e "  ${GREEN}Firefox:${NC} build/firefox/"
    echo -e "  ${GREEN}Chrome:${NC} build/chrome/"
fi

echo -e "${BLUE}To load unpacked extensions:${NC}"
echo -e "  ${GREEN}Firefox:${NC} Open about:debugging -> This Firefox -> Load Temporary Add-on -> Select build/firefox/manifest.json"
echo -e "  ${GREEN}Chrome:${NC} Open chrome://extensions/ -> Enable Developer Mode -> Load Unpacked -> Select build/chrome/ folder"