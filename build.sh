#!/bin/bash

# YouTube Speed Control - Browser Build Script
# Generates browser-specific packages for Firefox and Chrome

# Set up colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create build directory if it doesn't exist
mkdir -p build

echo -e "${BLUE}Building extensions for Firefox and Chrome...${NC}"

# Build Firefox version
echo -e "${GREEN}Building Firefox version...${NC}"
mkdir -p build/firefox
cp -r *.js *.html manifest.json icons PRIVACY.md LICENSE build/firefox/
cd build/firefox
zip -r ../youtube-speed-control-firefox.zip *
cd ../..
echo -e "${GREEN}Firefox version built successfully!${NC}"

# Build Chrome version
echo -e "${GREEN}Building Chrome version...${NC}"
mkdir -p build/chrome
cp -r *.js *.html icons PRIVACY.md LICENSE build/chrome/
cp manifest.chrome.json build/chrome/manifest.json
cd build/chrome
zip -r ../youtube-speed-control-chrome.zip *
cd ../..
echo -e "${GREEN}Chrome version built successfully!${NC}"

echo -e "${BLUE}Build complete! Extension files are in the build directory:${NC}"
echo -e "  ${GREEN}Firefox:${NC} build/youtube-speed-control-firefox.zip"
echo -e "  ${GREEN}Chrome:${NC} build/youtube-speed-control-chrome.zip"