const Router = require('express')
const router = new Router()
const usersController = require('../controller/users.controller')
const authenticateToken = require('../middleware/authenticateToken'); // Middleware для проверки токена

router.get('/users/points', usersController.getPoints);
router.get('/users/correct_words', usersController.getCorrectWords);
router.get('/users/incorrect_words', usersController.getIncorrectWords);
router.put('/users/points', usersController.editPoints);
router.put('/users/correct_words', usersController.editCorrectWords);
router.put('/users/incorrect_words', usersController.editIncorrectWords);
router.post('/login', usersController.login);
router.post('/logout', usersController.logout);
router.post('/refresh-token', usersController.refreshToken);
router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'You have access!', user: req.user });
});
router.post('/users', usersController.createUser);
router.get('/users/me', authenticateToken, usersController.getCurrentUser);


module.exports = router