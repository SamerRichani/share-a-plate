const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateId, listOffers, getOffer, createOffer, updateOffer, removeOffer } = require('../controllers/offers');
const { createReservation, listReservations } = require('../controllers/reservations');
const { createReport } = require('../controllers/reports');

router.use(authenticate);
router.param('id', validateId);

//GET
router.get('/', listOffers);
router.get('/mine', authorize('donor'), listOffers);
router.get('/:id', getOffer);
router.get('/:id/reservations', authorize('donor'), listReservations);

//POST, PATCH, DELETE
router.post('/', authorize('donor'), createOffer);
router.post('/:id/reservations', authorize('recipient'), createReservation);
router.post('/:id/reports', createReport);
router.patch('/:id', authorize('donor'), updateOffer);
router.delete('/:id', authorize('donor'), removeOffer);

module.exports = router;
