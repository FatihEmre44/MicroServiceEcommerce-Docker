const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontrolle');

// Kayıt ol
router.post('/register', authController.register);

// Giriş yap
router.post('/login', authController.login);

// Kullanıcı güncelle
router.put('/:id', authController.updateUser);

// Kullanıcı sil
router.delete('/:id', authController.deleteUser);

module.exports = router;
