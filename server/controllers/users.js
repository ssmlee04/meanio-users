/*jshint -W079 */
"use strict";

/*
 * Module dependencies.
 */
var validator = require("validator");
var winston = require("winston");
var mongoose = require("mongoose");
var Promise = require("bluebird");
var User = mongoose.model("User");
var path = require("path");
var async = require("async");
var config = require("meanio").loadConfig();
var crypto = require("crypto");
var templates = require("../template");
var _ = require("lodash");
var sendMail = require(path.join(config.root, "/tools/sendmail"));
var opt = require("./../../../../tools/registertemplate")

var sendVerificationEmail = function(user) {
  var link = config.frontend + "/verify/" + user.emailsalt
  var mailOptions = opt(link, user.email)
  return sendMail(mailOptions);
};

var checkUserNotVerified = function(d) {
  if (!d || !d._id) {
    return Promise.reject("text-error-user");
  }
  if (d.verified) {
    return Promise.reject("text-error-user-already-verified");
  }
  return d;
};

var checkUserExist = function(d) {
  if (!d || !d._id) {
    return Promise.reject("text-error-user");
  }
  this.user = JSON.parse(JSON.stringify(d));
  return d;
};

/*
 * Auth callback
 */
exports.authCallback = function(req, res) {
  // res.json({success: true});
  res.redirect("/");
};

/*
 * Show login form
 */
exports.signin = function(req, res) {
  if (req.isAuthenticated()) {
    // return res.json({success: true});
    return res.redirect("/");
  }
  res.redirect("/login");
};


/*
 * Logout
 */
exports.signout = function(req, res) {
  req.logout();
  res.json({success: "successfully logged out."})
  // res.redirect("/");
};

/*
 * Session
 */
exports.session = function(req, res) {
  res.redirect("/");
};


/*
 * Create user
 */
exports.create = function(req, res) {
  var user = req.body;

  return Promise.bind({})
  .then(function() {
    return User.insert(user).bind(this).then(checkUserExist);
  }).then(function() {
    return sendVerificationEmail(this.user);
  }).then(function() {
    return _.omit(this.user, "hashed_password", "salt", "emailsalt")
  }).then(function(d) {
    res.json(d); 
  }).catch(function(err) {
    winston.error(err)
    if (err.name === 'ValidationError') {
      var str = err.errors[Object.keys(err.errors)[0]].message
      return res.json(400, {error: str});
    } else {
      return res.json(400, {error: err.message});
    }
  });
};

exports.edit = function(req, res) {
  if (!req.user || !req.user._id) {
    return res.json(500, {error: "this user does not exist"});
  }
  var userId = req.user._id.toString();
  var info = JSON.parse(JSON.stringify(req.body));

  info = _.omit(info, "_id", "email", "username", "salt", "hashed_password", "roles");

  return Promise.bind({})
  .then(function() {
    return User.edit(userId, info);
  }).then(function() {
    return res.status(200).json({success: "success updating your info asdads"});
  }).catch(function(err) {
    winston.error(err)
    return res.json(500, {error: "error updaintg user info"});
  });
};

// /*
//  * Get other user matrics
//  */
// exports.getAchievements = function(req, res) {
//   var userId = req.params.userId && req.params.userId.toString() || "";
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     return res.json(500, {error: "text-error-other-user"});
//   }

//   var Userachievement = mongoose.model("Userachievement");

//   return Userachievement.load(userId)
//   .then(function(d) {
//     return res.json(d || []);
//   });
// };

// exports.getMyAchievements = function(req, res) {
//   if (!req.user || !req.user._id) {
//     return res.json(500, {error: "text-error-user"});
//   }
//   var userId = req.user._id.toString();
//   var Userachievement = mongoose.model("Userachievement");
  
//   return Userachievement.load(userId)
//   .then(function(d) {
//     return res.json(d || []);
//   });
// };

exports.show = function(req, res) {
  return res.json(req.user);
};

// exports.editbasicinfo = function(req, res) {
//   if (!req.user || !req.user._id) {
//     return res.json(500, {error: "fu slas asinsf"});
//   }
//   var userId = req.user._id;
//   var info = JSON.parse(JSON.stringify(req.body));
//   info = _.pick(info, "cid", "sid", "zid", "address", "nationality", "currency", "currencyscale", "language", "birthdate", "name", "sex");

//   return User.edit(userId, info)
//   .then(function() {
//     res.json({success: "success updating your info basic info"});
//   }).catch(function(err) {
//     res.json(500, {error: "error updaintg asdoiahdd"});
//   });

