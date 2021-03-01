var express = require('express');
var router = express.Router();
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

var shopCtrl = require ('../controllers/shopController');


//const Product = require('../models/product');

//TODO: cisto za vezbanje aggregate
/*router.get('/trtemrte', async (req, res, next) => {
  let productInfo = await Product.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$category'}, //znaci grupise nove dokumente(nisu mongoose dokumenti) u zavisnosti od ovog _id polja, ako hocemo da ih sve agreguje ili kako se vec kaze (u jednu grupu) onda stavimo _id: null
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ])

  res.status(200).json({
    status: 'success',
    data: productInfo
  })
})*/

router.get('/sales', shopCtrl.getSales);
router.get('/sales/:saleId', shopCtrl.getSaleDetails);
router.get('/hot-sales', shopCtrl.getHotSales);
router.get('/new-sales', shopCtrl.getNewSales);
router.get('/winners', shopCtrl.getWinners);
router.post('/product-search', shopCtrl.productSearch);

router.use(isAuth);
router.post('/buy-product', shopCtrl.buyProduct);
router.get('/user-wins', shopCtrl.getUserWins);
router.get('/product/:productId', isAdmin, shopCtrl.getProduct);

//router.post('/create-payment-intent',shopCtrl.createPaymentIntent);
router.post('/buy-points',shopCtrl.userBuyPoints);

module.exports = router;


