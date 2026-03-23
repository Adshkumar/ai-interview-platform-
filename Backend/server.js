require("dotenv").config();
const app = require("./app");
const connectToDB = require("./db/db");

connectToDB();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});