const Product = require('../models/product');
const Sale = require('../models/sale');
const User = require('../models/user');
const Category = require('../models/category');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAdminHomePage = (req, res, next) => {
  Sale.find({ dateClosed: { $exists: true } })
    .populate({ path: 'productId', select: '+price' })
    .then((sales) => {
      let totalProductsSold = 0;
      let totalPointsSpentOnSoldProducts = 0;
      let totalEarningsOnSoldProducts = 0;
      let averageSaleLength = 0;
      if (sales.length > 0) {
        totalProductsSold = sales.length;
        pointsSpentArr = sales.map((el) => el.currentPoints);
        totalPointsSpentOnSoldProducts = pointsSpentArr.reduce(
          (acc, curr) => acc + curr
        );
        earningByProduct = sales.map(
          (sale) => sale.currentPoints - sale.productId.price
        );
        totalEarningsOnSoldProducts = earningByProduct.reduce(
          (acc, curr) => acc + curr
        );
        saleDateDif = sales.map(
          (sale) => sale.dateClosed - sale._id.getTimestamp()
        );
        averageSaleLengthMS =
          saleDateDif.reduce((acc, curr) => acc + curr) / sales.length;
        averageSaleLength = (
          (averageSaleLengthMS / (1000 * 60 * 60)) %
          24
        ).toFixed(2);
      }
      res.status(200).json({
        status: 'success',
        data: {
          totalProductsSold,
          totalPointsSpentOnSoldProducts,
          totalEarningsOnSoldProducts,
          averageSaleLength,
        },
      });
    })
    .catch((err) => next(err));
};

