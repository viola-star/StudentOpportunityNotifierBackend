const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const port = 5000;

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.listen(port, () => {
    console.log(`App running port ${port}`);
});
