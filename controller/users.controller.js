const db = require('../db')
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_ACCESS_KEY = process.env.ACCESS_SECRET;
const SECRET_REFRESH_KEY = process.env.REFRESH_SECRET;

const generateAccessToken = (user) => {
    // Создаём токен с коротким сроком действия (например, 15 минут)
    return jwt.sign({ username: user.username }, SECRET_ACCESS_KEY, { expiresIn: '4h' });
}

const generateRefreshToken = (user) => {
    // Создаём токен с длительным сроком действия (например, 30 дней)
    return jwt.sign({ username: user.username }, SECRET_REFRESH_KEY, { expiresIn: '30d' });
}


class UsersController {
    
    async getPoints(req, res) {
        try {
            const { userId } = req.query; // Извлекаем имя пользователя из query параметров
    
            if (!userId) {
                return res.status(400).json({ success: false, message: 'userId is required' });
            }
    
            const points = await db.query('SELECT points FROM users WHERE userid = $1', [userId]);
    
            if (points.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
    
            res.json({ success: true, points: points.rows[0].points });
        } catch (error) {
            console.error('Error fetching points:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }    

    async getCorrectWords(req, res) {
        try {
            const { userId } = req.query; 
            if (!userId) {
                return res.status(400).json({ success: false, message: 'userId is required' });
            }
            const correctWords = await db.query('SELECT correct_words FROM users WHERE userid = $1', [userId])
            if (correctWords.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.json({ success: true, correct_words: correctWords.rows[0].correct_words })
        }catch(error) {
            res.json(error)
        }
    }
    async getIncorrectWords(req, res) {
        try {
            const { userId } = req.query;
            
            if (!userId) {
                return res.status(400).json({ success: false, message: 'userId is required' });
            }
            const incorrectWords = await db.query('SELECT incorrect_words FROM users WHERE userid = $1', [userId])
            if (incorrectWords.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.json({ success: true, incorrect_words: incorrectWords.rows[0].incorrect_words })
        }catch(error) {
            res.json(error)
        }
    }
    async editPoints(req, res) {
        try {
            const {userId, points} = req.body
            const userPoints = await db.query(
                'UPDATE users set points = $1 where userid = $2 RETURNING *',
                [points, userId]
            )
            res.json(userPoints.rows[0].points)
        }catch(error) {
            res.json(error)
        }
    }
    async editCorrectWords(req, res) {
        try {
            const {userId, correctWords} = req.body
            const userCorrectWords = await db.query(
                'UPDATE users set correct_words = $1 where userid = $2 RETURNING *',
                [correctWords, userId]
            )
            res.json(userCorrectWords.rows[0].correct_words)
        }catch(error) {
            res.json(error)
        }
    }
    async editIncorrectWords(req, res) {
        try {
            const {userId, incorrectWords} = req.body
            const userIncorrectWords = await db.query(
                'UPDATE users set incorrect_words = $1 where userid = $2 RETURNING *',
                [incorrectWords, userId]
            )
            res.json(userIncorrectWords.rows[0].incorrect_words)
        }catch(error) {
            res.json(error)
        }
    }
    async createUser(req, res) {
        try {
            const {username, password} = req.body
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const newUser = await db.query(
                'INSERT INTO users (username, password, points, correct_words, incorrect_words) values ($1, $2, $3, $4, $5) RETURNING *', 
                [username, hashedPassword, 0, 0, 0]
            );
                res.json(newUser.rows[0])
        } catch(error) {
            console.error(error)
            throw error
        }
    }
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const bcrypt = require('bcrypt');
            const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);
            if (user.rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }

            const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password);
            if (!isPasswordMatch) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }
    
            
                const accessToken = generateAccessToken(user.rows[0]);
                const refreshToken = generateRefreshToken(user.rows[0]);

                // Устанавливаем access токен в httpOnly cookie
                res.cookie('accessToken', accessToken, {
                    httpOnly: true,
                    secure: false, // Используйте true, если работаете через HTTPS
                    sameSite: 'strict',
                });
                // Отправляем refresh токен для сохранения в localStorage
                res.json({
                    success: true,
                    message: 'Login successful',
                    refreshToken,
                });
                await db.query('INSERT INTO refresh_tokens (token, username) VALUES ($1, $2)', [refreshToken, username]);
        } catch (error) {
            res.json(error);
        }
    }
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
    
            if (!refreshToken) {
                return res.status(401).json({ success: false, message: 'Refresh token required' });
            }
    
            // Проверяем валидность refresh токена
            jwt.verify(refreshToken, SECRET_REFRESH_KEY, async (err, user) => {
                if (err) {
                    return res.status(403).json({ success: false, message: 'Invalid refresh token' });
                }
            
                const tokenExists = await db.query('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
                if (tokenExists.rows.length === 0) {
                    return res.status(403).json({ success: false, message: 'Invalid refresh token' });
                }
            
                const newAccessToken = generateAccessToken({ username: user.username });
                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: 'strict',
                });
                res.json({ success: true, message: 'Access token refreshed' });
            });            
        } catch (error) {
            res.status(500).json(error);
        }
    }    
    async logout(req, res) {
        try {
            res.clearCookie('accessToken', {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
            });
    
            res.json({ success: true, message: 'Logout successful' });
        } catch (error) {
            res.status(500).json(error);
        }
    }
    async deleteUser(req, res) {
        try {
            const { username } = req.body;
            const deletedUser = await db.query(
                'DELETE FROM users WHERE username = $1 RETURNING *',
                [username]
            );
    
            if (deletedUser.rows.length > 0) {
                res.json({ success: true, message: 'User deleted', user: deletedUser.rows[0] });
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (error) {
            res.json(error);
        }
    }
    async updateUsername(req, res) {
        try {
            const { oldUsername, newUsername } = req.body;
            const updatedUser = await db.query(
                'UPDATE users SET username = $1 WHERE username = $2 RETURNING *',
                [newUsername, oldUsername]
            );
    
            if (updatedUser.rows.length > 0) {
                res.json({ success: true, message: 'Username updated', user: updatedUser.rows[0] });
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (error) {
            res.json(error);
        }
    }
    async updatePassword(req, res) {
        try {
            const { username, oldPassword, newPassword } = req.body;
            const user = await db.query(
                'SELECT * FROM users WHERE username = $1 AND password = $2',
                [username, oldPassword]
            );
    
            if (user.rows.length > 0) {
                const updatedUser = await db.query(
                    'UPDATE users SET password = $1 WHERE username = $2 RETURNING *',
                    [newPassword, username]
                );
                res.json({ success: true, message: 'Password updated', user: updatedUser.rows[0] });
            } else {
                res.status(401).json({ success: false, message: 'Invalid username or password' });
            }
        } catch (error) {
            res.json(error);
        }
    }
    async getCurrentUser(req, res) {
        try {
            // Используем `req.user`, который был добавлен в мидлваре `authenticateToken`
            const user = await db.query(
                'SELECT userid, username, points, correct_words, incorrect_words FROM users WHERE username = $1',
                [req.user.username]
            );
    
            if (user.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
    
            res.json({
                success: true,
                user: {
                    userId: user.rows[0].userid,
                    username: user.rows[0].username,
                    points: user.rows[0].points,
                    correctWords: user.rows[0].correct_words,
                    incorrectWords: user.rows[0].incorrect_words,
                },
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error', error });
        }
    }
    
    
}

module.exports = new UsersController()