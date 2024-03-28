const db = require('../db')

class DictionaryController {
    async createPair(req, res) {
        const {word, translation} = req.body
        const newPair = await db.query(`INSERT INTO dictionary (word, translation) values ($1, $2) RETURNING *`, [word, translation])
        res.json(newPair.rows[0])
    }
    async getDictionary(req, res) {
        const dictionary = await db.query('SELECT * FROM dictionary')
        res.json(dictionary.rows)
    }
    async getCountPairs(req, res) {
        const countPairs = await db.query('SELECT COUNT(*) FROM dictionary')
        res.json(countPairs.rows)
    }
    async getPair(req, res) {
        const id = req.params.id
        const pair = await db.query('SELECT * FROM dictionary where id = $1', [id])
        res.json(pair.rows[0])
    }
    async getEngTranslate(req, res) {
        const rusWord = req.params.rusWord
        const translation = await db.query(`SELECT * FROM dictionary where word = $1`, [rusWord])
        res.json(translation.rows[0].translation)
    }
    async getRusTranslate(req, res) {
        const engWord = req.params.engWord
        const word = await db.query(`SELECT * FROM dictionary where translation = $1`, [engWord])
        res.json(word.rows[0].word)
    }
    async updatePair(req, res) {
        const {id, word, translation} = req.body
        const pair = await db.query(
            'UPDATE dictionary set word = $1, translation = $2 where id = $3 RETURNING *', 
            [word, translation, id]
        )
        res.json(pair.rows[0])
    }
    async deletePair(req, res) {
        const id = req.params.id
        const pair = await db.query('DELETE FROM dictionary where id = $1', [id])
        res.json(pair.rows[0])
    }
    async getRandomPair(req, res) {
        try {
            const randomPair = await db.query('SELECT * FROM dictionary ORDER BY RANDOM() LIMIT 1');
            if (randomPair.rows.length) {
                res.json(randomPair.rows[0]);
            } else {
                res.status(404).json({message: "No words found in the dictionary"});
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({message: "Server error"});
        }
    }
}

module.exports = new DictionaryController()