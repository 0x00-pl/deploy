let path = require('path')

module.exports = {
  sfct_vue: {
    git: 'https://github.com/0x00-pl/sfct_vue.git',
    config_dict: {
      api_server: {
        api_server: 'https://www.0x00-pl.site'
      },
      mongodb: {
        mongourl: 'mongodb://localhost/test'
      }
    }
  },
  mongodb: {
    config_dict: {},
    post_deploy: 'echo install mongodb'
  },
  nginx_ssl_static: {
    git: 'https://github.com/0x00-pl/nginx_ssl_static.git',
    config_dict: {
      static_root: path.join(__dirname, 'sfct_vue/dist')
    },
    post_deploy: 'cat install.sh'
  }
}
