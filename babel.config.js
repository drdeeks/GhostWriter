const babelConfig = {
  presets: [
    ['@babel/preset-env', { targets: 'defaults' }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};

module.exports = babelConfig;