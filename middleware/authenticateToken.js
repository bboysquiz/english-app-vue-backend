const jwt = require('jsonwebtoken');
const SECRET_ACCESS_KEY = process.env.ACCESS_SECRET;

function authenticateToken(req, res, next) {
    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, SECRET_ACCESS_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid access token' });
        }

        req.user = user; // Сохраняем данные пользователя для использования в роуте
        next();
    });
}

module.exports = authenticateToken;
