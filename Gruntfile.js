const grunt = require('grunt')

// image ratios
const ratio = 4 / 3

grunt.initConfig({

  cwebp: {
    images: {
      options: {
        arguments: [ '-q', 50 ],
        concurrency: 20
      },
      files: {
        'img/': [
          'img-sized/*.jpg'
        ]
      }
    }
  },

  responsive_images: {
    dev: {

      options: {
        engine: 'gm',
        sizes: [

          {
            name: 's',
            width: 350,
            height: 350 / ratio,
            suffix: '_1x',
          },

          {
            name: 'm',
            width: 700,
            height: 700 / ratio,
            suffix: '_2x',
            quality: 80
          },

        ]
      },

      files: [{
        expand: true,
        src: '**/*.{jpg,gif,png}',
        dest: 'img-sized/',
        cwd: 'img-raw/'
      }]
    }
  },

  clean: {
    dev: {
      src: '{img-sized/,img/}'
    }
  }
});

grunt.loadNpmTasks('grunt-responsive-images');
grunt.loadNpmTasks('grunt-contrib-clean');
grunt.loadNpmTasks('grunt-webp-compress');
grunt.registerTask('default', ['clean', 'responsive_images', 'cwebp']);
