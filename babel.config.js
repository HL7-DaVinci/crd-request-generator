module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: [
          '>0.2%',
          'not dead',
          'not op_mini all'
        ]
      },
      useBuiltIns: 'entry',
      corejs: 3
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }]
  ],
  plugins: [
    '@babel/plugin-proposal-private-property-in-object'
  ]
};
