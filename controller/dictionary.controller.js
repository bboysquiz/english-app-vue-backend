const db = require('../db')

let requestCounter = 0;

class DictionaryController {
    async createPair(req, res) {
        const { userId, word, translation } = req.body
        const newPair = await db.query(`INSERT INTO dictionary (word, translation, rating, userid) values ($1, $2, $3, $4) RETURNING *`, [word, translation, 0, userId])
        res.json(newPair.rows[0])
    }
    async getDictionary(req, res) {
        const { userid } = req.body
        console.log(req)
        const dictionary = await db.query('SELECT * FROM dictionary where userid = $1', [userid])
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
    async getWordRating(req, res) {
        const id = req.params.id
        const result = await db.query(`SELECT * FROM dictionary where id = $1`, [id])
        res.json(result.rows[0].rating)
    }
    async updatePair(req, res) {
        const { id, word, translation, userId } = req.body
        const pair = await db.query(
            'UPDATE dictionary set word = $1, translation = $2 where id = $3 AND userid = $4 RETURNING *',
            [word, translation, id, userId]
        )
        res.json(pair.rows[0])
    }
    async editWordRating(req, res) {
        const { id, rating, correctPoint, incorrectPoint } = req.body
        const result = await db.query(
            'UPDATE dictionary set rating = $1, correct_answer = $3, incorrect_answer = $4 where id = $2 RETURNING *',
            [rating, id, correctPoint, incorrectPoint]
        )
        res.json(result.rows[0])
    }
    async deletePair(req, res) {
        const { id, userId } = req.params
        console.log(id, userId)
        const pair = await db.query('DELETE FROM dictionary where id = $1 AND userid = $2', [id, userId])
        res.json(pair.rows[0])
    }
    async getRandomPair(req, res) {
        const excludeWords = typeof req.query.exclude === 'string' && req.query.exclude.trim() !== ''
            ? req.query.exclude.split(',')
            : [];
        const { userId } = req.query; 
        console.log(userId)
        console.log(req.query)
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }
    
        try {
            requestCounter++;
    
            let query;
            let params = [userId];
    
            if (requestCounter % 15 === 0) {
                query = `
                    SELECT * FROM dictionary
                    WHERE userid = $1
                    ORDER BY RANDOM()
                    LIMIT 1
                `;
            } else if (excludeWords.length > 0) {
                const placeholders = excludeWords.map((_, i) => `$${i + 1}`).join(',');
                query = `
                    SELECT * FROM dictionary
                    WHERE userid = $1
                    AND rating = (
                        SELECT MIN(rating) 
                        FROM dictionary
                        WHERE userid = $1 
                        AND word NOT IN (${placeholders})
                    )
                    AND word NOT IN (${placeholders})
                    ORDER BY RANDOM()
                    LIMIT 1
                `;
                params = [userId, ...excludeWords];
            } else {
                query = `
                    SELECT * FROM dictionary
                    WHERE userid = $1
                    AND rating = (SELECT MIN(rating) FROM dictionary WHERE userid = $1)
                    ORDER BY RANDOM()
                    LIMIT 1
                `;
            }
    
            console.log('SQL query:', query, 'Params:', params); // Логируем запрос
    
            const randomPair = await db.query(query, params);
    
            if (randomPair.rows.length) {
                res.json(randomPair.rows[0]);
            } else {
                res.status(404).json({ message: "No words found in the dictionary" });
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
            res.status(500).json({ message: "Server error" });
        }
    }    
}

module.exports = new DictionaryController()