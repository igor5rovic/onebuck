var express = require('express');
var path = require('path');
//var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
//const csrf = require('csurf');
//Ne treba nam csrf zastita zato sto angular nece da salje kukije koji su kljucni za sprovodjenje csrf napada. Ovo nam je omoguceno i zato sto koristimo autentifikaciju pomocu tokena u hederu

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

var userRouter = require('./routes/userRoutes');
var shopRouter = require('./routes/shopRoutes');
var adminRouter = require('./routes/adminRoutes');

var app = express();

//ako deploy na heroku
//app.enable('trust proxy');

//za cors, jelte, ako je mean aplikacija (sve u jednon aplikaciji) onda nam ne treba cors
app.use(cors());
//app.use(cors({origin: 'http://localhost:4200', credentials: true})); //nece da sacuva cookie na browseru kada koristimo angular i zato bi morali ovako, osim ako nije MEAN u jednoj aplikaciji??? ako je mean u jednoj aplikaciji onda cookies cepaju i bez ovoga. Jos jedna stvar, ako zelimo csrf zastitu bez koriscenja csurf paketa i nekih posebnih aktivnosti necemo uopste ni da koristimo kukije
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
//app.use(cors({
//   origin: 'https://www.primer.com'
// }))
app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
); //TODO: morao sam da iskljucim za sada content-security-policy jer pravio problema u app

// Limit requests from same API
const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

//Ovo kad dodam webhooks za strajp
// Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
/*app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);*/

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
  console.log('development')
};
//ogranicena je velicina podataka koju korisnik(frontend) salje
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
//app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
app.use("/", express.static(path.join(__dirname, 'dist')));//ovde je angular app

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());
//ako hocemo da neke pojmove zanemarimo iz hpp zastite, ako namerno hocemo da ima vise polja sa istim imenom u req.query-ju onda:
/*app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
    ]
  })
);*/

//za kompresju
app.use(compression());

/*app.use((req,res,next)=>{
  console.log(req.headers)
  console.log(req.cookies)
  next()
})*/

// ova funkcija daje vrednost csrf tokena kao string. onda se dole uporedjuje da li je token dobar. moralo je ovako jer frontend nikako nije hteo da posalje zeljene hedere a salje cookie gde se token nalazi pa smo ga odatle i izvukli
/*function getXSRFTOKENValue(req){
  const csrfTokenAsAString = req.cookies['XSRF-TOKEN']
  return csrfTokenAsAString
}*/

// csrf protection
//app.use(csrf({cookie: true, value: getXSRFTOKENValue}));//FIXME: problem kada pokusamo da loudujemo localhost:3000 ne dobijemo XSRF-TOKEN, ako loudujemo druge rute, dobijemo ga

app.use('/api/v1/users', userRouter);
app.use('/api/v1/shop', shopRouter);
app.use('/api/v1/admin', adminRouter); //TODO: pitanje samo da li i admin rute da budu pod csrf zastitom?

/*app.use((req,res,next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false,
    path: '/'
  });
  next();
})*/

app.use((req, res, next) => {
  /*res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false, //Za Angular mora da bude false ovde
    path: '/',
    //sameSite: 'strict'
  });*/
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});//daje angular app

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//svi errori poslati u next stizu ovde?
app.use(globalErrorHandler);

module.exports = app;
