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
    return User.findById(decoded.id)
  })
  .then(currentUser => {
    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exists.',
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
    // GRANT ACCESS TO PROTECTED Admin ROUTE
    if(currentUser.role !== 'admin') {
      return next(
        new AppError('You are not an admin!', 401)
      );
    }

    req.user = currentUser;
    //req.token = token;
    //res.locals.user = currentUser;
    next();
  })
  .catch(err => next(err))
  
};

//TODO: ne znam zasto bi sve ovo morali jer vecinu logike odradi is-auth midlver i on daje usera koga je nasao. Mogli bi to da iskoristiomo pa da napravimo da se ovaj midlver nadoveze na taj i samo da proverimo da li je user role===admin