"use strict";

/*jshint esversion: 8 */
/* jshint node: true */

const auth = require("basic-auth");
const { User } = require("../models");
const bcrypt = require("bcrypt");

// Middleware to authenticate the request

exports.authenticateUser = async (req, res, next) => {
  let message;

  const credentials = auth(req);

  if (credentials) {
    try {
      const user = await User.findOne({
        where: { emailAddress: credentials.name },
      });
      if (user) {
        const authenticated = bcrypt.compareSync(
          credentials.pass,
          user.password
        );
        if (authenticated) {
          console.log(
            `Authentication success for username: ${user.emailAddress}`
          );

          // Store the user on the Request object.
          req.currentUser = user;
        } else {
          message = `Authentication failed for username: ${user.emailAddress}`;
        }
      } else {
        message = `User was not found for username: ${credentials.emailAddress}`;
      }g
    } catch (error) {
      message = error.message;
    }
  } else {
    message = "Authentication header not found";
  }

  if (message) {
    console.warn(message);
    res.status(401).json({ message: "Access Denied" });
  } else {
    next();
  }
};
