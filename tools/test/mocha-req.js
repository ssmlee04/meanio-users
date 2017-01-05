'use strict'

process.env.NODE_ENV = 'test'

var appRoot = __dirname + '/../../'

var fs = require('fs-extra')
var path = require('path')
// fs.mkdirSync(path.join(appRoot, './public'))
fs.copySync(path.join(appRoot, './server/controllers'), path.join(appRoot, './packages/meanio-users/server/controllers'))
fs.copySync(path.join(appRoot, './server/routes'), path.join(appRoot, './packages/meanio-users/server/routes'))
fs.copySync(path.join(appRoot, './server/template.js'), path.join(appRoot, './packages/meanio-users/server/template.js'))
fs.copySync(path.join(appRoot, './app.js'), path.join(appRoot, './packages/meanio-users/app.js'))
fs.copySync(path.join(appRoot, './authorization.js'), path.join(appRoot, './packages/meanio-users/authorization.js'))
fs.copySync(path.join(appRoot, './passport.js'), path.join(appRoot, './packages/meanio-users/passport.js'))
fs.copySync(path.join(appRoot, './pack.json'), path.join(appRoot, './packages/meanio-users/pack.json'))

require("meanio").serve({}, function (app) {
  console.log('Test server startup')
  fs.removeSync(path.join(appRoot, './packages'))
})

require('meanio/lib/core_modules/module/util').preload(appRoot + '/server', 'model')
