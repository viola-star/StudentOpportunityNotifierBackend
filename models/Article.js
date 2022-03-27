const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    applyBy: {
        type: String,
        required: true
    },
    stipend: {
        type: String,
        required: true
    },
});

module.exports = Article = mongoose.model("articles", ArticleSchema);