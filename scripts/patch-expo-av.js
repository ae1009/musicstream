#!/usr/bin/env node
// expo-av 15.0.x uses resolveView() from expo-modules-core which was
// renamed to findView() in expo-modules-core 2.x (Expo SDK 53+).
// This patch fixes ViewUtils.kt to use the new API.
const fs = require('fs');
const path = require('path');

const viewUtilsPath = path.join(
  __dirname, '..', 'node_modules', 'expo-av', 'android', 'src', 'main',
  'java', 'expo', 'modules', 'av', 'ViewUtils.kt'
);

if (!fs.existsSync(viewUtilsPath)) {
  console.log('[patch-expo-av] expo-av ViewUtils.kt not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(viewUtilsPath, 'utf8');
let changed = false;

// Replace resolveView with findView (expo-modules-core 2.x rename)
if (content.includes('.resolveView<') || content.includes('.resolveView(')) {
  content = content.replace(/\.resolveView</g, '.findView<');
  content = content.replace(/\.resolveView\(/g, '.findView(');
  changed = true;
}

if (changed) {
  fs.writeFileSync(viewUtilsPath, content, 'utf8');
  console.log('[patch-expo-av] Patched ViewUtils.kt: resolveView → findView');
} else if (content.includes('.findView<') || content.includes('.findView(')) {
  console.log('[patch-expo-av] ViewUtils.kt already uses findView, no patch needed');
} else {
  console.log('[patch-expo-av] ViewUtils.kt pattern not found, skipping');
}
