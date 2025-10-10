#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Copy built files to extension directory
 */

const buildDir = path.join(__dirname, '..', 'build', 'static');
const extensionDir = path.join(__dirname, '..', '..', 'extensions', 'assistant-widget', 'assets');

// Ensure extension directory exists
if (!fs.existsSync(extensionDir)) {
  fs.mkdirSync(extensionDir, { recursive: true });
}

// Copy JS files
const jsDir = path.join(buildDir, 'js');
if (fs.existsSync(jsDir)) {
  const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
  if (jsFiles.length > 0) {
    const jsFile = jsFiles[0]; // Take the first JS file
    const sourcePath = path.join(jsDir, jsFile);
    const targetPath = path.join(extensionDir, 'assistant-widget.js');
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copied ${jsFile} to assistant-widget.js`);
  }
}

// Copy CSS files
const cssDir = path.join(buildDir, 'css');
if (fs.existsSync(cssDir)) {
  const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
  if (cssFiles.length > 0) {
    const cssFile = cssFiles[0]; // Take the first CSS file
    const sourcePath = path.join(cssDir, cssFile);
    const targetPath = path.join(extensionDir, 'assistant-widget.css');
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copied ${cssFile} to assistant-widget.css`);
  }
}

console.log('🎉 Extension files copied successfully!');

