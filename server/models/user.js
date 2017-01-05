/*jshint -W079 */
"use strict";

/**
 * Module dependencies.
 */
var Promise = require("bluebird");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var _ = require("lodash");
var path = require("path");
var fs = require("fs");
var config = require("meanio").loadConfig();
var userplugin = require("./../plugins/user");
var validator = require("validator");

/**
 * Validations
 */
var validatePresenceOf = function(value) {
  // If you are authenticating by any of the oauth strategies, don"t validate.
  return (this.provider && this.provider !== "local") || (value && value.length);
};

var validateUniqueEmail = function(value, callback) {
  var User = mongoose.model("User");
  User.find({
    $and: [{
      email: value
    }, {
      _id: {
        $ne: this._id
      }
    }]
  }, function(err, user) {
    callback(err || user.length === 0);
  });
};

/**
 * User Schema
 */

var baseSchema = {
  name: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    // required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Please enter a valid email"],
    validate: [validateUniqueEmail, "text-error-email-in-use"]
  },
  token: {type: String},
  avatar: {type: String},
  image: {type: String},
  phone: {type: String},
  address: {type: String},
  nationality: {type: Number},
  nation: {type: String},
  sex: {type: Number}, // male 1, female 2
  hashed_password: {
    type: String,
    validate: [validatePresenceOf, "text-error-password-length"]
  },
  provider: {
    type: String,
    default: "local"
  },
  salt: {type: String},
  birthdate: {type: Date},
  roles: { type: Array, default: []},
  emailsalt: {type: String},
  verified: {type: Boolean},
  facebook: {},
  google: {},
  github: {},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  wt: {
    type: String
  },
  wt_expire: {
    type: Date
  },
}

var extraSchema = {}
var extraStatics = {}

var fileExist = fs.existsSync(path.join(__dirname, "./../../../../packages/users/server/models/extra.js"))
if (fileExist) {
  extraSchema = require(path.join(__dirname, "./../../../../packages/users/server/models/extra.js")).schema
  extraStatics = require(path.join(__dirname, "./../../../../packages/users/server/models/extra.js")).statics
}

var UserSchema = new Schema(_.extend({}, baseSchema, extraSchema), {
  collection: "oc_user",
  timestamps: true
});

UserSchema.plugin(userplugin);

_.extend(UserSchema.statics, extraStatics)

UserSchema.statics.insert = function(user) {
  user.provider = "local";
  user.roles = ["user"];
  return this.insertUserInfo(user);
};

UserSchema.statics.verifyEmail = function(emailsalt) {
  var that = this;
  if (!emailsalt) {
    return Promise.reject("code is error");
  }
  return Promise.cast(that.findOne({emailsalt: emailsalt}).exec())
  .then(function(d) {
    if (!d) {
      return Promise.reject("this code is wrong, please try again");
    } else if (d && d._id) {
      return Promise.cast(that.update({_id: d._id}, {emailsalt: "", verified: 1}).exec());
    } else {
      return Promise.reject("very weird error");
    }
  })
};

UserSchema.statics.addRole = function(userId, role) {
  var that = this;
  if (!validator.isAlphanumeric(role)) {
    return Promise.reject("failed to add this role: " + role);
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return Promise.reject("user id incorrect");
  }
  return Promise.cast(that.update({_id: userId, roles: {$nin : [role]}}, {$push : {roles : role}}).exec());
};

UserSchema.statics.removeRole = function(userId, role) {
  var that = this;
  if (!validator.isAlphanumeric(role)) {
    return Promise.reject("failed to add this role: " + role);
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return Promise.reject("user id incorrect");
  }
  return Promise.cast(that.update({_id: userId, roles: {$in : [role]}}, {$pull : {roles : role}}).exec());
};

mongoose.model("User", UserSchema);
