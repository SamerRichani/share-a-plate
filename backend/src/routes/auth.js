// URLs for signing up and signing in.  Base path: /api/auth
const router = require('express').Router();
const { register, login, getMe } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');

router.post('/register', register); // create an account
router.post('/login', login);       // get a token
router.get('/me', authenticate, getMe); // who am I?

module.exports = router;
