/*jshint -W079 */
"use strict";

var path = require("path");
var mongoose = require("mongoose");
var LocalStrategy = require("passport-local").Strategy;
var GoogleTokenStrategy = require("passport-google-token").Strategy;
var FacebookTokenStrategy = require("passport-facebook-token").Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var User = mongoose.model("User");
var config = require("meanio").loadConfig();
var Promise = require("bluebird");
var _ = require("lodash")
var randomstring = require("randomstring");

module.exports = function(passport) {
  
  // Serialize the user id to push into the session
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  // Deserialize the user object based on a pre-serialized token
  // which is the user id
  passport.deserializeUser(function(id, done) {
    return Promise.cast(User.findOne({_id: id}, "-salt -hashed_password").exec())
    .then(function(d) {
      done(null, d);
    }).catch(function(err) {
      done(err, null);
    });
  });

  // Use local strategy
  passport.use("user", new LocalStrategy({
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true
  },
  function(req, email, password, done) {
    User.findOne({
      email: email, roles: {$in : ["user"]}
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: "text-unknown-user"
        });
      }
      if (!user.authenticate(password)) {
        return done(null, false, {
          message: "text-invalid-password"
        });
      }
      if (!user.verified) {
        return done(null, false, {
          message: "text-error-email-not-verified"
        });
      }
      if (!user.wt || !user.wt_expire || user.wt_expire < Date.now()) {
        user.wt = randomstring.generate(48)
        user.wt_expire = Date.now() + 86400 * 1000
        user.save()
      }
      return done(null, user);
    });
  }));

  passport.use("facebook-token", new FacebookTokenStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    User.findOne({"facebook.id": profile.id }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (user && user.wt && user.wt_expire > Date.now()) {
        return done(err, user);
      }
      if (user) {
        user.wt = randomstring.generate(48)
        user.wt_expire = Date.now() + 86400 * 1000
        user.save()
        return done(err, user);
      }
      var u = {
        name: profile.displayName,
        provider: "facebook",
        facebook: _.extend(profile._json, {profile: JSON.parse(JSON.stringify(profile))}),
        roles: ["authenticated"],
        image:  profile.photos && profile.photos[0].value,
        avatar:  profile.photos && profile.photos[0].value,
      };
      var fakeemail = (mongoose.Types.ObjectId() + "@gmail.com");
      if (profile.emails && profile.emails[0] && profile.emails[0].value) {
        u.email = profile.emails[0].value
      } else {
        u.email = fakeemail;
      }
      if (profile.username || profile.emails && profile.emails[0].value.split("@")[0]) {
        u.username = profile.username || profile.emails && profile.emails[0].value.split("@")[0];
      } else {
        u.username = fakeemail;
      }
      u.uploadimg = profile.photos && profile.photos[0].value;
      u.lon = req.body.lon
      u.lat = req.body.lat
      
      User.insertFromFacebook(u)
      .then(function(d) {
        return done(null, d);
      }).catch(function(err) {
        return done(null, false, {message: "Facebook login failed, email already used by another user"});
      });
    });
  }));

  
  passport.use("google-token", new GoogleTokenStrategy({
    clientID: config.google.clientID,
    clientSecret: config.google.clientSecret,
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    User.findOne({"google.id": profile.id }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (user && user.wt && user.wt_expire > Date.now()) {
        return done(err, user);
      }
      if (user) {
        user.wt = randomstring.generate(48)
        user.wt_expire = Date.now() + 86400 * 1000
        user.save()
        return done(err, user);
      }
      var u = {
        name: profile.displayName,
        provider: "google",
        google: _.extend(profile._json, {profile: JSON.parse(JSON.stringify(profile))}),
        roles: ["authenticated"],
        image:  profile.photos && profile.photos[0].value,
        avatar:  profile.photos && profile.photos[0].value,
      };
      var fakeemail = (mongoose.Types.ObjectId() + "@gmail.com");
      if (profile.emails && profile.emails[0] && profile.emails[0].value) {
        u.email = profile.emails[0].value
      } else {
        u.email = fakeemail;
      }
      if (profile.username || profile.emails && profile.emails[0].value.split("@")[0]) {
        u.username = profile.username || profile.emails && profile.emails[0].value.split("@")[0];
      } else {
        u.username = fakeemail;
      }
      u.uploadimg = profile.photos && profile.photos[0].value;
      u.lon = req.body.lon
      u.lat = req.body.lat
      
      var name = Moniker.choose() + "-" + Moniker.choose()
      name = name.slice(name.indexOf("-") + 1)
      u.nickname = name

      User.insertFromGoogle(u)
      .then(function(d) {
        return done(null, d);
      }).catch(function(err) {
        return done(null, false, {message: "Google login failed, email already used by another user"});
      });
    });
  }));

  passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
      passReqToCallback: true
    },
    function(req, accessToken, refreshToken, profile, done) {
      User.findOne({"google.id": profile.id }, function (err, user) {
      if (err) {
        return done(err);
      }
      if (user && user.wt && user.wt_expire > Date.now()) {
        return done(err, user);
      }
      if (user) {
        user.wt = randomstring.generate(48)
        user.wt_expire = Date.now() + 86400 * 1000
        user.save()
        return done(err, user);
      }
      var u = {
        name: profile.displayName,
        email: profile.emails[0].value,
        username: profile.emails[0].value,
        provider: 'google',
        google: profile._json,
        roles: ['authenticated'],
        image:  profile.photos && profile.photos[0].value,
        avatar:  profile.photos && profile.photos[0].value
      };
      var fakeemail = (mongoose.Types.ObjectId() + "@gmail.com");
      if (profile.emails && profile.emails[0] && profile.emails[0].value) {
        u.email = profile.emails[0].value
      } else {
        u.email = fakeemail;
      }
      if (profile.username || profile.emails && profile.emails[0].value.split("@")[0]) {
        u.username = profile.username || profile.emails && profile.emails[0].value.split("@")[0];
      } else {
        u.username = fakeemail;
      }
      u.uploadimg = profile.photos && profile.photos[0].value;
      u.lon = req.body.lon
      u.lat = req.body.lat
      
      var name = Moniker.choose() + "-" + Moniker.choose()
      name = name.slice(name.indexOf("-") + 1)
      u.nickname = name

      User.insertFromFacebook(u)
      .then(function(d) {
        return done(null, d);
      }).catch(function(err) {
        return done(null, false, {message: "Google+ login failed, email already used by other user"});
      });
    });
    }
  ));


  return passport;
};
