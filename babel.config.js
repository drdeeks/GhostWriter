const babelConfig = {
  presets: [
    ['@babel/preset-env', { targets: { browsers: 'last 2 versions' } }], // Reduce transpilation scope
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic', importSource: '@emotion/react' }],
  ],
  plugins: [
    ['@babel/plugin-transform-modules-commonjs', { loose: true }],
  ],
};

module.exports = babelConfig;