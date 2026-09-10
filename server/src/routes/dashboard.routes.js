const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getDashboard);

module.exports = router;
