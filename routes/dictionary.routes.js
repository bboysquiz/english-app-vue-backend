const Router = require('express')
const router = new Router()
const dictionaryController = require('../controller/dictionary.controller')

router.post('/dictionary', dictionaryController.createPair);
router.get('/dictionary', dictionaryController.getDictionary);
router.get('/dictionary/random', dictionaryController.getRandomPair);
router.put('/dictionary/pair', dictionaryController.updatePair);
router.put('/dictionary/rating', dictionaryController.editWordRating);
router.delete('/dictionary/:id', dictionaryController.deletePair);


module.exports = router