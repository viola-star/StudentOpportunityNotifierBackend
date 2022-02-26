const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generalRoutes = require('express').Router();
const mongoose = require("mongoose");

const validateRegistrationInput = require("../validation/registerValidation.js");

const User = require("../models/User.js");

generalRoutes.get("/viewArticles", (req, res) => {
    const date = new Date();// for testing purposes
    const scrapedArticles = [{ "field1": "Hello World1", "hours": date.getHours(), "minutes": date.getMinutes(), "seconds": date.getSeconds() }, { "field1": "Hello World2" }];
    res.json(scrapedArticles);
});

generalRoutes.post("/register", (req, res) => {
    const validation = validateRegistrationInput(req.body);
    if (validation.isValid) {
        User.findOne({ email: req.body.email }).then(user => {
            if (user) {
                res.status(400).json({ email: "An account with this email address already exists!" });
            } else {
                const userToBeAdded = new User({
                    email: req.body.email,
                    password: req.body.password,
                    savedArticleIds: []
                });
                if (req.body.collegeName) {
                    userToBeAdded.collegeName = req.body.collegeName;
                }
                if (req.body.yearOfGraduation) {
                    userToBeAdded.yearOfGraduation = req.body.yearOfGraduation;
                }

                const noOfSaltRounds = 10;
                bcrypt.genSalt(noOfSaltRounds, (error, salt) => {
                    bcrypt.hash(req.body.password, salt, (err, hashedPassword) => {
                        userToBeAdded.password = hashedPassword;
                        userToBeAdded.save().then(user => {
                            res.json(user);
                        }).catch(err => console.log(err));
                    });
                });
            }
        });
    } else {
        res.status(400).json(validation.errors);
    }
});

module.exports = generalRoutes;