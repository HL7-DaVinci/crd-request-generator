// Configuration loader that uses base properties and overrides with environment-specific values
const isProduction = process.env.NODE_ENV === 'production';

// Always load base properties
const baseConfig = require('./properties.json');

let config;

if (isProduction) {
  // Load production overrides and merge with base config
  const productionOverrides = require('./properties.prod.json');
  config = { ...baseConfig, ...productionOverrides };
} else {
  // Use base config for development
  config = baseConfig;
}

export default config;
