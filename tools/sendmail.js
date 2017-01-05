/*jshint -W079 */
'use strict'

var config = require('meanio').loadConfig()
var nodemailer = require('nodemailer')

var smtpTransport = nodemailer.createTransport('SMTP', {
  service: 'Gmail',
  auth: {
    XOAuth2: {
      user: config.mailer.email, // Your gmail address.
      clientId: config.mailer.clientId,
      clientSecret: config.mailer.clientSecret,
      refreshToken: config.mailer.refreshToken
    }
  }
})

function sendMail(mailOptions) {
  smtpTransport.sendMail(mailOptions, function(err, response) {
    if (err) {
      console.log(err)
      return err
    }
    smtpTransport.close()
  })
}

module.exports = exports = sendMail