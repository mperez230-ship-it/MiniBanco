// backend/routes_sql/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers_sql/userController');

router.post('/', userController.createUser);
router.post('/login', userController.login);
router.get('/', userController.getUsers); // ?role=admin
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser);

module.exports = router;