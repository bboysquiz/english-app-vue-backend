const db = require('../db')

let requestCounter = 0;
 
class DictionaryController {
    async createPair(req, res) {
        const { userId, word, translation } = req.body;
    
        // Вставляем новую пару в таблицу dictionary.
        // Теперь таблица dictionary хранит только основную информацию о слове: само слово, перевод и кому оно принадлежит.
        const newPairResult = await db.query(
            `INSERT INTO dictionary (word, translation, userid) VALUES ($1, $2, $3) RETURNING *`,
            [word, translation, userId]
        );
        const newPair = newPairResult.rows[0];
    
        // Для каждого нового слова создаём две записи в таблице dictionary_stats.
        // Первая запись – для перевода с английского на русский ('en' -> 'ru').
        // Вторая запись – для перевода с русского на английский ('ru' -> 'en').
        // При этом все статистические показатели (rating, correct_answers, incorrect_answers) изначально равны 0.
        await db.query(
            `INSERT INTO dictionary_stats (dictionary_id, source_language, target_language, rating, correct_answers, incorrect_answers)
             VALUES ($1, $2, $3, 0, 0, 0), ($1, $4, $5, 0, 0, 0)`,
            [newPair.id, 'en', 'ru', 'ru', 'en']
        );
    
        res.json(newPair);
    }
    
    async getDictionary(req, res) {
        try {
            const { userId } = req.query; // Убедитесь, что ключ совпадает с запросом (userId).
    
            // Проверка на наличие userId
            if (!userId) {
                return res.status(400).json({ success: false, message: 'userId is required' });
            }
    
            // Запрос к базе данных
            const dictionary = await db.query('SELECT * FROM dictionary WHERE userid = $1', [userId]);
    
            // Отправка ответа клиенту
            res.json({ success: true, data: dictionary.rows });
        } catch (error) {
            console.error('Error fetching dictionary:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error });
        }
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
        // Из тела запроса получаем id слова, новый рейтинг, количество правильных и неправильных ответов,
        // а также языковую пару
        const { id, rating, correctPoint, incorrectPoint, source_language, target_language } = req.body;
        
        // Если языковые параметры не переданы, используем значения по умолчанию
        const srcLang = source_language ? source_language.trim() : 'en';
        const tgtLang = target_language ? target_language.trim() : 'ru';
    
        // Обновляем запись в таблице dictionary_stats для указанного слова и языковой пары
        const result = await db.query(
            `UPDATE dictionary_stats 
             SET rating = $1, correct_answers = $3, incorrect_answers = $4 
             WHERE dictionary_id = $2 
               AND source_language = $5 
               AND target_language = $6 
             RETURNING *`,
            [rating, id, correctPoint, incorrectPoint, srcLang, tgtLang]
        );
    
        res.json(result.rows[0]);
    }
    
    async deletePair(req, res) {
        const { id } = req.params; // ID пары берется из параметров маршрута
        const { userId } = req.query; // userId передается как query-параметр
        console.log(req)
        const pair = await db.query('DELETE FROM dictionary where id = $1 AND userid = $2', [id, userId])
        res.json(pair.rows[0])
    }
    async getRandomPair(req, res) {
        // Получаем список слов, которые нужно исключить, если они переданы с фронта
        const excludeWords = typeof req.query.exclude === 'string' && req.query.exclude.trim() !== ''
            ? req.query.exclude.split(',').map(word => word.trim())
            : [];
        
        const { userId } = req.query; 
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }
        
        // Новые параметры: источник и цель перевода приходят с фронта, если их не передали, берем значения по умолчанию
        const sourceLanguage = req.query.source_language ? req.query.source_language.trim() : 'en';
        const targetLanguage = req.query.target_language ? req.query.target_language.trim() : 'ru';
    
        try {
            requestCounter++;
    
            let query;
            let params;
            
            if (requestCounter % 15 === 0) {
                // Каждый 15-й запрос: выбираем случайное слово без учета рейтинга
                query = `
                    SELECT d.*, ds.rating, ds.correct_answers, ds.incorrect_answers
                    FROM dictionary d
                    JOIN dictionary_stats ds ON ds.dictionary_id = d.id
                    WHERE d.userid = $1
                      AND ds.source_language = $2
                      AND ds.target_language = $3
                    ORDER BY RANDOM()
                    LIMIT 1
                `;
                params = [userId, sourceLanguage, targetLanguage];
            } else if (excludeWords.length > 0) {
                // Если есть список слов, которые надо исключить,
                // создаем заполнители (placeholders) для этих слов.
                // Первый набор для подзапроса:
                const placeholders1 = excludeWords.map((_, i) => `$${i + 4}`).join(',');
                // Второй набор для основного условия:
                const placeholders2 = excludeWords.map((_, i) => `$${i + 4 + excludeWords.length}`).join(',');
    
                query = `
                    SELECT d.*, ds.rating, ds.correct_answers, ds.incorrect_answers
                    FROM dictionary d
                    JOIN dictionary_stats ds ON ds.dictionary_id = d.id
                    WHERE d.userid = $1
                      AND ds.source_language = $2
                      AND ds.target_language = $3
                      AND ds.rating = (
                          SELECT MIN(ds_inner.rating)
                          FROM dictionary d2
                          JOIN dictionary_stats ds_inner ON ds_inner.dictionary_id = d2.id
                          WHERE d2.userid = $1
                            AND d2.word NOT IN (${placeholders1})
                            AND ds_inner.source_language = $2
                            AND ds_inner.target_language = $3
                      )
                      AND d.word NOT IN (${placeholders2})
                    ORDER BY RANDOM()
                    LIMIT 1
                `;
                // Формируем массив параметров:
                // $1: userId, $2: sourceLanguage, $3: targetLanguage, далее два раза список исключаемых слов
                params = [userId, sourceLanguage, targetLanguage, ...excludeWords, ...excludeWords];
            } else {
                // Стандартный запрос: выбираем слово с минимальным рейтингом
                query = `
                    SELECT d.*, ds.rating, ds.correct_answers, ds.incorrect_answers
                    FROM dictionary d
                    JOIN dictionary_stats ds ON ds.dictionary_id = d.id
                    WHERE d.userid = $1
                      AND ds.source_language = $2
                      AND ds.target_language = $3
                      AND ds.rating = (
                          SELECT MIN(ds_inner.rating)
                          FROM dictionary d2
                          JOIN dictionary_stats ds_inner ON ds_inner.dictionary_id = d2.id
                          WHERE d2.userid = $1
                            AND ds_inner.source_language = $2
                            AND ds_inner.target_language = $3
                      )
                    ORDER BY RANDOM()
                    LIMIT 1
                `;
                params = [userId, sourceLanguage, targetLanguage];
            }
    
            console.log('Query:', query, 'Params:', params);
    
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