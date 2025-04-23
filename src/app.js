import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// middlewares 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" })) // this middleware used for handle url req, res ... extended means object throw based object..

app.use(express.static("public")) // used for store file or img in my local server

app.use(cookieParser()); // for used set and get secure cookie

export default app;