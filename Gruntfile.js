const grunt = require('grunt')

// image ratios
const ratio = 4 / 3

grunt.initConfig({
  responsive_images: {
    dev: {

      options: {
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
        dest: 'img/',
        cwd: 'img-raw/'
      }]
    }
  },

  clean: {
    dev: {
      src: 'img/'
    }
  }
});

grunt.loadNpmTasks('grunt-responsive-images');
grunt.loadNpmTasks('grunt-contrib-clean');
grunt.registerTask('default', ['clean', 'responsive_images']);