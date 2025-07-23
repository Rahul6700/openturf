const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/signin', userController.signin);
router.post('/modify', userController.modifyMessage);
router.get('/logs', userController.viewLogs);
router.get('/getCurrentModel', userController.getCurrentModel);
router.post('/changeModel', userController.changeModel);

module.exports = router;
