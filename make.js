'use strict';

require('nitro')(function (nitro) {

  nitro.task('lint', function () {

    nitro.load('lib/{,**/}*.js').process('eslint');

  });

  nitro.task('build', function () {

    nitro.load('lib/fn.js')
      .each(function (f) {
        f.setSrc( nitro.template( nitro.file.read('./lib/global-wrapper.js') )({ src: f.getSrc() }) );
      })
      .writeFile('dist/fn.js')
      .process('uglify')
      .writeFile('dist/fn.min.js');

  });

  var pkgActions = {
    increaseVersion: function () {
      nitro.package('bower').setVersion( nitro.package('npm').increaseVersion().version() );
    }
  };

  nitro.task('pkg', function (target) {
    if( pkgActions[target] ) {
      return pkgActions[target]();
    }

    var pkg = require('./package');
    process.stdout.write(pkg[target]);
    process.exit(0);
  });

}).run();
