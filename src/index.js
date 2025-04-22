// professional aproch

import dotenv from 'dotenv';
dotenv.config({
    path: './env'
})

import connectionDB from "./db/index.js";

connectionDB();

// basic aproch 
/* dotenv.config({
    path: "./env"
}) 
write this code in package.json script part -r dotenv/config --experimental-json-modules when use node v-19 under v-20    
*/

/* import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

import dotenv from "dotenv";
dotenv.config();

import express from 'express';

const app = express();

; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (err) => {
            console.log("ERoooor", err)
            throw err;
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listing running on port : ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("EEROORRR", error);
        throw error;
    }
})()  */