/*jshint -W079 */
"use strict";

// User routes use users controller
var users = require("../controllers/users");
var _ = require("lodash");
var mongoose = require("mongoose");
var config = require("meanio").loadConfig();
var cors = require("cors");
var corsOptions = {
  allowedHeaders: "X-Requested-With",
  origin: config.frontendServer,
  credentials: true
};

module.exports = function(MeanUser, app, auth, database, passport) {

  app.route("/apis/v1/users/me")
    .put(users.edit);

  app.route("/apis/v1/users/editavatarbase64")
    .post(users.editAvatarBase64);

  app.route("/apis/v1/users/editpassword")
    .put(users.editpassword)

  app.route("/apis/v1/auth/logout")
    .get(users.signout); 

  app.route("/apis/v1/auth/register")
    .post(cors(corsOptions), users.create);

  app.route("/apis/v1/auth/forgot-password")
    .post(users.forgotpassword);

  app.route("/apis/v1/auth/reset/:token")
    .post(users.resetpassword);

  app.route("/apis/v1/auth/resendconfirmation")
    .post(users.resendConfirmation);

  app.route("/apis/v1/auth/verifyemail/:emailsalt(*)")
    .get(users.verifyEmailSalt);
  
  app.route("/apis/v1/auth/loggedin")
    .get(cors(corsOptions), function(req, res) {
      res.send(req.isAuthenticated() ? req.user : "0");
    });

  app.route("/apis/v1/auth/login")
    .post(cors(corsOptions), function(req, res, next) {
      passport.authenticate("user", {}, function(err, user, message) {
        if (err) {
          return res.json(500, {error: err.toString()});
        } else if (message) {
          return res.json(500, {error: message.message.toString()});
        }

        req.logIn(user, function(err) {
          if (err) { return next(err); }
          user = JSON.parse(JSON.stringify(user));
          user = _.omit(user, "hashed_password", "salt", "emailsalt");
          return res.send({
            user: user,
            redirect: (req.user.roles.indexOf("admin") !== -1) ? req.get("referer") : false
          });
        });

      })(req, res, next)
    });
  
  app.route("/apis/v1/auth/facebook/token")
    .post(cors(corsOptions), function(req, res, next) {
      passport.authenticate("facebook-token", {}, function(err, user, message) {
        if (err) {
          return res.json(500, {error: err.toString()});
        } else if (message) {
          return res.json(500, {error: message.message.toString()});
        }

        req.logIn(user, function(err) {
          if (err) { return next(err); }
          user = JSON.parse(JSON.stringify(user));
          user = _.omit(user, "hashed_password", "salt", "emailsalt");
          return res.send({
            user: user,
            redirect: (req.user.roles.indexOf("admin") !== -1) ? req.get("referer") : false
          });
        });
      })(req, res, next)
    });

  app.route("/apis/v1/auth/google/token")
    .post(cors(corsOptions), function(req, res, next) {
      passport.authenticate("google-token", {}, function(err, user, message) {
        if (err) {
          return res.json(500, {error: err.toString()});
        } else if (message) {
          return res.json(500, {error: message.message.toString()});
        }

        req.logIn(user, function(err) {
          if (err) { return next(err); }
          user = JSON.parse(JSON.stringify(user));
          user = _.omit(user, "hashed_password", "salt", "emailsalt");
          return res.send({
            user: user,
            redirect: (req.user.roles.indexOf("admin") !== -1) ? req.get("referer") : false
          });
        });
      })(req, res, next)
    });

 
  app.route("/apis/v1/auth/google")
    .get(passport.authenticate("google", {
      failureRedirect: "/auth/login",
      // scope: "https://www.googleapis.com/auth/plus.login"
      scope: "profile email"
      // scope: ["profile", "email"]
    }), users.signin);

  app.route("/apis/v1/auth/google/callback")
    .get(cors(corsOptions), function(req, res, next) {
      passport.authenticate("google", {
        // failureRedirect: "/auth/login"
      }, function(err, user, message) {
        if (err) {
          return res.json(500, {error: err.toString()});
        } 
        // else if (message && message.message) {
        //   return res.json(500, {error: message.message.toString()});
        // }

        req.logIn(user, function(err) {
          if (err) { return next(err); }
          user = JSON.parse(JSON.stringify(user));
          user = _.omit(user, "hashed_password", "salt", "emailsalt");
          return res.send({
            user: user,
            redirect: (req.user.roles.indexOf("admin") !== -1) ? req.get("referer") : false
          });
        });
      })(req, res, next)
    });
};
