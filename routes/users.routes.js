const Router = require('express')
const router = new Router()
const usersController = require('../controller/users.controller')

router.get('/users/points', usersController.getPoints)
router.get('/users/correct_words', usersController.getCorrectWords)
router.get('/users/incorrect_words', usersController.getIncorrectWords)
router.put('/users/points', usersController.editPoints)
router.put('/users/correct_words', usersController.editCorrectWords)
router.put('/users/incorrect_words', usersController.editIncorrectWords)


module.exports = router