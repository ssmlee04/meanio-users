'use strict'

module.exports = {
  server: 'http://localhost:3005',
  mongodb: {
    db: 'mongodb://127.0.0.1:27017/meanio-test',
    dbOptions: {
      user: '',
      pass: ''
    }
  },
  aws: {
    key: process.env.AWS_ACCESS_KEY || '',
    secret: process.env.AWS_ACCESS_SECRET || '',
    region: process.env.AWS_REGION || 'us-west-2',
    bucket: process.env.AWS_S3_BUCKET || ''
  },
  facebook: {
    clientID: '1474296272850216',
    clientSecret: '710431d95b1e60745eaf733cf1bb266e',
    callbackURL: 'http://localhost:3000/auth/facebook/callback'
  },
  twitter: {
    clientID: 'DEFAULT_CONSUMER_KEY',
    clientSecret: 'CONSUMER_SECRET',
    callbackURL: 'http://localhost:3000/auth/twitter/callback'
  },
  github: {
    clientID: 'DEFAULT_APP_ID',
    clientSecret: 'APP_SECRET',
    callbackURL: 'http://localhost:3000/auth/github/callback'
  },
  google: {
    clientID: 'DEFAULT_APP_ID',
    clientSecret: 'APP_SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  linkedin: {
    clientID: '77kmdipuvibskh',
    clientSecret: 'szsD6YjFaEzleZv4',
    callbackURL: 'http://localhost:3000/auth/linkedin/callback'
  },
  mailer: {
    service: "Gmail", // Gmail, SMTP
    auth: {
      user: process.env.MAIL_AUTH_USER || "",
      pass: process.env.MAIL_AUTH_PASS || ""
    }
  },
  debug: true,
  aggregate: true,
  mongoose: {
    debug: false
  },
  app: {
    name: ''
  }
}
