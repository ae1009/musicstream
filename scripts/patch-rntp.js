#!/usr/bin/env node
// Patches react-native-track-player's android/build.gradle for Gradle 9 + RN 0.85.x compatibility.
// Idempotent: safe to run multiple times.
const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-track-player',
  'android',
  'build.gradle'
);

if (!fs.existsSync(buildGradlePath)) {
  console.log('[patch-rntp] RNTP build.gradle not found, skipping');
  process.exit(0);
}

const DESIRED_CONTENT = `apply plugin: 'com.android.library'
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

const current = fs.readFileSync(buildGradlePath, 'utf8');

if (current === DESIRED_CONTENT) {
  console.log('[patch-rntp] Already patched, skipping');
  process.exit(0);
}

fs.writeFileSync(buildGradlePath, DESIRED_CONTENT, 'utf8');
console.log('[patch-rntp] Patched RNTP android/build.gradle for Gradle 9 + RN 0.85 compatibility');
