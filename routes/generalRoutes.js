const generalRoutes = require('express').Router();

generalRoutes.get("/viewArticles", (req, res) => {
    res.send("These are the articles");
});

module.exports = generalRoutes;