const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('./../utils/email');
//FIXME: Srediti email.js fajl da radi kako treba

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  /*res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https', //secure moze biti samo ako idemo preko https
  });*/ //necemo da radimo sa kukijima zbog csrf zastite

  // Remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.checkUsername = async (req, res, next) => {
  try {
    const usernameTry = req.body.username;
    const user = await User.findOne({ username: usernameTry });
    if (user) {
      return res.status(200).json({ data: 'isTaken' });
    } else {
      return res.status(200).json({ data: 'isAvailable' });
    }
  } catch (err) {
    next(err);
  }
};

/*exports.signup = (req, res, next) => {
  let newUser;
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return next(new AppError('Username taken', 401));
      }
      return User.create({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        address: req.body.address,
      });
    })
    .then((user) => {
      newUser = user;
      try {
        //TODO:ovaj deo mi je smunjiv i treba verovatno da se preuredi kao i kod password reseta
        new Email(user).sendWelcome();
      } catch (err) {
        console.log(err);
      }
      createSendToken(newUser, 201, req, res);
    })
    .catch((err) => next(err);
};*/

exports.signup = catchAsync(async (req, res, next) => {
  //ovaj deo nije morao zato sto ne frontendu proveravamo da li je username slobodan ili vec postoji pomocu checkUsername fje iz ovog fajla
  /*
  const user = await User.findOne({ username: req.body.username });
  if (user) {
    return next(new AppError('Username taken', 401));
  }*/
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return next(new AppError('Email already in use', 401));
  }
  const newUser = await User.create({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    address: req.body.address,
  });
  try {
    //FIXME:ovaj deo mi je smunjiv i treba verovatno da se preuredi kao i kod password reseta
    new Email(newUser).sendWelcome(); //ne mora await (da cekamo) jer i nije toliko bitno da li ce stvarno da posalje mejl, da ne bi kocili aplikaciju
  } catch (err) {
    console.log(err);
  }
  createSendToken(newUser, 201, req, res);
});

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  // isto kao:
  //const email = req.body.email;
  //const password = req.body.password;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
    // 3) If everything ok, send token to client
    createSendToken(user, 200, req, res);
  } catch (err) {
    next(err);
  }
};

//ovo sada uopste i ne pozivamo, samo obrisemo token na frontendu
exports.logout = (req, res) => {
  /*res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });*/ //necemo da radimo sa kukijima zbog csrf zastite
  res.status(200).json({ status: 'success' });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  try {
    /*const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;*/
    //promenjeno zbog angulara
    //TODO:srediti url za production
    const resetURL = `${req.protocol}://localhost:4200/user/reset-password/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

/*exports.resetPassword = catchAsync ( async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});*/

//moja verzija za rad sa angularom
exports.resetPassword = catchAsync(async (req, res, next) => {
  const token = req.body.token;
  // 1) Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!
  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const updates = Object.keys(req.body.userData);
  const allowedUpdates = [
    'firstName',
    'lastName',
    'city',
    'country',
    'homeAddress',
    'postalCode',
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return next(new AppError('Invalid updates!', 400));
  }
  let user = req.user; // ne moramo da trazimo usera zato sto ga vec imamo iz midlvera is-auth; koji dodaje user dokument requestu
  // let user = await User.findById(req.body.userId);
  // updates.forEach((update) => user[update] = req.body.userData[update])skratili bi pisanje ovog dole; ali ne moze ovde zato sto imamo neke nested propertije
  user.firstName = req.body.userData.firstName;
  user.lastName = req.body.userData.lastName;
  user.address.city = req.body.userData.city;
  user.address.country = req.body.userData.country;
  user.address.postalCode = req.body.userData.postalCode;
  user.address.homeAddress = req.body.userData.homeAddress;
  const editedUser = await user.save();
  createSendToken(editedUser, 200, req, res); //mozda bi mogli samo usera da posaljemo, bez createSendTOken-a  
});