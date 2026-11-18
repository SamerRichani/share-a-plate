// URLs for food offers.  Base path: /api/offers
// Every route here needs a signed-in user (authenticate).
// authorize('donor') etc. limits a route to one role.
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateIdParam } = require('../utils/validation');
const { listOffers, getOffer, createOffer, updateOffer, removeOffer } = require('../controllers/offers');
const { createReservation, listReservations } = require('../controllers/reservations');
const { createReport } = require('../controllers/reports');

router.use(authenticate);
router.param('id', validateIdParam); // :id must be a positive whole number

// Read
router.get('/', listOffers);                                              // browse available food
router.get('/mine', authorize('donor'), listOffers);                      // a donor's own offers
router.get('/:id', getOffer);                                             // one offer
router.get('/:id/reservations', authorize('donor'), listReservations);    // who reserved my offer

// Create / change
router.post('/', authorize('donor'), createOffer);                        // post food
router.patch('/:id', authorize('donor'), updateOffer);                    // edit or close my offer
router.delete('/:id', authorize('donor'), removeOffer);                   // remove my offer
router.post('/:id/reservations', authorize('recipient'), createReservation); // reserve portions
router.post('/:id/reports', createReport);                                // report a problem

module.exports = router;
