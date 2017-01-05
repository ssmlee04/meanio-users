'use strict'

var path = require('path')

module.exports = {
  root: path.normalize(__dirname + '/../..'),

  http: {
    port: 3005
  },

  uploadFolder: 'public'
}
