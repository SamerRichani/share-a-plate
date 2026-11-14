const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateId, listReports, listOffers, updateReport } = require('../controllers/admin');
const { moderateOffer } = require('../controllers/offers');

router.use(authenticate, authorize('administrator'));
router.param('id', validateId);

router.get('/reports', listReports);
router.patch('/reports/:id', updateReport);

router.get('/offers', listOffers);
router.patch('/offers/:id', moderateOffer);

module.exports = router;
