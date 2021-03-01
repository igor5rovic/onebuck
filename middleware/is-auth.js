const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AppError = require('./../utils/appError');

module.exports = async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } /*else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }*/ //necemo da radimo sa kukijima zbog csrf zastite

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  let decodedToken;
  // 2) Verification token
  //const decoded = jwt.verify(token, process.env.JWT_SECRET)

  /* try {
    decodedToken = jwt.verify(token, 'somesupersecretsecret');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }*/
  promisify(jwt.verify)(token, process.env.JWT_SECRET).then(decoded => {
    // 3) Check if user still exists
    decodedToken = decoded;
    //const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
    return User.findById(decoded.id).select('+spending')
  })
  .then(currentUser => {
    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist.',
          401
        )
      );
    }
    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decodedToken.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
    }
    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    //req.token = token;
    //res.locals.user = currentUser;
    next();
  })
  .catch(err => next(err))
  
};

/*
// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};
*/