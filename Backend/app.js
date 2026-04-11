const dotenv = require("dotenv");
dotenv.config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
var authRouter = require('./routes/auth.routes');
const interviewRouter = require('./routes/interview.routes');

var app = express();

// Support multiple comma-separated FRONTEND URLs via env var
const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
    : [];

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://ai-interview-platform-xi-ashen.vercel.app',
    ...envOrigins,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (Postman, curl, mobile apps, Render health checks)
        if (!origin) return callback(null, true);
        // Allow any vercel.app preview/deployment URL for this project
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn('CORS blocked origin:', origin);
        return callback(new Error('CORS not allowed for: ' + origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)


module.exports = app;