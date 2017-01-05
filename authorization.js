"use strict";

/*
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.json(401, {error: "text-error-user-unauthorized"});
  }
  next();
};

/*
 * Generic require Admin routing middleware
 * Basic Role checking - future release with full permission system
 */
exports.requiresAdmin = function(req, res, next) {
  if (!req.isAuthenticated() || !(req.user.hasRole("admin") || req.user.hasRole("root"))) {
    return res.json(401, {error: "text-error-user-not-admin"});
  }
  next();
};

/*
 * Generic require Admin routing middleware
 * Basic Role checking - future release with full permission system
 */
exports.requiresRootAdmin = function(req, res, next) {
  if (!req.isAuthenticated() || !req.user.hasRole("root")) {
    return res.json(401, {error: "text-error-user-not-root"});
  }
  next();
};
