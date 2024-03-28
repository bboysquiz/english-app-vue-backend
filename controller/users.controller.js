const db = require('../db')

class UsersController {
    
    async getPoints(req, res) {
        try {
            const points = await db.query('SELECT points FROM users')
            res.json(points.rows[0])
        }catch(error) {
            res.json(error)
        }
    }

    async getCorrectWords(req, res) {
        try {
            const correctWords = await db.query('SELECT correct_words FROM users')
            res.json(correctWords.rows[0])
        }catch(error) {
            res.json(error)
        }
    }
    async getIncorrectWords(req, res) {
        try {
            const incorrectWords = await db.query('SELECT incorrect_words FROM users')
            res.json(incorrectWords.rows[0])
        }catch(error) {
            res.json(error)
        }
    }
    async editPoints(req, res) {
        try {
            const {username, points} = req.body
            const userPoints = await db.query(
                'UPDATE users set points = $1 where username = $2 RETURNING *',
                [points, username]
            )
            res.json(userPoints.rows[0].points)
        }catch(error) {
            res.json(error)
        }
    }
    async editCorrectWords(req, res) {
        try {
            const {username, correctWords} = req.body
            const userCorrectWords = await db.query(
                'UPDATE users set correct_words = $1 where username = $2 RETURNING *',
                [correctWords, username]
            )
            res.json(userCorrectWords.rows[0].correct_words)
        }catch(error) {
            res.json(error)
        }
    }
    async editIncorrectWords(req, res) {
        try {
            const {username, incorrectWords} = req.body
            const userIncorrectWords = await db.query(
                'UPDATE users set incorrect_words = $1 where username = $2 RETURNING *',
                [incorrectWords, username]
            )
            res.json(userIncorrectWords.rows[0].incorrect_words)
        }catch(error) {
            res.json(error)
        }
    }
    // async updatePair(req, res) {
    //     const {id, word, translation} = req.body
    //     const pair = await db.query(
    //         'UPDATE dictionary set word = $1, translation = $2 where id = $3 RETURNING *', 
    //         [word, translation, id]
    //     )
    //     res.json(pair.rows[0])
    // }
}

module.exports = new UsersController()