const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {//FIXME: ne radi ni ovo, za sada ne prolazi jer su pre toga zamke da se uhvati da li vec postoji vrednost koju pokusavamo da sacuvamo u bazi za polja koja bi trebalio da budu unique
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  //if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  //}

  // B) RENDERED WEBSITE
  /*console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });*/
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  //console.log(err.name, err.code)
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //let error = { ...err };
    let error = { ...err, errmsg: err.errmsg }; //morao sam da dodam da bi ovo polje postojalo u error-u jer ga koristimo posle u jednoh funkciji gore
    
    error.message = err.message;
    /***** ove dole zajebancije radimo da bi error bio operational i da bi imali dobar error handling u vezi toga da nam ne izbaci greska je u serveru kada na primer imamo zauzeti mejl ili slicno******/
    //if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    //if (error.name === 'ValidationError') error = handleValidationErrorDB(error);// ovako ne radi jer error objekat koji smo kreirali ne dobija property(ili metod sta li je) name
    //if (err instanceof mongoose.Error.ValidationError) error = handleValidationErrorDB(error); //moze i ovako nekako
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error); // evo gde je bila greska, ovako radi
    //if (error.name === 'JsonWebTokenError') error = handleJWTError(); //FIXME: Da li i ovde treba err.name?
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    //if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

/*I have ran into the same error once.

Accessing err.name in a mongoose error handling middleware returned undefined.

I found out that err.name will only work if you are using the original err object returned from mongoose.

If you are making a copy of the object by Destructuring it like this:

let error = {...err};
this won't Include the name property. As a fix you can do this:

let error = {...err, name: err.name};
and it should work.

Idk why this happen but if anyone knows, please do let me know! Hope this helped you*/ /////sa stack overflow-a
