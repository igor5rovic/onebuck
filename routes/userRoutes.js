var express = require('express');
var router = express.Router();
const isAuth = require('../middleware/is-auth');
const isAdmin = require('../middleware/is-admin');

var userCtrl = require ('../controllers/userController');
var authCtrl = require ('../controllers/authController');
var adminCtrl = require ('../controllers/adminController');

router.post('/check-username', authCtrl.checkUsername);
router.post('/signup', authCtrl.signup);
router.post('/login', authCtrl.login);
router.get('/logout', authCtrl.logout);
router.post('/forgotPassword', authCtrl.forgotPassword);
//router.patch('/resetPassword/:token', authCtrl.resetPassword);
//ovo dole sam ja menjao zbog angulara
router.patch('/resetPassword', authCtrl.resetPassword);
router.post('/contact', userCtrl.sendContactMessage);

// Protect all routes after this middleware
router.use(isAuth);

router.patch('/update_me', authCtrl.updateMe);
router.patch('/updateMyPassword', authCtrl.updatePassword);
router.get('/wishlist', userCtrl.getWishlistProducts);
router.get('/wishlist/length', userCtrl.getWishlistProductsLength);
router.patch('/wishlist', userCtrl.setWishlistProduct);
router.post('/points', userCtrl.buyPoints);
router.get('/cart', userCtrl.getUserCart);
router.get('/cart/length', userCtrl.getUserCartLength);

//ova ruta bi mozda i mogla u admin ruter
router.get('/all', isAdmin, adminCtrl.getAllUsers);
router.get('/forbidden-users', isAdmin, adminCtrl.getForbiddenUsers);
router.get('/user/:userId', isAdmin, adminCtrl.getUser);

module.exports = router;

/*router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
      updates.forEach((update) => req.user[update] = req.body[update])
      await req.user.save()
      res.send(req.user)
  } catch (e) {
      res.status(400).send(e)
  }
})*/

/*router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})*/