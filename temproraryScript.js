const bcrypt = require('bcrypt');
const { Pool } = require('pg'); // Подключение к вашей базе данных PostgreSQL

const pool = new Pool({
    connectionString: 'postgresql://dictionarydb_owner:8mMaJkO4AoDy@ep-delicate-salad-a5bzsubm.us-east-2.aws.neon.tech/dictionarydb?sslmode=require',
    ssl: false
});

const hashPassword = async () => {
    try {
        const userId = 1; // ID пользователя, чью запись вы хотите обновить
        const plainPassword = 'dsi725VLn3'; // Пароль, который вы хотите хешировать

        // Хешируем пароль
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

        // Обновляем запись в базе данных
        const query = 'UPDATE users SET password = $1 WHERE userid = $2';
        const values = [hashedPassword, userId];

        await pool.query(query, values);
        console.log('Пароль успешно обновлён и хеширован.');

        // Закрываем соединение
        await pool.end();
    } catch (error) {
        console.error('Ошибка при обновлении пароля:', error);
    }
};

hashPassword();
