const User = require('../models/user');
const Sale = require('../models/sale');
const catchAsync = require('../utils/catchAsync');
const Email = require('./../utils/email');

//const stripe = require('stripe')('sk_test_isrGxOT6eU6k9gJIBzn7Npk000m0Ty65SD');

exports.getWishlistProducts = async (req, res, next) => {
  try {
    const sales = await Sale.find({ dateClosed: { $exists: false } }).populate(
      'productId'
    );
    const doc = sales.filter((sale) => req.user.wishlist.includes(sale._id));
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
};


//ne znam da li ovo i treba uopste vise jer broj product-a u wishlist-u mozemo da dobijemo direktno iz user-a
exports.getWishlistProductsLength = async (req, res, next) => {
  try {
    const num = req.user.wishlist.length;
    res.status(200).json({
      status: 'success',
      data: num,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.setWishlistProduct = async (req, res, next) => {
  try {
    const saleId = req.body.saleId;
    const user = await User.findById(req.user.id);
    //TODO: mozda ovde gore moze samo: const user = req.user;
    const i = user.wishlist.indexOf(saleId);
    if (i > -1) {
      user.wishlist.splice(i, 1);
    } else if (i === -1) {
      user.wishlist.push(saleId);
    }
    await user.save();
    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.sendContactMessage = catchAsync(async (req, res, next) => {
  //FIXME: sredi ovo ima problema
  console.log(req.body);
  const user = {
    email: 'support@onebuck.store',
    firstName: req.body.msg.email,
  };
  try {
    await new Email(user, '', req.body.msg.msg).contactMe();
    res.status(200).json({
      status: 'success',
    });
  } catch (err) {
    console.log(err);
  }
});

exports.buyPoints = async (req, res, next) => {
  // TODO: na ovoj ruti moze da ide kasnije stripe a videcemo kako ce biti sa webhooksima

  try {
    const points = req.body.points;
    const userId = req.user._id;
    /*const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
        req.params.tourId
      }&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      line_items: [
        {
          name: `${tour.name} Tour`,
          description: tour.summary,
          images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          amount: tour.price * 100,
          currency: 'usd',
          quantity: 1
        }
      ]
    })
    res.status(200).json({
      status: 'success',
      session
    })*/
    user = await User.findById(userId).select('+spending');//mozda je ovde moglo sa findByIdAndUpdate
    const oldPoints = +user.points;
    user.points = oldPoints + points;
    user.spending += points;
    newUser = await user.save();
    res.status(200).json({
      status: 'success',
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserCart = (req, res, next) => {
  Sale.find({
    dateClosed: { $exists: false },
    'customers.customerId': req.user._id,
  })
    .populate('productId')
    .then((products) => {
      return res.status(200).json({
        status: 'success',
        data: products,
      });
    })
    .catch((err) => {
      return next(err);
    });
};

exports.getUserCartLength = (req, res, next) => {
  Sale.find({
    dateClosed: { $exists: false },
    'customers.customerId': req.user._id,
  })
    .then((products) => {
      return res.status(200).json({
        status: 'success',
        data: products.length,
      });
    })
    .catch((err) => {
      return next(err);
    });
};


