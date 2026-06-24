const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// 1. Add MusicService to AndroidManifest.xml
const withMusicService = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application[0];

    if (!app.service) app.service = [];

    const alreadyAdded = app.service.some(
      (s) => s.$?.['android:name'] === 'com.doublesymmetry.trackplayer.service.MusicService'
    );

    if (!alreadyAdded) {
      app.service.push({
        $: {
          'android:name': 'com.doublesymmetry.trackplayer.service.MusicService',
          'android:exported': 'false',
          'android:foregroundServiceType': 'mediaPlayback',
          'android:stopWithTask': 'true',
        },
      });
      console.log('[withRNTPAndroidFixes] Added MusicService to AndroidManifest.xml');
    }

    return config;
  });
};

// 2. Add proguard -keep rules for RNTP + kotlinaudio
const withRNTPProguard = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardPath = path.join(
        config.modRequest.projectRoot,
        'android',
        'app',
        'proguard-rules.pro'
      );

      const rntp_rules = `
# ── react-native-track-player ──────────────────────────────────────
-keep class com.doublesymmetry.trackplayer.** { *; }
-keep class com.doublesymmetry.kotlinaudio.** { *; }
-dontwarn com.doublesymmetry.trackplayer.**
-dontwarn com.doublesymmetry.kotlinaudio.**
# ───────────────────────────────────────────────────────────────────
`;

      if (fs.existsSync(proguardPath)) {
        const current = fs.readFileSync(proguardPath, 'utf8');
        if (!current.includes('react-native-track-player')) {
          fs.writeFileSync(proguardPath, current + rntp_rules, 'utf8');
          console.log('[withRNTPAndroidFixes] Added RNTP proguard -keep rules');
        }
      }

      return config;
    },
  ]);
};

module.exports = (config) => {
  config = withMusicService(config);
  config = withRNTPProguard(config);
  return config;
};
