const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FIXED_BUILD_GRADLE = `apply plugin: 'com.android.library'
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

repositories {
    mavenLocal()
    maven { url "$rootDir/../node_modules/react-native/android" }
    mavenCentral()
    google()
    maven { url 'https://www.jitpack.io' }
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

const withRNTPGradleFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const buildGradlePath = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        'react-native-track-player',
        'android',
        'build.gradle'
      );

      if (!fs.existsSync(buildGradlePath)) {
        console.warn('[withRNTPGradleFix] RNTP build.gradle not found, skipping');
        return config;
      }

      fs.writeFileSync(buildGradlePath, FIXED_BUILD_GRADLE, 'utf8');
      console.log('[withRNTPGradleFix] Patched RNTP android/build.gradle for Gradle 9 compatibility');
      return config;
    },
  ]);
};

module.exports = withRNTPGradleFix;
