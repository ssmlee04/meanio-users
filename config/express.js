'use strict'
/**
 * Module dependencies.
 */
var morgan = require('morgan')
var session = require('express-session')

module.exports = function(app, db) {

  app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  }))

  // Only use logger for development environment
  // app.use(morgan('dev'))

  app.set('showStackError', true)

  // set .html as the default extension
  app.set('view engine', 'html')
}
