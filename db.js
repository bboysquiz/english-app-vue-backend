const Pool = require('pg').Pool;
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL ,
})

module.exports = pool