import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Script to check and ensure correct package versions
 * Run this after npm install if you encounter dependency issues
 */
const checkAndReplaceDependencies = () => {
  console.log('Checking and replacing deprecated packages...');

  try {
    // First remove problematic dependencies
    console.log('Removing deprecated packages...');
    execSync('npm uninstall inflight @humanwhocodes/object-schema @humanwhocodes/config-array', 
      { stdio: 'inherit' });
    
    // Install recommended replacements
    console.log('Installing replacement packages...');
    execSync('npm install --save lru-cache@10.2.0', 
      { stdio: 'inherit' });
    
    // Update dev dependencies
    console.log('Updating development dependencies...');
    execSync('npm install --save-dev eslint@8.57.0 rimraf@5.0.5 glob@10.3.10', 
      { stdio: 'inherit' });
    
    console.log('Successfully replaced deprecated packages!');
  } catch (error) {
    console.error('Error replacing packages:', error.message);
  }
};

// Run the check when this file is executed directly
if (process.argv[1] === import.meta.url) {
  checkAndReplaceDependencies();
}

export default checkAndReplaceDependencies;
