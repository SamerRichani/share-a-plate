// URLs for reservations.  Base path: /api/reservations
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateIdParam } = require('../utils/validation');
const { listReservations, cancelReservation, confirmPickup } = require('../controllers/reservations');

router.use(authenticate);
router.param('id', validateIdParam);

router.get('/mine', authorize('recipient'), listReservations);            // my reservations
router.post('/:id/cancel', authorize('recipient'), cancelReservation);    // cancel one
router.post('/:id/pickup', authorize('donor'), confirmPickup);            // donor confirms pickup with the code

module.exports = router;
