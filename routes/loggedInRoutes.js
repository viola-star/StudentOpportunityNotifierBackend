const loggedInRoutes = require('express').Router();
const mongoose = require("mongoose");
const Article = require('../models/Article.js');

const User = require("../models/User.js");

loggedInRoutes.get("/:userId/getSavedArticles", (req, res) => {
    userId = req.params.userId;
    User.findById(userId, (err, user) => {
        if (user) {
            Article.find({
                '_id': { $in: user.savedArticleIds }
            }, function (err, articles) {
                if (err) {
                    res.status(400).json({ error: err });
                } else {
                    res.status(200).json({ success: "true", articles: articles });
                }
            })
        } else {
            //console.log("Not found")
            res.status(400).json({ error: "User not found" });
        }
    })
});

loggedInRoutes.post("/saveArticle", (req, res) => {
    const userId = req.body.userId
    const givenArticle = req.body.article

    Article.findOne({ link: { $eq: givenArticle.link } }).then((article) => {
        if (!article) {
            const articleToBeSaved = new Article({
                title: givenArticle.title,
                link: givenArticle.link,
                location: givenArticle.location,
                stipend: givenArticle.stipend,
                applyBy: givenArticle.apply_by
            });

            articleToBeSaved.save().then(savedArticle => {
                User.findByIdAndUpdate(mongoose.Types.ObjectId(userId), { $push: { savedArticleIds: savedArticle._id } }, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.status(400).json({ error: err });
                    } else {
                        res.status(200).json({ success: "true", articleId: savedArticle._id });
                    }
                });
            })
        } else {
            User.findByIdAndUpdate(mongoose.Types.ObjectId(userId), { $addToSet: { savedArticleIds: article._id } }, (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(400).json({ error: err });
                } else {
                    res.status(200).json({ success: "true", articleId: article._id });
                }
            });
        }
    })
});

loggedInRoutes.delete("/deleteSavedArticle", (req, res) => {
    const userId = req.body.userId;
    const articleId = req.body.articleId;
    User.updateOne({_id: userId}, {$pull: {"savedArticleIds": {$in : [articleId]}}}, (error, user) => {
        if (error) {
            console.log(error); 
            res.status(400).json({ error: error });
        } else {
            res.status(200).json({ success: "true" })
        }
    })
})

module.exports = loggedInRoutes;