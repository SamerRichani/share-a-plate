const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateId, listReservations, cancelReservation, confirmPickup } = require('../controllers/reservations');

router.use(authenticate);
router.param('id', validateId);

router.get('/mine', authorize('recipient'), listReservations);
router.post('/:id/cancel', authorize('recipient'), cancelReservation);
router.post('/:id/pickup', authorize('donor'), confirmPickup);

module.exports = router;
