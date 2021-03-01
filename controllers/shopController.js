const Sale = require('../models/sale');
const Product = require('../models/product');
const User = require('../models/user');
const AppError = require('../utils/appError');

const validator = require('validator');

/*exports.getSales = (req, res, next) => {
  Sale.find({dateClosed: { $exists: false }})
    .populate('productId')
    .then(doc => {
      res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
          data: doc
        }
      });
    })
    .catch(err => next(err));
}*/

//verzija sa async await
exports.getSales = async (req, res, next) => {
  try {
    const sales = await Sale.find({ dateClosed: { $exists: false } }).populate(
      'productId'
    );
    res.status(200).json({
      status: 'success',
      results: sales.length,
      data: sales,
    });
  } catch (err) {
    next(err);
  }
};

exports.getSaleDetails = async (req, res, next) => {
  try {
    const saleId = req.params.saleId;
    const sale = await Sale.findById(saleId).populate('productId');
    if (!sale) {
      return next(new AppError('There is no sale with provided id.', 404));
    }
    /*if(req.user) {
        customer = sale.customers.find(customer => customer.customerId.toString() === req.user._id.toString());
        userCurrentPoints = customer? customer.customerSalePoints : 0;
      } else {
        userCurrentPoints = null;
      }*/
    res.status(200).json({
      status: 'success',
      data: sale,
      /*userCurrentPoints*/
    });
  } catch (err) {
    next(err);
  }
};

exports.getHotSales = async (req, res, next) => {
  try {
    const limit = +req.query.limit || 18;
     // ovo je bio pokusaj sortovanja po virtual polju ali to ne moze
    /*const hotProds = await Sale.find({dateClosed: { $exists: false }}).sort('-hotness').limit(12).populate('productId') */ 
    //TODO: ne mora da se vraca svaki properti iz productId-a
    const hotProds = await Sale.find({
      dateClosed: { $exists: false },
    }).populate('productId');
    const hotProductsAll = hotProds.sort(function (a, b) {
      return b.hotness - a.hotness;
    });
    const hotProducts = hotProductsAll.slice(0, limit);
    res.status(200).json({
      status: 'success',
      results: hotProducts.length,
      data: hotProducts,
    });
  } catch (err) {
    next(err);
  }
};

exports.getNewSales = async (req, res, next) => {
  try {
    const limit = +req.query.limit || 12;
    const newProds = await Sale.find({ dateClosed: { $exists: false } })
      .sort('-createdAt')
      .limit(limit)
      .populate('productId');
    res.status(200).json({
      status: 'success',
      results: newProds.length,
      data: newProds,
    });
  } catch (err) {
    next(err);
  }
};

