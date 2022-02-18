const generalRoutes = require('express').Router();

generalRoutes.get("/viewArticles", (req, res) => {
    const date = new Date();// for testing purposes
    const scrapedArticles = [{ "field1": "Hello World1", "hours": date.getHours(), "minutes": date.getMinutes(), "seconds": date.getSeconds() }, { "field1": "Hello World2" }];
    res.json(scrapedArticles);
});

module.exports = generalRoutes;