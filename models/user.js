const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');


//const userSchema = new mongoose.Schema({
const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Please tell us your name!'],
      unique: true,
      trim: true,
      maxlength: [20, 'Username must be at most 20 characters long'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      maxlength: [50, 'Password must be at most 50 characters long'],
      trim: true,
      select: false, //mislim da ga ne vraca kad querujemo sa find
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    firstName: {
      type: String,
      trim: true,
      required: [true, 'Please tell us your first name!'],
      maxlength: [30, 'First name must be at most 30 characters long'],
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, 'Please tell us your last name!'],
      maxlength: [30, 'Last name must be at most 30 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      maxlength: [50, 'Email must be at most 50 characters long'],
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    /*photo: {
    type: String,
    default: 'default.jpg'
  },*/
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    address: {
      country: {
        type: String,
        required: [true, 'Please tell us your country!'],
        maxlength: [30, 'Country name must be at most 30 characters long'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'Please tell us your city!'],
        maxlength: [30, 'City name must be at most 30 characters long'],
        trim: true,
      },
      homeAddress: {
        type: String,
        maxlength: [75, 'Home address must be at most 75 characters long'],
        trim: true,
      },
      postalCode: {
        type: String,
        required: false,
        maxlength: [15, 'Zip/Postal must be at most 15 characters long'],
        trim: true,
      },
    },
    phoneNum: String,
    // creditCardNum : String, --> to ne mozemo da znamo jer ide preko strajpa a i sta ce nam
    spending: {
      type: Number,
      default: 0,
      select: false,
      min: [0, 'Must be a positive number'],
    },
    level: {
      type: Number,
      default: 1,
      min: [1, 'Must be a positive number, greather than 0'],
    },
    points: {
      type: Number,
      default: 0,
      min: [0, 'Must be a positive number'],
    },
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Sale',
      },
    ],
    /*tokens: [{
      token: {
        type: String,
        required: true
      }
    }],*/
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//ako hocemo ovde da generisemo token i da ga sacuvamo u nizu tokena
/*userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}*/

//znaci pre save-a se pokrene ova funkcija
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ovo se pokrece pre find-a znaci na foru da ne prikaze neaktivne user-e
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  //ako ne zelimo da saljemo __v polje mozemo:???
  //this.find({ active: { $ne: false } }).select('-__v');
  next();
});

//metod (valjda staticki) za ovaj Model
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

//primer kad obrisemo usera brisu se i neki podaci vezani za njega
/*// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})*/

//primer virtuals polja
/*userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})*/

//nesto ne radi ovo, radi samo treba da se populise sa populate

/*userSchema.virtual('cartItemsNumber', {
  ref: 'Sale',
  foreignField: 'customers.customerId',
  localField: '_id',
  match: {
    open: true
  }
});*/
/*userSchema.virtual('wishlist', {
  ref: 'Wishlist',
  foreignField: 'listOfCustomers',
  localField: '_id'
});*/

const User = mongoose.model('User', userSchema);

module.exports = User;