exports.adminUsersInfo = async (req, res, next) => {
  try {
    const numOfUsers = (await User.find({})).length;
    const numOfUsersSpending = (await User.find({ spending: { $gt: 0 } }))
      .length;
    const userAvgSpendingArr = await User.aggregate([
      {
        $match: { spending: { $gt: 0 } },
      },
      {
        $group: {
          _id: null, //znaci grupise nove dokumente(nisu mongoose dokumenti) u zavisnosti od ovog _id polja, ako hocemo da ih sve agreguje ili kako se vec kaze (u jednu grupu) onda stavimo _id: null
          avgSpending: { $avg: '$spending' },
          //maxSpending: { $max: '$price' }
        },
      },
    ]);
    const userAvgSpending = userAvgSpendingArr[0].avgSpending.toFixed(2);
    res.status(200).json({
      status: 'success',
      data: {
        numOfUsers,
        numOfUsersSpending,
        userAvgSpending,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAdminProducts = async (req, res, next) => {
  try {
    adminProducts = await Product.find({}).select('+price').populate({
      path: 'sales',
      select:
        'id open pointsSaleMin currentPoints emailToWinnerSent productSent',
    });
    res.status(200).json({
      status: 'success',
      data: adminProducts,
    });
  } catch (err) {
    net(err);
  }
};

exports.createNewProduct = async (req, res, next) => {
  try {
    const createdProduct = await Product.create(req.body);
    res.status(201).json({
      status: 'success',
      data: createdProduct,
    });
  } catch (err) {
    next(err);
  }
};

exports.editProduct = async (req, res, next) => {
  try {
    const prodId = req.body.editedProductId;
    const newData = req.body.newProductData;
    const product = await Product.findById(prodId).select('+price');
    product.title = newData.title;
    product.price = newData.price;
    product.description = newData.description;
    product.imageUrl = newData.imageUrl;
    product.infoLink = newData.infoLink;
    product.manufacturer = newData.manufacturer;
    product.category = newData.category;
    const editedProduct = await product.save();
    res.status(201).json({
      status: 'success',
      data: editedProduct,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const prodId = req.params.productId;
    const sales = await Sale.find({ productId: prodId });
    if (sales.length > 0) {
      return next(
        new AppError(
          'Not allowed! Delete sales which are using this product!',
          405
        )
      );
    }
    const doc = await Product.findByIdAndDelete(prodId);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(201).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

/*exports.getAdminSales = async (req, res, next) => {
  try {
    const page = +req.query.page;
    const skip = +req.query.skip;
    const totalItems = await Sale.find().countDocuments();
    const adminSales = await Sale.find()
    .skip((page-1)*skip)
    .limit(skip);
    res.status(200).json({
      status: 'success',
      results: totalItems,
      data: adminSales
    });
  } catch (err) {
    net(err);
  }
}*/

exports.getOpenSales = async (req, res, next) => {
  try {
    const openSales = await Sale.find({ open: true });
    res.status(200).json({
      status: 'success',
      data: openSales,
    });
  } catch (err) {
    net(err);
  }
};

exports.getClosedSales = async (req, res, next) => {
  try {
    const closedSales = await Sale.find({
      open: false,
      $or: [{ emailToWinnerSent: false }, { productSent: false }],
    });
    res.status(200).json({
      status: 'success',
      data: closedSales,
    });
  } catch (err) {
    net(err);
  }
};

exports.getFinishedSales = async (req, res, next) => {
  try {
    const page = +req.query.page;
    const skip = +req.query.skip;
    const totalItems = await Sale.find({
      open: false,
      emailToWinnerSent: true,
      productSent: true,
    }).countDocuments();
    const finishedSales = await Sale.find({
      open: false,
      emailToWinnerSent: true,
      productSent: true,
    })
      .skip((page - 1) * skip)
      .limit(skip);
    res.status(200).json({
      status: 'success',
      results: totalItems,
      data: finishedSales,
    });
  } catch (err) {
    net(err);
  }
};

exports.createNewSale = async (req, res, next) => {
  try {
    const pointsSaleMin = req.body.pointsSaleMin;
    const pointsMin = req.body.pointsMin;
    const productId = req.body.productId;
    const sale = await Sale.create({
      productId: productId,
      customers: [],
      open: true,
      pointsMin: pointsMin,
      pointsSaleMin: pointsSaleMin,
      currentPoints: 0,
      emailToWinnerSent: false,
      productSent: false,
    });
    /*const wishlist = await Wishlist.create({
          saleId : sale._id,
          listOfCustomers : []
        });*/
    res.status(201).json({
      status: 'success',
      data: sale,
    });
  } catch (err) {
    next(err);
  }
};

exports.editSale = async (req, res, next) => {
  try {
    const saleId = req.body.editedSaleId;
    const newData = req.body.newSaleData;
    const sale = await Sale.findById(saleId).select('+forbiddenUser');
    sale.pointsMin = newData.pointsMin;
    sale.pointsSaleMin = newData.pointsSaleMin;
    sale.currentPoints = newData.currentPoints;
    sale.forbiddenUser = newData.forbiddenUser || null;
    const editedSale = await sale.save();
    res.status(201).json({
      status: 'success',
      data: editedSale,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteSale = async (req, res, next) => {
  try {
    const saleId = req.params.saleId;
    const sale = await Sale.findById(saleId);
    if (sale.currentPoints > 0) {
      return next(
        new AppError('Not allowed! This sale have points added!', 405)
      );
    }
    const doc = await Sale.findByIdAndDelete(saleId);
    if (!doc) {
      return next(new AppError('No document (Sale) found with that ID', 404));
    }
    res.status(201).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

exports.saleDetails = async (req, res, next) => {
  try {
    const saleId = req.params.saleId;
    const sale = await Sale.findById(saleId).select('+forbiddenUser').populate({
      path: 'productId',
      select: 'title',
    });
    res.status(201).json({
      status: 'success',
      data: sale,
    });
  } catch (err) {
    next(err);
  }
};

exports.setSendProductStatus = async (req, res, next) => {
  try {
    saleId = req.body.saleId;
    const updatedSale = await Sale.findOneAndUpdate(
      { _id: saleId },
      { productSent: true },
      { new: true }
    );
    res.status(201).json({
      status: 'success',
      data: updatedSale,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const page = +req.query.page;
    const skip = +req.query.skip;
    const totalItems = await User.find().countDocuments();
    const users = await User.find()
      .select('+active +spending')
      .skip((page - 1) * skip)
      .limit(skip);
    res.status(201).json({
      status: 'success',
      results: totalItems,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

exports.getForbiddenUsers = async (req, res, next) => {
  try {
    const forbiddenUsers = await User.find({ level: 99 }).select(
      '+active +spending'
    );
    res.status(201).json({
      status: 'success',
      data: forbiddenUsers,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    userId = req.params.userId;
    const totalItems = await Sale.find({
      open: false,
      winner: userId,
    }).countDocuments();
    const user = await User.findById(userId).select(
      '+passwordChangedAt +passwordResetToken +passwordResetExpires +spending +active'
    );
    res.status(201).json({
      status: 'success',
      salesWon: totalItems,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.clearWishlists = async (req, res, next) => {
  try {
    //prazni sve wishlist nizove u svakom user dokumentu
    const dt = await User.updateMany({}, { wishlist: [] });
    //iz svakog dokumenta iz wishlist niza uklanja dati string (u ovom slucaju id od salea)
    /*const dt = await User.updateMany({}, {$pull: {wishlist: '6016b915ca84c52dfc4ad9ed'}}) //postoji i naredba push*/
    res.status(201).json({
      status: 'success',
      data: dt,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().select('categoryName -_id');
    res.status(201).json({
      status: 'success',
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const catName = req.body.category;
    await Category.create({ categoryName: catName });
    res.status(201).json({
      status: 'success',
    });
  } catch (err) {
    next(err);
  }
};

exports.editUser = catchAsync(async (req, res, next) => {
  const userId = req.body.userId;
  const userData = req.body.userData;
  const updates = Object.keys(userData);
  const allowedUpdates = [
    //  'username',
    //  'password',
    'firstName',
    'lastName',
    'email',
    'country',
    'homeAddress',
    'postalCode',
    'city',
    'role',
    //  'active',
    'level',
    'points',
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return next(new AppError('Invalid updates!', 400));
  }
  const user = await User.findById(userId).select('+active');
  //user.username = userData.userDataname;
  //user.password = userData.password;
  user.firstName = userData.firstName;
  user.lastName = userData.lastName;
  user.email = userData.email;
  user.address.country = userData.country;
  user.address.homeAddress = userData.homeAddress;
  user.address.postalCode = userData.postalCode;
  user.address.city = userData.city;
  user.role = userData.role;
  //user.active = userData.active;
  user.level = userData.level;
  user.points = userData.points;
  await user.save();
  res.status(201).json({
    status: 'success',
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const salesNum = await Sale.find({
    open: false,
    winner: userId,
  }).countDocuments();
  if (salesNum > 0) {
    return next(
      new AppError(
        'Not allowed! Deleting this user may cause app errors because this user won some sales!',
        405
      )
    );
  }
  await User.findByIdAndDelete(userId);
  res.status(201).json({
    status: 'success',
  });
});
