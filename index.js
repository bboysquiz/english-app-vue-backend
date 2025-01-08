require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser'); 
const dictionaryRouter = require('./routes/dictionary.routes')
const usersRouter = require('./routes/users.routes')
const port = 3000;

const allowedOrigins = [
    'http://127.0.0.1:5173', // Local frontend for development
    'https://comforting-heliotrope-d9d869.netlify.app' // Production frontend
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like Postman or server-to-server requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Allow credentials such as cookies
}));
app.use(express.json())
app.use(cookieParser());
app.use('/api', dictionaryRouter)
app.use('/api', usersRouter)

app.listen(port, () => {
    console.log('Server is running')
})