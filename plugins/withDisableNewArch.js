const { withGradleProperties } = require('@expo/config-plugins');

const withDisableNewArch = (config) => {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const idx = props.findIndex(
      (p) => p.type === 'property' && p.key === 'newArchEnabled'
    );
    if (idx >= 0) {
      props[idx].value = 'false';
    } else {
      props.push({ type: 'property', key: 'newArchEnabled', value: 'false' });
    }
    return config;
  });
};

module.exports = withDisableNewArch;
