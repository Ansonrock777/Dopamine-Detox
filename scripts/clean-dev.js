#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';

function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      console.log(`🧹 Cleaning ${dirPath}...`);
      
      if (isWindows) {
        // Use Windows-specific removal to handle symlinks properly
        const { execSync } = require('child_process');
        try {
          execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore' });
        } catch (error) {
          // Fallback to manual removal
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      } else {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      
      console.log(`✅ Cleaned ${dirPath}`);
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not remove ${dirPath}:`, error.message);
  }
}

function cleanDevelopment() {
  console.log('🚀 Starting clean development environment...');
  
  // Directories to clean
  const dirsToClean = [
    '.next',
    'node_modules/.cache',
    '.next/cache'
  ];
  
  dirsToClean.forEach(removeDirectory);
  
  // Windows-specific OneDrive sync pause recommendation
  if (isWindows && process.env.ONEDRIVE) {
    console.log('💡 TIP: If issues persist, temporarily pause OneDrive sync on this folder');
    console.log('   Right-click OneDrive icon → Settings → Account → Choose folders');
  }
  
  console.log('✨ Clean complete! Starting development server...');
}

// Handle different ways this script might be called
if (require.main === module) {
  cleanDevelopment();
}

module.exports = cleanDevelopment;
