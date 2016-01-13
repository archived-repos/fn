module.exports = function(config) {

  var configuration = {
    frameworks: ['mocha', 'chai'],
    plugins: [
      'karma-mocha',
      'karma-chai',
      'karma-chrome-launcher'
    ],
    files: [
      'dist/fn.js',
      'tests/*.js'
    ],
    browsers: [ 'Chrome' ],
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    singleRun: true
  };

  if(process.env.TRAVIS){
    configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration);
};
