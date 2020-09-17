(() => {
  "use strict";
  // Define your library strictly...
})();
module.exports = (grunt) => {
  //#region Grunt setup
  const isWin = process.platform === "win32";
  const getNodeMajor = () => {
    // https://www.regexpal.com/?fam=108819
    const s = process.version;
    const major = s.replace(/v?(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)/, '$1');
    return parseInt(major, 10);
  }
  const pkg = grunt.file.readJSON('package.json');
  const nodeMajor = getNodeMajor();
  let isES6Plus = false;
  try {
    let es6Map = new Map();
    es6Map.set('a', 1);
    es6Map.set('b', 2);
    isES6Plus = true;
    grunt.log.writeln('ES6 (es2015) or greater');
    es6Map = null;
  } catch (err) {
    grunt.log.writeln("ES6 not supported :(");
  }
  //#endregion
 
  //#region Envrioment setting Default
  const envDefault = {
    //#region common
    PKG_MODULE: () => {
      return pkg.module;
    },
    PKG_TYPE: () => {
      return pkg.typings;
    },
    OUT: () => {
      return pkg._out;
    },
    PKG_JS_LEGACY: () => {
      return pkg._jsLegacyFile;
    },
    PKG_JS: () => {
      return pkg._jsEsFile;
    },
    JS_MIN: () => {
      return pkg._jsEsFile.replace('.js', '.min.js');
    },
    JS_DIR: () => {
      const s = pkg._jsEsFile;
      return s.substr(0, s.lastIndexOf('/') + 1);
    },
    //#endregion

    //#region dynamic
    NODE_ENV: 'production',
    WORK_DIR: "",
    SCRATCH: () => {
      return pkg._scratch;
    },
    SCRATCH_BUILD: () => {
      return pkg._scratchBuild.replace('{0}', pkg._scratch);
    },
    PKG_JS: () => {
      return pkg._jsEsFile;
    },
    JS_MIN: () => {
      return pkg._jsEsFile.replace('.js', '.min.js');
    },
    JS_DIR: () => {
      const s = pkg._jsEsFile;
      return s.substr(0, s.lastIndexOf('/') + 1);
    }    
    //#endregion
  };
  //#endregion

  // #region grunt init config
  //#region init Options
  const config = {
    // pkg: packageData,
    env: {
      dev: {},
      site: {},
      build: {},
      test: {},
      test_legacy: {},
      test_orig: {},
      build_legacy: {}
    },
    clean: {
      scratch: ['<%= SCRATCH %>'],
      out: ['<%= OUT %>'],
      js: ['<%= JS_DIR %>/*.js'],
      test: ['<%= WORK_DIR %>'],
      site: ['<%= SCRATCH %>/site'],
      test_html: ['<%= WORK_DIR %>/*.html'],
      test_orig: [
        '<%= WORK_DIR %>/tests.css',
        '<%= WORK_DIR %>/const.js',
        '<%= WORK_DIR %>/spelling.html'
      ]
    },

    tslint: {
      options: {
        configuration: 'tslint.json'
      },
      plugin: ['typo/**/*.ts']
    },
    remove_comments: {
      js: {
        options: {
          multiline: true, // Whether to remove multi-line block comments
          singleline: true, // Whether to remove the comment of a single line.
          keepSpecialComments: false, // Whether to keep special comments, like: /*! !*/
          linein: true, // Whether to remove a line-in comment that exists in the line of code, it can be interpreted as a single-line comment in the line of code with /* or //.
          isCssLinein: false // Whether the file currently being processed is a CSS file
        },
        src: '<%= SCRATCH_BUILD %>/index.js',
        dest: '<%= PKG_MODULE %>'
      },
    },
    shell: {
      tsc: 'tsc',
      tsc_es: 'tsc -p tsconfig.es.json',
      tsc_legacy: 'tsc -p tsconfig.legacy.json',
      rollup: 'rollup -c',
      rollup_legacy: 'rollup -c rollup.config.legacy.js',
      start: 'npm run  lite',
      start_orig: 'npm run  lite_orig',
      start_legacy: 'npm run  lite_legacy',
      start_site: 'npm run lite_site',
      typecheck: 'tsc --noEmit'
    },
    copy: {
      d: {
        files: [{
          src: './lib/main.d.ts',
          dest: './index.d.ts'
        }]
      },
      test_dir: {
        files: [{
          expand: true,
          cwd: 'tests/',
          src: '**/*',
          dest: '<%= WORK_DIR %>'
        }]
      },
      typo_us_en: {
        files: [{
          expand: true,
          cwd: 'typo/dictionaries/en_US/',
          src: '**/*+(.aff|.dic)',
          dest: '<%= WORK_DIR %>/dictionaries/en_US/'
        }]
      },
      test_dict: {
        files: [{
          expand: true,
          cwd: 'tests/dictionaries/',
          src: '**/**/*+(.aff|.dic)',
          dest: '<%= WORK_DIR %>/dictionaries/'
        }]
      },
      site_files: {
        files: [{
          expand: true,
          cwd: 'site',
          src: '**/**/*+(.html|.css|.js)',
          dest: '<%= WORK_DIR %>/'
        }]
      },
      js_legacy_min: {
        files: [{
          expand: true,
          cwd: '<%= JS_DIR %>/',
          src: '**/*.min*',
          dest: '<%= WORK_DIR %>/js/'
        }]
      },
      test_js: {
        files: [{
          expand: true,
          cwd: '<%= JS_DIR %>',
          src: '**/*',
          dest: '<%= WORK_DIR %>/js'
        }]
      },
      final: {
        files: [{
          src: '<%= SCRATCH_BUILD %>/index.d.ts',
          dest: '<%= PKG_TYPE %>'
        }]
      },
      test_old_css: {
        files: [{
          src: 'tests/tests.orig.css',
          dest: '<%= WORK_DIR %>/tests.css'
        }]
      },
      test_old_spelling: {
        files: [{
          src: 'tests/spelling.orig.html',
          dest: '<%= WORK_DIR %>/spelling.html'
        }]
      }
    },
    terser: {
      main: {
        options: {
          sourceMap: true
        },
        files: {
          '<%= JS_MIN %>': ['<%= PKG_JS %>']
        }
      },
      legacy: {
        options: {
          sourceMap: true
        },
        files: {
          '<%= JS_MIN %>': ['<%= PKG_JS_LEGACY %>']
        }
      }
    },
    replace: {
      test_orig: {
        options: {
          patterns: [
            {
              match: /src=\"js\/typo.js\"/g,
              replacement: 'src="https://cdn.jsdelivr.net/gh/cfinke/Typo.js@671b305b432d589d5467f4ee8cf69726aa5be336/typo/typo.js"'
            }
          ]
        },
        files: [{
          expand: true,
          cwd: 'tests/',
          src: '**/*html',
          dest: '<%= WORK_DIR %>'
        }]
      },
      test_orig_flag: {
        options: {
          patterns: [
            {
              match: /(?:var|const|let)\s+TEST_ORIG\s+=\s(?:true|false);/g,
              replacement: 'const TEST_ORIG = false;'
            }
          ]
        },
        files: [{
          src: 'tests/const.js',
          dest: '<%= WORK_DIR %>/const.js'
        }]
      }
    },
    build_include: {
      legacy: {
        files: [{
          expand: true,
          cwd: '<%= SCRATCH %>/legacy/',
          src: '**/*.js',
          dest: '<%= SCRATCH_BUILD %>'
        }]
      }
    }
  };
  //#endregion
  //#region config adjust
  const calcEnvDef = () => {
    const newEnv = {};
    for (const key in envDefault) {
      if (envDefault.hasOwnProperty(key)) {
        const setting = envDefault[key];
        if (typeof setting === 'function') {
          newEnv[key] = setting();
        } else {
          newEnv[key] = setting;
        }
      }
    }
    return newEnv;
  }
  const envDef = calcEnvDef();
  
  const createEnv = (changes) => {
    const newEnv = {...envDef};
    for (const key in changes) {
      if (changes.hasOwnProperty(key)) {
        const cSetting = changes[key];
        if (typeof cSetting === 'function') {
          newEnv[key] = cSetting();
        } else {
          newEnv[key] = cSetting;
        }
      }
    }
    return newEnv;
  };
  config.env.build = createEnv({});
  config.env.test = createEnv({
    NODE_ENV: 'test',
    WORK_DIR: () => {
      return pkg._scratch + "/tests";
    },
  });
  config.env.dev = createEnv({
    NODE_ENV: 'development'
  });
  config.env.site = createEnv({
    NODE_ENV: 'site',
    WORK_DIR: () => {
      return pkg._scratch + "/site";
    }
  });
  config.env.test_legacy = createEnv({
    NODE_ENV: 'legacy',
    PKG_JS: () => {
      return pkg._jsLegacyFile;
    },
    WORK_DIR: () => {
      return pkg._scratch + "/legacy_tests";
    },
    JS_MIN: () => {
      return pkg._jsLegacyFile.replace('.js', '.min.js');
    },
    JS_DIR: () => {
      const s = pkg._jsLegacyFile;
      return s.substr(0, s.lastIndexOf('/') + 1);
    }
  });
  config.env.test_orig = createEnv({
    NODE_ENV: 'test',
    WORK_DIR: () => {
      return pkg._scratch + "/orig_tests";
    }
  });
  config.env.build_legacy = createEnv({
    NODE_ENV: 'legacy',
    PKG_JS: () => {
      return pkg._jsLegacyFile;
    },
    WORK_DIR: () => {
      return pkg._scratch + "/legacy_tests";
    },
    JS_MIN: () => {
      return pkg._jsLegacyFile.replace('.js', '.min.js');
    },
    JS_DIR: () => {
      const s = pkg._jsLegacyFile;
      return s.substr(0, s.lastIndexOf('/') + 1);
    },
    SCRATCH_BUILD: () => {
      return pkg._scratchLegacy.replace('{0}', pkg._scratch);
    }
  });
  //
  //#endregion
  grunt.initConfig(config);
  // #endregion
 
  // #region grunt require and load npm task
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks("grunt-tslint");
  grunt.loadNpmTasks("grunt-remove-comments");
  grunt.loadNpmTasks('grunt-env');
  grunt.registerTask('default', 'replace');
  grunt.loadNpmTasks('grunt-build-include');
  // #endregion
  
  //#region RegisterTask Misc
  grunt.registerTask('loadconst', 'Load constants', function () {
    for (const key in envDefault) {
      if (process.env.hasOwnProperty(key)) {
        grunt.config(key, process.env[key]);
      }
    }
  });

  grunt.registerTask('log-const', 'Logging constants', function () {
    for (const key in envDefault) {
      if (process.env.hasOwnProperty(key)) {
        grunt.log.writeln(key + ': ' + process.env[key].toString());
      }
    }
  });

   grunt.registerTask('default', [
    'build'
  ]);
  grunt.registerTask('envcheck', ['version_bump:build', 'env:dev', 'devtest']);
  grunt.registerTask('ver', () => {
    grunt.log.writeln('output from task ver');
    grunt.log.writeln("BUILD_VERSION:" + BUILD_VERSION);
    grunt.log.writeln("packageData.version:" + pkg.version);
  });
//#endregion

//#region build test start
  grunt.registerTask('build', [
    'env:build',
    'loadconst',
    'log-const',
    'clean:scratch',
    'clean:out',
    'clean:js',
    'tslint',
    'shell:tsc_es',
    'shell:rollup',
    'terser:main',
    'remove_comments:js',
    'copy:final'
  ]);

  grunt.registerTask('test', [
    'env:test',
    'loadconst',
    'log-const',
    'clean:test',
    'copy:test_dir',
    'copy:test_js',
    'copy:typo_us_en'
  ]);

  grunt.registerTask('start', [
    'shell:start'
  ]);
  grunt.registerTask('tests', [
    'test',
    'start'
  ]);
//#endregion

//#region original build test start
  grunt.registerTask('orig_test', [
    'env:test_orig',
    'loadconst',
    'clean:test',
    'copy:test_dir',
    'copy:test_js',
    'copy:typo_us_en',
    "clean:test_html",
    'clean:test_orig',
    'replace:test_orig',
    'replace:test_orig_flag',
    'copy:test_old_css',
    'copy:test_old_spelling'
  ]);

  grunt.registerTask('orig_start', [
    'shell:start_orig'
  ]);

  grunt.registerTask('orig', [
    'orig_test',
    'orig_start',

  ]);

  //#endregion

  //#region Legacy Build test start
  grunt.registerTask('legacy_build', [
    'env:build_legacy',
    'loadconst',
    'log-const',
    'clean:scratch',
    'clean:js',
    'tslint',
    'shell:typecheck',
    'shell:tsc_legacy',
    'build_include:legacy',
    'shell:rollup_legacy',
    'terser:legacy'
  ]);

  grunt.registerTask('legacy_test', [
    'env:test_legacy',
    'loadconst',
    'log-const',
    'clean:test',
    'copy:test_dir',
    'copy:test_js',
    'copy:typo_us_en'
  ]);

  grunt.registerTask('legacy_start', [
    'shell:start_legacy'
  ]);
  grunt.registerTask('legacy', [
    'legacy_build',
    'legacy_test',
    'legacy_start'
  ]);
//#endregion

//#region Site
  grunt.registerTask('site_build', [
    'env:site',
    'loadconst',
    'log-const',
    'clean:site',
    'copy:typo_us_en',
    'copy:test_dict',
    'copy:js_legacy_min',
    'copy:site_files'
  ]);
  grunt.registerTask('site_start', [
    'env:site',
    'loadconst',
    'log-const',
    'shell:start_site'
  ]);
//#endregion

//#region  help
  grunt.registerTask('help', 'Help', function () {
    const g = 'grunt';
    const sep = '-';
    const out = '"' + pkg._out + '"';
    const scratch = '"' + pkg._scratch + '"';
    const padding = 12;
    const nlPadding = padding + 8;
    const jsEs = '"' + pkg._jsEsFile + '"';
    const jsEsMin = '"' + pkg._jsEsFile.replace('.js', '.min.js') + '"';
    const jsLegacy = '"' + pkg._jsLegacyFile + '"';
    const jsLegacyMin = '"' + pkg._jsLegacyFile.replace('.js', '.min.js') + '"';
    const siteOut = '"' + pkg._scratch + '/site"';

    grunt.log.writeln(g, 'build'.padEnd(padding), sep, 'Builds the project and outputs to', out);
    grunt.log.writeln(''.padStart(nlPadding),'Also compiles', jsEs, 'and', jsEsMin);
    
    grunt.log.writeln(g, 'test'.padEnd(padding), sep, 'Compiles test harness in', scratch, 'sub directory from last build');
    grunt.log.writeln(g, 'start'.padEnd(padding), sep, 'Starts a local webserver and loads the test harness into browser');
    grunt.log.writeln(g, 'tests'.padEnd(padding), sep, 'Compiles and runs test (build, test, start)');

    grunt.log.writeln(g, 'legacy_build'.padEnd(padding), sep, 'Builds the project in legacy mode.');
    grunt.log.writeln(''.padStart(nlPadding),'Legacy mode compiles necessary code to run in older browsers. Much bigger output file.');
    grunt.log.writeln(''.padStart(nlPadding),'Compiles', jsLegacy, 'and', jsLegacyMin);
    
    grunt.log.writeln(g, 'legacy_start'.padEnd(padding), sep, 'Starts a local webserver and loads the legacy test harness into browser');
    grunt.log.writeln(g, 'legacy'.padEnd(padding), sep, 'Compiles and runs legacy test (legacy_build, legacy_start)');

    grunt.log.writeln(g, "orig_test".padEnd(padding), sep, 'Compiles test harness that loads Typo.js from original Git fork in', scratch, 'sub directory');
    grunt.log.writeln(g, 'orig_start'.padEnd(padding), sep, 'Starts a local webserver and loads the test harness for original Typo.js into browser');
    grunt.log.writeln(g, 'orig'.padEnd(padding), sep, 'Compiles and runs orig test (orig_test, orig_start)');

    grunt.log.writeln(g, "site_build".padEnd(padding), sep, 'Generate a site that can spell check. Outputs to ', siteOut, 'directory');
    grunt.log.writeln(g, 'site_start'.padEnd(padding), sep, 'Starts a local webserver and loads the site for spell checking.');
    grunt.log.writeln(''.padStart(nlPadding), 'Site is located in ', siteOut);
    
    // for unknown reason sometime terminal removes _ (underscore) on second last line.
    // this little hack gets around it
    // grunt.log.writeln('');
    grunt.log.writeln('');

  });
//#endregion
};