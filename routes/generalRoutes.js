const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generalRoutes = require('express').Router();
const mongoose = require("mongoose");
const cheerio = require('cheerio');
const { default: axios } = require("axios");
const nodemailer = require('nodemailer');

const validateRegistrationInput = require("../validation/registerValidation.js");
const validateLoginInput = require("../validation/loginValidation.js");

const User = require("../models/User.js");
const { json } = require("body-parser");
const { request } = require("express");

generalRoutes.get("/viewArticles", async (req, res) => {
    return await axios.get('https://internshala.com/internships').then(response => {
        let internships = [];
        let $ = cheerio.load(response.data);

        $('.internship_meta').each((i,ele)=>{


            //get title , link to apply , location , start date , apply date , stipend
            const title = $(ele).find('.heading_4_5 a').text();
            const link = "https://internshala.com"+ $(ele).find('a').attr('href');
            const location = $(ele).find('#location_names').text().replace(/\s\s+/g,"");
            const start_date = $(ele).find('.start_immediately_desktop').text();
            const apply_by = $(ele).find( ".apply_by .item_body").text();
            const stipend = "₹" + $(ele).find( ".stipend").text();
            //console.log(title , link , location , start_date ,apply_by, stipend);

            //put in array format
            let internship = {
                'title' : title,
                'link' : link,
                'location' : location,
                'start_date' : start_date,
                'apply_by' : apply_by,
                'stipend' : stipend
            }
            internships.push(internship);
        })
        res.json(internships);
    }).catch(err => console.log(err));
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

                const output = `
                    <h3>Thank you for registering ${req.body.username}!</h3>
                    <p>Now sit back & relax , let us bring opportunities to you</p>
                `;

                //sent email to user on successful registration 
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: 'notifierstudent123@gmail.com', 
                        pass: 'miniProj123'  
                    },
                    tls:{
                    rejectUnauthorized:false
                    }
                });

                // setup email data 
                let mailOptions = {
                    from: '"Student NotifierHut" <notifierstudent123@gmail.com>', // sender address
                    to: `${req.body.email}`, // list of receivers
                    subject: 'Registration successful!', // Subject line
                    html: output // html body
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);   
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                    //res.render('contact', {msg:'Email has been sent'});
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