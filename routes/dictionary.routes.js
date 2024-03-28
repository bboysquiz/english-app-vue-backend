const Router = require('express')
const router = new Router()
const dictionaryController = require('../controller/dictionary.controller')

router.post('/dictionary', dictionaryController.createPair)
router.get('/dictionary', dictionaryController.getDictionary)
router.get('/dictionary/count', dictionaryController.getCountPairs)
router.get('/dictionary/random', dictionaryController.getRandomPair);
router.get('/dictionary/:id', dictionaryController.getPair)
router.get('/dictionary/translate/:rusWord', dictionaryController.getEngTranslate)
router.get('/dictionary/word/:engWord', dictionaryController.getRusTranslate)
router.put('/dictionary', dictionaryController.updatePair)
router.delete('/dictionary/:id', dictionaryController.deletePair)


module.exports = router