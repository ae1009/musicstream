#!/usr/bin/env node
// react-native-track-player was replaced by expo-av — this script is now a no-op.
const path = require('path');
const rntpPath = path.join(__dirname, '..', 'node_modules', 'react-native-track-player');
const fs = require('fs');
if (!fs.existsSync(rntpPath)) {
  console.log('[patch-rntp] RNTP not installed, skipping (using expo-av instead)');
  process.exit(0);
}
console.log('[patch-rntp] RNTP found but expo-av is primary audio library');
