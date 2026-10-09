const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const wrap = require('../utils/asyncHandler');
const A = require('../controllers/auth.controller');
const P = require('../controllers/products.controller');
const C = require('../controllers/cart.controller');
const O = require('../controllers/orders.controller');

router.get('/health', (_req, res) => res.json({ ok: true }));

// Auth
router.post('/auth/register',
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  validate, wrap(A.register));
router.post('/auth/login',
  body('email').isEmail().normalizeEmail(), body('password').notEmpty(), validate, wrap(A.login));
router.get('/auth/me', auth, wrap(A.me));

// Productos
const productRules = [
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('price').isFloat({ min: 0 }).withMessage('Precio inválido').toFloat(),
  body('stock').optional().isInt({ min: 0 }).toInt(),
];
router.get('/categories', wrap(P.categories));
router.get('/products', wrap(P.list));
router.get('/products/:id', wrap(P.get));
router.post('/products', auth, role('admin'), productRules, validate, wrap(P.create));
router.put('/products/:id', auth, role('admin'), validate, wrap(P.update));
router.delete('/products/:id', auth, role('admin'), wrap(P.remove));

// Carrito
router.get('/cart', auth, wrap(C.get));
router.post('/cart/items', auth,
  body('productId').isInt().toInt(), body('quantity').optional().isInt({ min: 1 }).toInt(), validate, wrap(C.addItem));
router.patch('/cart/items/:id', auth, body('quantity').isInt({ min: 1 }).toInt(), validate, wrap(C.updateItem));
router.delete('/cart/items/:id', auth, wrap(C.removeItem));
router.delete('/cart', auth, wrap(C.clear));

// Pedidos
router.post('/orders', auth, body('shippingAddress').trim().notEmpty().withMessage('Dirección requerida'), validate, wrap(O.create));
router.get('/orders', auth, wrap(O.list));
router.get('/orders/:id', auth, wrap(O.get));
router.patch('/orders/:id/status', auth, role('admin'),
  body('status').isIn(['pending', 'paid', 'shipped', 'cancelled']), validate, wrap(O.updateStatus));

module.exports = router;
