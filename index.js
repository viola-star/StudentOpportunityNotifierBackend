const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config();

const generalRoutes = require("./routes/generalRoutes.js");
const { default: mongoose } = require("mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors()); 
app.use('/api', generalRoutes); 

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }).then(() => console.log("MongoDB connected successfully!")).catch((err) => console.log(err));
 
const port = process.env.port || 5000;

app.listen(port, () => {
    console.log(`App running port ${port}`);
});
