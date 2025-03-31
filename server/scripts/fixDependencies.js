import { execSync } from 'child_process';

/**
 * Script to check and ensure correct package versions
 * Run this after npm install if you encounter dependency issues on the server
 */
const fixDependencies = () => {
  console.log('Fixing server dependencies...');

  try {
    // First remove problematic dependencies
    console.log('Removing deprecated packages...');
    execSync('npm uninstall inflight', 
      { stdio: 'inherit' });
    
    // Install recommended replacements
    console.log('Installing replacement packages...');
    execSync('npm install --save lru-cache@10.2.0', 
      { stdio: 'inherit' });
    
    // Update dev dependencies
    console.log('Updating development dependencies...');
    execSync('npm install --save-dev eslint@8.57.0 rimraf@5.0.5 glob@10.3.10', 
      { stdio: 'inherit' });
    
    console.log('Successfully updated server dependencies!');
  } catch (error) {
    console.error('Error updating packages:', error.message);
  }
};

// Run when this file is executed directly
fixDependencies();
