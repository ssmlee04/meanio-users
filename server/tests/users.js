/*jshint -W079 */
'use strict'

/**
 * Module dependencies.
 */
var Promise = require('bluebird')
var _ = require('lodash')
var fs = require('fs-extra')
var path = require('path')
var should = require('should')
var randomstring = require('randomstring')
var mongoose = require('mongoose')
var User = mongoose.model('User')
var config = require('meanio').loadConfig()
// var testutils = require(path.join(config.root, '/config/testutils'))
// var utils = require(path.join(config.root, '/config/utils'))
var genUser = function() {
  return {
    name: randomstring.generate(),
    email: randomstring.generate() + '@gmail.com'
  }
}

/**
 * Globals
 */
var users = []
var savedusers = []
var numRepeat = 5

/**
 * Test Suites
 */
describe('<Unit Test>', function() {
  this.timeout(10000)

  describe('Model User:', function() {

    before(function(done) {
      return Promise.resolve().delay(2000)
      .then(function() {
        return Promise.cast(User.remove().exec())
      }).then(function() {
        var user = genUser()
        users.push(user)
        user = genUser()
        users.push(user)
      }).then(function() {
        done()
      }).catch(function(err) {
        should.not.exist(err)
        done()
      })
    })

    describe('Method Save', function() {
      it('should begin without the test user', function(done) {
        return Promise.resolve(users)
        .map(function(user) {
          return Promise.cast(User.find({email: user.email}).exec())
          .then(function(d) {
            d.should.have.length(0)
          })
        }).then(function() {
          done()
        }).catch(function(err) {
          should.not.exist(err)
        })
      })

      it('should check that roles are assigned and created properly (insert)', function(done) {
        return Promise.resolve(users)
        .map(function(user) {
          return User.insert(user)
          .then(function(d) {
            d.hasRole('authenticated').should.equal(false)
            d.hasRole('admin').should.equal(false)
            d.authenticate(user.password).should.equal(true)
            d = JSON.parse(JSON.stringify(d))
            d.roles.should.have.length(1)
            d.hashed_password.should.not.have.length(0)
            d.emailsalt.should.not.have.length(0)
            d.salt.should.not.have.length(0)
            savedusers.push(d)
          })
        }).then(function() {
          done()
        }).catch(function(err) {
          should.not.exist(err)
          done()
        })
      })

      it('should fail when same email (insert)', function(done) {
        return Promise.resolve(_.range(numRepeat * 10))
        .map(function() {
          var user = genUser({email: users[0].email})
          return Promise.cast(User.insert(user))
          .then(function() {
            should.not.exist(true)
          }).catch(function(err) {
            'expected true to not exist'.should.not.equal(err.message)
            should.exist(err)
          })
        }).then(function() {
          done()
        }).catch(function(err) {
          should.not.exist(err)
          done()
        })
      })

    })

    describe('Method update', function() {
      it('should be able to update correctly (edit)', function(done) {
        var user = savedusers[0]
        var address = randomstring.generate()
        return User.edit(user._id, {address: address})
        .then(function(d) {
          d = JSON.parse(JSON.stringify(d))
          should.exist(d)
          d._id.should.be.exactly(user._id)
          d.address.should.be.exactly(address)
          done()
        }).catch(function(err) {
          should.not.exist(err)
          done()
        })
      })

      it('should fail to update hashed_password using this method (edit)', function(done) {
        var hashed_password = 'bristow'
        var user = savedusers[0]
        return User.edit(user._id, {hashed_password: hashed_password})
        .then(function() {
          return Promise.cast(User.findOne({_id: user._id}).exec())
        }).then(function(d) {
          d = JSON.parse(JSON.stringify(d))
          d.hashed_password.should.not.equal(hashed_password)
          done()
        })
      })

      it('should fail to update roles using this method (edit)', function(done) {
        var user = savedusers[0]
        var roles = ['sydney']
        return User.edit(user._id, {roles: roles})
        .then(function(d) {
          d = JSON.parse(JSON.stringify(d))
          d.roles.indexOf(roles[0]).should.equal(-1)
          done()
        })
      })

      it('should fail to update emailsalt using this method (edit)', function(done) {
        var user = savedusers[0]
        var emailsalt = 'bristow'
        return User.edit(user._id, {emailsalt: emailsalt})
        .then(function() {
          return Promise.cast(User.findOne({_id: user._id}).exec())
        }).then(function(d) {
          d = JSON.parse(JSON.stringify(d))
          d.emailsalt.should.not.equal(emailsalt)
          done()
        })
      })

      it('should fail to update verified using this method (edit)', function(done) {
        var user = savedusers[0]
        var verified = true
        return User.edit(user._id, {verified: verified})
        .then(function() {
          return Promise.cast(User.findOne({_id: user._id}).exec())
        }).then(function(d) {
          d = JSON.parse(JSON.stringify(d))
          should(d.verified).not.equal(verified)
          done()
        })
      })
    })


    describe('Method avatars', function() {

      it('should set user avatar when url and userid are correct (setAvatarUrl)', function(done) {
        var user = savedusers[0]
        var url = 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_116x41dp.png'
        return User.setAvatarUrl(user._id, url)
        .then(function(d) {
          done()
        }).catch(function(err) {
          should.not.exist(err)
          done()
        })
      })

      it('should set user avatar when local path and userid are correct (setAvatarPath)', function(done) {
        var user = savedusers[0]
        var pa = path.join(config.root, 'packages/system/server/assets/google.jpg')
        var pa2 = path.join(config.root, 'public/misc/google.jpg')
        fs.copySync(pa, pa2)
        return User.setAvatarPath(user._id, pa2)
        .then(function() {
          done()
        }).catch(function(err) {
          console.log(err)
          should.not.exist(err)
          done()
        })
      })

      it('should fail on invalid reltive path (setAvatarPath)', function(done) {
        var user = savedusers[0]
        var pa2 = './../../public/misc/weirdavatar.jpg'
        return User.setAvatarPath(user._id, pa2)
        .catch(function(err) {
          should.exist(err)
          done()
        })
      })

      it('should fail on file not exist (setAvatarPath)', function(done) {
        var user = savedusers[0]
        var pa2 = path.join(config.root, 'public/misc/avatar____.jpg')
        return User.setAvatarPath(user._id, pa2)
        .catch(function(err) {
          should.exist(err)
          done()
        })
      })

      it('should be able to confirm email and verify user (verifyEmail)', function(done) {
        var user = savedusers[0]
        var emailsalt
        return Promise.resolve()
        .then(function() {
          return Promise.cast(User.findOne({_id: user._id}).exec()).then(function(d) {
            should.not.exist(d.verified)
            emailsalt = d.emailsalt
          })
        }).then(function() {
          return User.verifyEmail(emailsalt)
        }).then(function() {
          return User.load(user._id).then(function(d) {
            d.verified.should.equal(true)
          })
        }).then(function() {
          done()
        })
      })

      it('should be able to add roles (addRole)', function(done) {
        var user = savedusers[0]

        return Promise.resolve()
        .then(function() {
          return User.load(user._id).then(function(d) {
            d.roles.should.have.length(1)
          })
        }).then(function() {
          return User.addRole(user._id, 'apple')
        }).then(function() {
          return User.addRole(user._id, 'bear')
        }).then(function() {
          return User.addRole(user._id, 'crane')
        }).then(function() {
          return User.addRole(user._id, 'apple')
        }).then(function() {
          return User.load(user._id).then(function(d) {
            d.roles.should.have.length(4)
            d.roles.indexOf('apple').should.be.above(-1)
            d.roles.indexOf('bear').should.be.above(-1)
            d.roles.indexOf('crane').should.be.above(-1)
          })
        }).then(function() {
          done()
        })
      })

      it('should be able to remove roles (removeRole)', function(done) {
        var user = savedusers[0]

        return Promise.resolve()
        .then(function() {
          return User.addRole(user._id, 'apple')
        }).then(function() {
          return User.addRole(user._id, 'bear')
        }).then(function() {
          return User.addRole(user._id, 'crane')
        }).then(function() {
          return User.removeRole(user._id, 'apple')
        }).then(function() {
          return User.removeRole(user._id, 'bear')
        }).then(function() {
          return User.load(user._id).then(function(d) {
            d.roles.should.have.length(2)
            d.roles.indexOf('apple').should.equal(-1)
            d.roles.indexOf('bear').should.equal(-1)
            d.roles.indexOf('crane').should.be.above(-1)
          })
        }).then(function() {
          done()
        })
      })
    })

    describe('Method delete', function() {
      it('should be able to delete (delete)', function(done) {
        var user = savedusers[0]

        return User.delete(user._id)
        .then(function() {
          return Promise.cast(User.findOne({_id: user._id}).exec())
        }).then(function(d) {
          d = JSON.parse(JSON.stringify(d))
          should.not.exist(d)
          done()
        })
      })
    })

    after(function(done) {

      /** Clean up user objects
       * un-necessary as they are cleaned up in each test but kept here
       * for educational purposes */

      return Promise.resolve(savedusers)
      .map(function(user) {
        return Promise.cast(User.remove({_id: user._id}).exec())
      }).then(function() {
        return Promise.cast(User.find().lean().exec())
        .then(function(d) {
          d.should.have.length(0)
        })
      }).then(function() {
        done()
      }).catch(function(err) {
        should.not.exist(err)
      })
    })
  })
})
