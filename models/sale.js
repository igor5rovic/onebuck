const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var subSchema = mongoose.Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    customerSalePoints: {
      type: Number,
      require: false,
    },
  },
  { _id: false }
);

const saleSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'There must be a product for this sale'],
      // populate: {select: 'title'} // Automatically adds `.select('title')`
    },
    customers: [subSchema],
    //pitanje za ovo open polje da li nam uopste treba jer ako ima datim zatvaranja naravno da nije open tj. open = false
    open: {
      type: Boolean,
      required: true,
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    forbiddenUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      select: false,
    },
    dateClosed: {
      //dal nam treba i ovo i open polje
      type: Date,
      required: false,
    },
    pointsMin: {
      type: Number,
      required: [
        true,
        'Sale must have a minimum number of points per customer',
      ],
      min: [1, 'Can not be negative number'],
    },
    pointsSaleMin: {
      type: Number,
      required: [true, 'Sale must have a price!'],
      min: [1, 'Can not be negative number'],
    },
    currentPoints: {
      type: Number,
      required: [true, 'Sale must hve current points'],
      min: [0, 'Can not be negative number'],
    },
    emailToWinnerSent: {
      type: Boolean,
      required: true,
    },
    productSent: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true, //automatski kreira polja createdAt i updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// obrati paznju! ne moze da se sortuje po virtelnom polju jer ono nije sacuvano u bazi... mislim pomocu .sort..
//ovo virtuelno polje dobijamo kao da se nalazi u bazi a ne nalazi se
saleSchema.virtual('hotness').get(function () {
  const hotn = this.currentPoints / this.pointsSaleMin;
  return Math.round((hotn + Number.EPSILON) * 100) / 100;
});

/*
// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});*/

// Delete user tasks when user is removed
/*userSchema.pre('remove', async function (next) {
  const user = this
  await Task.deleteMany({ owner: user._id })
  next()
})*/

const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;
