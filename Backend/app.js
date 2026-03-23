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

app.use(cors({
    origin: 'http://localhost:5173',
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