// };

// exports.editaddinfo = function(req, res) {
//   if (!req.user || !req.user._id) {
//     return res.json(500, {error: "fu slas asinsf"});
//   }

//   var userId = req.user._id;
//   var user = JSON.parse(JSON.stringify(req.body));

//   user = _.pick(user, "cid", "sid", "zid", "address", "nationality", "currency", "currencyscale", "language");

//   return User.edit(userId, user)
//   .then(function() {
//     res.json({success: "success updating your info added info"});
//   }).catch(function(err) {
//     console.log(err.message);
//     res.json(500, {error: "error updaintg asdoiahdd"});
//   });
// };


exports.editAvatarBase64 = function(req, res) {
  if (!req.user) {
    return res.json(401, {error: "text-error-unauthroized"});
  }

  var user = JSON.parse(JSON.stringify(req.user))
  var userId = user._id
  var base64 = req.body.base64

  User.setAvatarBase64(userId, base64)
  .then(function() {
    res.json({success: "you have successfully set the avatar, grats.."})
  }).catch(function(err) {
    res.json(500, {error: err.message})
  })
}

exports.editpassword = function(req, res) {
  if (!req.user) {
    return res.json(401, {error: "text-error-unauthroized"});
  }

  var oldpassword = req.body.oldpassword;
  var password = req.body.password;
  var userId = req.user._id.toString();

  if (!oldpassword) oldpassword = undefined;

  return Promise.cast(User.findOne({_id: userId}).exec())
  .then(function(d) {
    if (d.authenticate(oldpassword) || !d.hashed_password) {
      d.password = password;
      d.save(function(err, d) {
        if (err) {
          return res.status(500).json({error: "text-error-update-password"});
        } else {
          return res.json({success: "text-success-update-password"});
        }
      });
    } else {
      return res.status(500).json({error: "text-error-old-password-incorrect"});
    }
  });
};

/*
 * Resets the password
 */

exports.resetpassword = function(req, res, next) {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  }, function(err, user) {
    if (err) {
      return res.status(400).json({
        msg: err
      });
    }
    if (!user) {
      return res.status(400).json({
        msg: "Token invalid or expired"
      });
    }
    req.assert("password", "Password must be between 8-20 characters long").len(8, 20);
    req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);
    var errors = req.validationErrors();
    if (errors) {
      return res.status(400).send(errors);
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.save(function(err) {
      req.logIn(user, function(err) {
        if (err) return next(err);
        return res.send({
          user: user,
        });
      });
    });
  });
};

/*
 * Callback for forgot password link
 */
exports.forgotpassword = function(req, res, next) {
  async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({
          $or: [{
            email: req.body.text
          }, {
            username: req.body.text
          }]
        }, function(err, user) {
          if (err || !user) return done(true);
          done(err, user, token);
        });
      },
      function(user, token, done) {
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      },
      function(token, user, done) {
        var mailOptions = {
          to: user.email,
          from: config.emailFrom
        };
        mailOptions = templates.forgot_password_email(user, req, token, mailOptions);
        sendMail(mailOptions);
        done(null, true);
      }
    ],
    function(err, status) {
      var response = {
        message: "Mail successfully sent",
        status: "success"
      };
      if (err) {
        response.message = "User does not exist";
        response.status = "danger";
      }
      res.json(response);
    }
  );
};

exports.resendConfirmation = function(req, res) {
  var email = req.body.email

  if (!validator.isEmail(email)) {
    return res.json(500, {error: 'text-error-email-invalid'})
  }

  return Promise.bind({})
  .then(function() {
    return Promise.cast(User.findOne({email: email}).exec()).bind(this).then(checkUserExist).then(checkUserNotVerified)
  }).then(function() {
    return sendVerificationEmail(this.user);
  }).then(function() {
    return res.json({
      success: true,
      message: "please check your email for the confirmation code."
    });
  }).catch(function(err) {
    winston.error(err)
    return res.json(400, {error: err.message});
  });
}

exports.verifyEmailSalt = function(req, res) {
  var emailsalt = req.params.emailsalt;
  
  return Promise.resolve()
  .then(function() {
    return User.verifyEmail(emailsalt)
  }).then(function(d) {
    return res.json({
      success: true,
      message: "successfully verified your account, please try to login again. "
    });
  }).catch(function(err) {
    winston.log(err)
    return res.json(500, {error: err.message});
  });
}
