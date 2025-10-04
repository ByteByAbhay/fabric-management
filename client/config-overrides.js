module.exports = function override(config, env) {
  // Find the source-map-loader rule and modify it
  config.module.rules.forEach((rule) => {
    if (rule.enforce === 'pre') {
      // Look for the source-map-loader
      if (rule.use && Array.isArray(rule.use)) {
        const sourceMapLoaderIndex = rule.use.findIndex(
          (loader) => loader.loader && loader.loader.includes('source-map-loader')
        );
        
        if (sourceMapLoaderIndex >= 0) {
          // Exclude node_modules from source-map-loader
          rule.exclude = /node_modules/;
        }
      } else if (rule.loader && rule.loader.includes('source-map-loader')) {
        // Alternative format where loader is directly on the rule
        rule.exclude = /node_modules/;
      }
    }
  });
  
  return config;
}; 