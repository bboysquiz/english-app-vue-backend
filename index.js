const express = require('express');
const app = express();
const cors = require('cors');
const dictionaryRouter = require('./routes/dictionary.routes')
const usersRouter = require('./routes/users.routes')
const port = 3000;

app.use(cors());
app.use(express.json())
app.use('/api', dictionaryRouter)
app.use('/api', usersRouter)

app.listen(port, () => {
    console.log('Server is running')
})