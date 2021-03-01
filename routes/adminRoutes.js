var express = require('express');
var router = express.Router();
const isAdmin = require('../middleware/is-admin');

var adminCtrl = require ('../controllers/adminController');
//const User = require('../models/user');
//const Sale = require('../models/sale');

//ove dole rute nam verovatno nece trebati u produkciji
router.get('/clear-wishlists', adminCtrl.clearWishlists);

/*router.get('/delete-users', (req,res,next)=>{
  User.deleteMany({role: 'user'}).then(result => {
    console.log(result);
    res.status(200).json({
      status: 'success'
    })
  }).catch(err => {
    console.log(err);
    next(err);
  })
});*/


/*router.get('/delete-open-sales', (req,res,next)=>{
  Sale.deleteMany({open: true}).then(result => {
    console.log(result);
    res.status(200).json({
      status: 'success'
    })
  }).catch(err => {
    console.log(err);
    next(err);
  })
});*/


/*router.get('/delete-closed-sales', (req,res,next)=>{
  Sale.deleteMany({open: false}).then(result => {
    console.log(result);
    res.status(200).json({
      status: 'success'
    })
  }).catch(err => {
    console.log(err);
    next(err);
  })
});*/


router.use(isAdmin);

router.get('/home', adminCtrl.getAdminHomePage);
router.get('/home-users-info', adminCtrl.adminUsersInfo);

router.get('/all-products', adminCtrl.getAdminProducts);
router.route('/add-product')
  .post(adminCtrl.createNewProduct)
router.patch('/edit-product', adminCtrl.editProduct);
router.delete('/product/:productId', adminCtrl.deleteProduct);

/*router.get('/all-sales', adminCtrl.getAdminSales);*/
router.get('/open-sales', adminCtrl.getOpenSales);
router.get('/closed-sales', adminCtrl.getClosedSales);
router.get('/finished-sales', adminCtrl.getFinishedSales);
router.post('/create-sale', adminCtrl.createNewSale);
router.patch('/edit-sale', adminCtrl.editSale);
router.patch('/edit-user', adminCtrl.editUser);
router.delete('/edit-user/:userId', adminCtrl.deleteUser);
router.get('/admin-sales/:saleId', adminCtrl.saleDetails);
router.delete('/admin-sales/:saleId', adminCtrl.deleteSale);
/*router.route('/admin-sales/:saleId')
  .get(adminCtrl.saleDetails)
  .delete(adminCtrl.deleteSale)*/
router.patch('/set-send-product', adminCtrl.setSendProductStatus);
router.get('/categories', adminCtrl.getAllCategories);
router.post('/categories', adminCtrl.createCategory);

module.exports = router;
