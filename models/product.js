const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please enter a valid product title'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product must have a price'],
      min: [1, 'Negative numbers are not allowed'],
      select: false, // ne zelimo da saljemo korisniku tu informaciju
    },
    description: {
      type: String,
      required: [true, 'Product must have some description'],
      trim: true,
    },
    imageUrl: {
      type: String,
      // required: true,
      trim: true,
    },
    infoLink: {
      type: String,
      required: false,
      trim: true,
    },
    /*saleId: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
    required: false
  },*/
    manufacturer: {
      type: String,
      required: [true, 'Product surely must have manufacturer'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    /*
  likes: {
    type: Number,
    default: 0
  }*/
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// dodajemo index polju title
productSchema.index({ title: 'text' }); //morao sam da dodam index zbog pretrage proizvoda po imenu

//dodajemo virtualna polja

productSchema.virtual('sales', {
  ref: 'Sale',
  foreignField: 'productId',
  localField: '_id',
}); // ako nam treba lista saleova mozemo da populisemo ovo virtualno polje, to verovatno zato sto je referenca u pitanju, inace ne bi morali nego bi virtuelno polje dobili svakako jer je gore ukljuceno toJSON: { virtuals: true }, toObject: { virtuals: true }


/*
productSchema.virtual('openSales', {
  ref: 'Sale',
  foreignField: 'productId',
  localField: '_id',
  match: { open: true },
});

productSchema.virtual('closedSales', {
  ref: 'Sale',
  foreignField: 'productId',
  localField: '_id',
  match: { open: false },
});
*/

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
//module.exports = mongoose.model('Product', productSchema);
