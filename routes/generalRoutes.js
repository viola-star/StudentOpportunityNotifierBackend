const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generalRoutes = require('express').Router();
const mongoose = require("mongoose");
const cheerio = require('cheerio');
const { default: axios } = require("axios");

const validateRegistrationInput = require("../validation/registerValidation.js");
const validateLoginInput = require("../validation/loginValidation.js");

const User = require("../models/User.js");

const getScrapedIntershipData = (data) => {
    let internships = [];
    let $ = cheerio.load(data);

    $('.internship_meta').each((i, ele) => {
        //get title , link to apply , location , start date , apply date , stipend
        const title = $(ele).find('.heading_4_5 a').text();
        const link = "https://internshala.com" + $(ele).find('a').attr('href');
        const location = $(ele).find('#location_names').text().replace(/\s\s+/g, "");
        const start_date = $(ele).find('.start_immediately_desktop').text();
        const apply_by = $(ele).find(".apply_by .item_body").text();
        const stipend = "₹" + $(ele).find(".stipend").text();
        //console.log(title , link , location , start_date ,apply_by, stipend);
        //put in array format
        let internship = {
            'title': title,
            'link': link,
            'location': location,
            'start_date': start_date,
            'apply_by': apply_by,
            'stipend': stipend
        }
        internships.push(internship);
    })

    return internships;
}

const getScrapedPlacementData = (data) => {
    let placements = [];
    let $ = cheerio.load(data);

    $('.internship_meta').each((i, ele) => {
        //get title , link to apply , location , start date , apply date , stipend
        const title = $(ele).find('.heading_4_5 a').text();
        const link = "https://internshala.com" + $(ele).find('a').attr('href');
        const location = $(ele).find('#location_names').text().replace(/\s\s+/g, "");
        const start_date = $(ele).find('.start_immediately_desktop').text();
        const apply_by = $(ele).find(".apply_by .item_body").text();
        const stipend = "₹" + $(ele).find(".stipend").text();
        //console.log(title , link , location , start_date ,apply_by, stipend);
        //put in array format
        let internship = {
            'title': title,
            'link': link,
            'location': location,
            'start_date': start_date,
            'apply_by': apply_by,
            'stipend': stipend
        }
        placements.push(internship);
    })

    return placements;
}

generalRoutes.get("/viewArticles", async (req, res) => {
    return await axios.all([
        axios.get('https://internshala.com/internships'),
        axios.get('https://internshala.com/internships') // SUBSTITUTE WITH URL2
    ]).then(axios.spread((response1, response2) => {
        scrapedArticles = getScrapedIntershipData(response1.data).concat(getScrapedPlacementData(response2.data));
        res.json(scrapedArticles);
    })).catch(err => console.log(err));
});

generalRoutes.post("/register", (req, res) => {
    const validation = validateRegistrationInput(req.body);
    if (validation.isValid) {
        User.findOne({ username: req.body.username }).then(user => {
            if (user) {
                res.status(400).json({ username: "An account with this username already exists!" });
            } else {
                const userToBeAdded = new User({
                    name: req.body.name, 
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
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
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
                                res.json({ success: true, token: token });
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