exports.getWinners = async (req, res, next) => {
  try {
    const page = +req.query.page;
    const skip = +req.query.skip;
    //const totalItems = await Model.find().estimatedDocumentCount() ne prihvata filter
    const totalItems = await Sale.where({
      dateClosed: { $exists: true },
    }).countDocuments();
    const winners = await Sale.find({ dateClosed: { $exists: true } })
      .select('dateClosed')
      .populate('productId', 'title imageUrl')
      .populate('winner', 'username email')
      .sort('-dateClosed')
      .skip((page - 1) * skip)
      .limit(skip);

    res.status(200).json({
      status: 'success',
      results: totalItems,
      data: winners,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserWins = async (req, res, next) => {
  try {
    const userWins = await Sale.find({
      dateClosed: { $exists: true },
      winner: req.user.id,
    })
      .select('dateClosed')
      .populate('productId', 'title imageUrl')
      .sort('-dateClosed');

    res.status(200).json({
      status: 'success',
      data: userWins,
    });
  } catch (err) {
    next(err);
  }
};

exports.buyProduct = async (req, res, next) => {
  //TODO: trebalo bi da ovde radi dobro sve, i da su otklonjeni oni problemi sa starijom verizjom ovog kontrolera ali proveriti svakako
  try {
    const saleId = req.body.saleId;
    const userId = req.user._id;
    const points = +req.body.pointsToAdd;
    const userPoints = req.user.points;
    const pointsSaleMin = req.body.pointsSaleMin;

    if (userPoints < points) {
      return next(new AppError('No enough points', 400));
    }
    const sale = await Sale.findOne({ _id: saleId }).select('+forbiddenUser');
    if (sale.open === false) {
      return next(new AppError('Sale is closed You can not add points!', 400));
    }
    newPoints = req.user.points - points;
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id },
      { points: newPoints },
      { new: true }
    );
    let i;
    let findUser = sale.customers.find((el, index) => {
      i = index;
      return el.customerId.toString() === userId.toString();
    });
    if (findUser === undefined) {
      sale.customers.push({ customerId: userId, customerSalePoints: points });
    } else {
      sale.customers[i].customerSalePoints += points;
    }
    sale.currentPoints += points;
    if (sale.currentPoints >= pointsSaleMin) {
      sale.dateClosed = Date.now();
      sale.open = false;
      let winnersPool = setWinnersPool(sale.customers);
      const winPosition = findWinnerPosition(winnersPool.length);
      if (sale.forbiddenUser) {
        sale.winner = sale.forbiddenUser;
      } else {
        sale.winner = winnersPool[winPosition];
      }
      await User.updateMany({}, { $pull: { wishlist: sale.id } });
    }
    await sale.save();

    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

//Shop Logic
function setWinnersPool(usersArray) {
  var arr = [];
  usersArray.forEach((el) => {
    for (let i = 0; i < el.customerSalePoints; i++) {
      arr.push(el.customerId);
    }
  });
  return arr;
}

function findWinnerPosition(participants) {
  var currentDate = Date.now();
  let rndDateNum = currentDate % 1000;
  let x = rndDateNum + Math.floor(Math.random() * participants);
  let winnerPosition = x % participants;
  return winnerPosition;
}

exports.getProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId).select('+price');
    if (!product) {
      return next(new AppError('There is no product with provided id.', 404));
    }
    res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

exports.productSearch = (req, res, next) => {
  const searchTxt = req.body.productSearchTxt.toLowerCase();
  if (!validator.isAlphanumeric(searchTxt)) {
    return next(new AppError('That kind of search text is forbidden, please use letters and numbers', 404));
  }
  /*Product.find({$text: {$search: searchTxt}}).then(
    products => {
    }
  )*/
  let searchedProds = [];
  Sale.find({ dateClosed: { $exists: false } })
    .populate('productId')
    .then((sales) => {
      sales.forEach((sale) => {
        if (sale.productId.title.toLowerCase().includes(searchTxt)) {
          searchedProds.push(sale);
        }
      });
      return res.status(200).json({
        status: 'success',
        data: searchedProds,
      });
    })
    .catch((err) => {
      return next(err);
    });
};
//pretraga proizvoda po imenu (indeksirano)
/*exports.postProductSearch = (req, res, next) => {
  const searchTxt = req.body.productSearch;
  Product.find({ $and: [
    { $text: {$search: searchTxt} }, { saleId: { $ne: null } }
  ]})
       .limit(12)
       .populate('saleId')
      // .find({"saleId.dateClosed":{ $exists: false }})
       .then(products => {
         console.log(products);
          res.render('product-search', { 
...
        });
       })
       .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      }); 
}*/

/*za sada necemo da koristimo strajp
const stripe = require('stripe')('sk_test_isrGxOT6eU6k9gJIBzn7Npk000m0Ty65SD');
exports.createPaymentIntent = (req, res, next) => {
  stripe.paymentIntents.create(
    {
      amount: parseInt(req.body.amount),
      currency: "usd",
      payment_method_types: ["card"],
    },
    function (err, paymentIntent) {
      if (err) {
        //res.status(500).json(err.message);
        return next(err);
      } else {
        res.status(201).json(paymentIntent);
      }
    }
  )
}*/


//TODO: trebalo bi da odradimo payment na severu da ne bi doslo do situacije da korisnik na pola placanja iskljuci program i onda mu skinemo pare a ne dodamo mu u aplikaciji. Za sada je smuljano nesto na frontendu tako da, ono...
exports.userBuyPoints = async (req, res, next) => {
  const user = req.user;
  //const pointsToAdd = +req.body.pointsToAdd / 100;
  const pointsToAdd = +req.body.pointsToAdd;
  try {
    const oldPoints = +user.points;
    user.points = oldPoints + pointsToAdd;
    user.spending += pointsToAdd;
    let editedUser = await user.save();
    //TODO: mozda treba da posaljemo mejl da se zahvalimo sto su resili da uplate jelte
    return res.status(201).json({
      status: 'success',
      data: editedUser,
    });
  } catch (err) {
    return next(err);
  }
};

