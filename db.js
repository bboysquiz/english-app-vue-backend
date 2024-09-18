const Pool = require('pg').Pool;
const pool = new Pool({
    user: "bboysquiz",
    password: 'root',
    host: 'localhost',
    port: 5534,
    database: "dictionarydb"
})

module.exports = pool