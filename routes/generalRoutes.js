const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generalRoutes = require('express').Router();
const mongoose = require("mongoose");

const validateRegistrationInput = require("../validation/registerValidation.js");
const validateLoginInput = require("../validation/loginValidation.js");

const User = require("../models/User.js");

generalRoutes.get("/viewArticles", (req, res) => {
    const date = new Date();// for testing purposes
    const scrapedArticles = [{ "field1": "Hello World1", "hours": date.getHours(), "minutes": date.getMinutes(), "seconds": date.getSeconds() }, { "field1": "Hello World2" }];
    res.json(scrapedArticles);
});

generalRoutes.post("/register", (req, res) => {
    const validation = validateRegistrationInput(req.body);
    if (validation.isValid) {
        User.findOne({ username: req.body.username }).then(user => {
            if (user) {
                res.status(400).json({ username: "An account with this username already exists!" });
            } else {
                const userToBeAdded = new User({
                    username: req.body.username,
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

generalRoutes.post("/login", (req, res) => {
    const validation = validateLoginInput(req.body);
    if (validation.isValid) {
        User.findOne({ username: req.body.username }).then(user => {
            if (user) {
                bcrypt.compare(req.body.password, user.password, function (err, result) {
                    if (result) {
                        const jwtPayload = {
                            id: user._id,
                            username: user.username,
                            email: user.email,
                            savedArticleIds: user.savedArticleIds,
                            collegeName: user.collegeName ? user.collegeName : "",
                            yearOfGraduation: user.yearOfGraduation ? user.yearOfGraduation : ""
                        }

                        let expirationSeconds = 31556926; // 1 year
                        jwt.sign(jwtPayload, process.env.SECRET, {
                            expiresIn: expirationSeconds,
                        }, (err, token) => {
                            if (!err) {
                                res.json({success: true, token: token});
                            }
                        });
                    }
                    else {
                        res.status(400).json({ password: "Password is incorrect!" });
                    }
                });
            } else {
                res.status(404).json({ username: "Account with given username not found!" });
            }
        });
    } else {
        res.status(400).json(validation.errors);
    }
});

module.exports = generalRoutes;