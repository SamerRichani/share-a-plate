// URLs for administrators only.  Base path: /api/admin
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateIdParam } = require('../utils/validation');
const { listReports, listOffers, updateReport } = require('../controllers/admin');
const { moderateOffer } = require('../controllers/offers');

router.use(authenticate, authorize('administrator'));
router.param('id', validateIdParam);

router.get('/reports', listReports);         // all reports
router.patch('/reports/:id', updateReport);  // resolve / dismiss a report
router.get('/offers', listOffers);           // all offers
router.patch('/offers/:id', moderateOffer);  // close / remove any offer

module.exports = router;
