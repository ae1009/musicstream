#!/usr/bin/env node
// Patches react-native-track-player for Gradle 9 + RN 0.85.x compatibility.
// Idempotent: safe to run multiple times.
const fs = require('fs');
const path = require('path');

const rntpAndroid = path.join(__dirname, '..', 'node_modules', 'react-native-track-player', 'android');

// ─── Patch 1: build.gradle ───────────────────────────────────────────────────
const buildGradlePath = path.join(rntpAndroid, 'build.gradle');

if (!fs.existsSync(buildGradlePath)) {
  console.log('[patch-rntp] RNTP not found, skipping');
  process.exit(0);
}

const DESIRED_GRADLE = `apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'

def getExtOrIntegerDefault(name) {
    return rootProject.ext.has(name) ? rootProject.ext.get(name) : (project.properties['RNTP_' + name]).toInteger()
}

android {
    compileSdkVersion getExtOrIntegerDefault('compileSdkVersion')
    namespace 'com.doublesymmetry.trackplayer'

    defaultConfig {
        minSdkVersion getExtOrIntegerDefault('minSdkVersion')
        targetSdkVersion getExtOrIntegerDefault('targetSdkVersion')

        versionCode 300
        versionName '3.0'

        consumerProguardFiles 'proguard-rules.txt'
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'com.github.doublesymmetry:kotlinaudio:v2.1.0'

    //noinspection GradleDynamicVersion
    implementation "com.facebook.react:react-android"

    implementation "androidx.core:core-ktx:1.9.0"
    implementation "androidx.localbroadcastmanager:localbroadcastmanager:1.1.0"
    implementation "androidx.lifecycle:lifecycle-process:2.5.1"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.6.3"
}
`;

const currentGradle = fs.readFileSync(buildGradlePath, 'utf8');
if (currentGradle !== DESIRED_GRADLE) {
  fs.writeFileSync(buildGradlePath, DESIRED_GRADLE, 'utf8');
  console.log('[patch-rntp] Patched build.gradle for Gradle 9 + RN 0.85 compatibility');
} else {
  console.log('[patch-rntp] build.gradle already patched');
}

// ─── Patch 2: MusicModule.kt — fix Bundle? → Bundle for RN 0.85.3 ──────────
// Arguments.fromBundle() now requires non-nullable Bundle in RN 0.85.3.
// Two call sites in RNTP 4.1.2 pass Bundle? (nullable), causing compile errors.
const musicModulePath = path.join(
  rntpAndroid,
  'src', 'main', 'java', 'com', 'doublesymmetry', 'trackplayer', 'module', 'MusicModule.kt'
);

if (fs.existsSync(musicModulePath)) {
  let kt = fs.readFileSync(musicModulePath, 'utf8');
  let changed = false;

  // Fix line ~548: getTrack — pass non-null Bundle to Arguments.fromBundle
  const old548 = 'callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem))';
  const new548 = 'callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem ?: Bundle()))';
  if (kt.includes(old548)) {
    kt = kt.replace(old548, new548);
    changed = true;
  }

  // Fix line ~587-589: getActiveTrack — same issue (use regex for robustness)
  const re588 = /Arguments\.fromBundle\(\s*[\r\n]+(\s*)(musicService\.tracks\[musicService\.getCurrentTrackIndex\(\)\]\.originalItem)\s*[\r\n]+(\s*)\)/;
  if (re588.test(kt) && !kt.match(/getCurrentTrackIndex\(\)\]\.originalItem \?: Bundle\(\)/)) {
    kt = kt.replace(re588, (m, indent, expr, closingIndent) =>
      `Arguments.fromBundle(\n${indent}${expr} ?: Bundle()\n${closingIndent})`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(musicModulePath, kt, 'utf8');
    console.log('[patch-rntp] Patched MusicModule.kt for RN 0.85.3 Bundle nullability');
  } else {
    console.log('[patch-rntp] MusicModule.kt already patched or pattern not found');
  }
}
