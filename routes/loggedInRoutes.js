const loggedInRoutes = require('express').Router();
const mongoose = require("mongoose");
const Article = require('../models/Article.js');

const User = require("../models/User.js");

loggedInRoutes.post("/saveArticle", (req, res) => {
    const userId = req.body.userId
    const article = req.body.article

    const articleToBeSaved = new Article({
        title: article.title,
        link: article.link,
        location: article.location,
        stipend: article.stipend,
        applyBy: article.apply_by
    });
    articleToBeSaved.save().then(savedArticle => {
        User.findByIdAndUpdate(mongoose.Types.ObjectId(userId), { $push: { savedArticleIds: savedArticle._id } }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.status(200).json({ success: "true", articleId: savedArticle._id });
            }
        });
    })
});

module.exports = loggedInRoutes;