import app from "./app.js";
import dbConnection from "./db/server.js";
import dotenv from "dotenv";

dotenv.config({
    path: './env'
})

const port = process.env.PORT || 8000;

dbConnection()
    .then(() => {
        app.on('error', (err) => {
            console.log("Server connection running failed", err)
            throw err;
        })

        app.listen(port, () => {
            console.log(`Server running on this port :${port}`);

        })
    })
    .catch((err) => {
        console.log("MONGODB connection ERrror", err);
    })