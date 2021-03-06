const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generalRoutes = require('express').Router();
const mongoose = require("mongoose");
const cheerio = require('cheerio');
const { default: axios } = require("axios");
const nodemailer = require('nodemailer');
let cron = require('node-cron');
const crypto = require('crypto');

const validateRegistrationInput = require("../validation/registerValidation.js");
const validateLoginInput = require("../validation/loginValidation.js");

const User = require("../models/User.js");
const Article = require('../models/Article.js');
const { json } = require("body-parser");
const { request } = require("express");

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
        const start_date = $(ele).find('div.individual_internship_details.individual_internship_job > div > div:nth-child(0) > div > div.item_body').text();
        const ctc =  "₹" + $(ele).find("div.individual_internship_details.individual_internship_job > div > div:nth-child(1) > div:nth-child(2) > div.item_body").text().replace(/\s\s+/g, "");
        const apply_by = $(ele).find("div.individual_internship_details.individual_internship_job > div > div:nth-child(2) > div > div.item_body").text();
        //console.log(title , link , location , start_date ,apply_by, stipend);
        //put in array format
        let job = {
            'title': title,
            'link': link,
            'location': location,
            'start_date' : "Immediately",
            'apply_by': apply_by,
            'CTC': ctc
        }
        placements.push(job);
    })

    return placements;
}

generalRoutes.get("/viewArticles", async (req, res) => {
    return await axios.all([
        axios.get('https://internshala.com/internships'),
        axios.get('https://internshala.com/jobs') // SUBSTITUTE WITH URL2
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
                User.findOne({ email: req.body.email }).then(user => {
                    if (user) {
                        res.status(400).json({ email: "An account with this email already exists!" });
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
                                pass: 'miniProj@123'  
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
                            name: user.name,
                            username: user.username,
                            email: user.email,
                            savedArticleIds: user.savedArticleIds,
                            collegeName: user.collegeName ? user.collegeName : "",
                            yearOfGraduation: user.yearOfGraduation ? user.yearOfGraduation : ""
                        }
                        
                        /*const articleIds = user.savedArticleIds;
                        console.log(articleIds);
                        if(articleIds.length === 0){
                            console.log("no saved articles")
                        }
                        else{

                            Article.find({'_id' : {$in : user.savedArticleIds}}).then(articles =>{

                                let output = [];
                                articles.forEach(article =>{
                                    //console.log(article.title);
                                    let detail = {
                                        'title' : article.title,
                                        'link' : article.link
                                    }
                                    output.push(detail);
                                })
                                console.log(output);
    
                                let transporter = nodemailer.createTransport({
                                    host: 'smtp.gmail.com',
                                    port: 587,
                                    secure: false, // true for 465, false for other ports
                                    auth: {
                                        user: 'notifierstudent123@gmail.com', 
                                        pass: 'miniProj@123'  
                                    },
                                    tls:{
                                    rejectUnauthorized:false
                                    }
                                });
        
                                let mailOptions = {
                                    from: '"Student NotifierHut" <notifierstudent123@gmail.com>', // sender address
                                    to: `${user.email}`, // list of receivers
                                    subject: 'Knock! Knock! Opportunities on the door', // Subject line
                                    html : `<p> 
                                                <h4> ${output[0].title} </h4>
                                                <a href="${output[0].link}">Check Opportunity here!</a>
                                            </p><br>
                                            <p> 
                                                <h4> ${output[1].title} </h4>
                                                <a href="${output[1].link}">Check Opportunity here!</a>
                                            </p><br>
                                            `
                                };
    
                                cron.schedule('0 0 * * * 7',() => {
                                
                                    transporter.sendMail(mailOptions, (error, info) => {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        console.log('Message sent: %s', info.messageId);   
                                        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                                    });
    
                                })

                                //notification in every 1 minute
                                 
                                cron.schedule('* * * * *',() => {
                                
                                    transporter.sendMail(mailOptions, (error, info) => {
                                        if (error) {
                                            return console.log(error);
                                        }
                                        console.log('Message sent: %s', info.messageId);   
                                        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                                    });
    
                                })
                                 
                                
                            });
    
                        }*/
                                
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

generalRoutes.post("/reset-password", (req,res) =>{
    crypto.randomBytes(32,(err,buffer) => {
        if(err){
            console.log(err);
        }
        const token = buffer.toString('hex');
        User.findOne({email:req.body.email}).then(user => {
            if(!user){
                return res.status(422).json({error:"User with this email doesn't exists"});
            }
            user.resetToken = token;
            user.expireToken = Date.now() + 3600000
            console.log(user.resetToken , user.expireToken)
            user.save().then((result) => {
                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: 'notifierstudent123@gmail.com', 
                        pass: 'miniProj@123'  
                    },
                    tls:{
                    rejectUnauthorized:false
                    }
                });

                // setup email data 
                let mailOptions = {
                    from: '"Student NotifierHut" <notifierstudent123@gmail.com>', // sender address
                    to: `${req.body.email}`, // list of receivers
                    subject: 'password reset', // Subject line
                    html: `
                    <p>You requested for password reset</p>
                    <h5>click in this <a href="${process.env.CLIENT_URL}/reset/${token}">link</a> to reset password</h5>
                    `
                };

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);   
                    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                });
                res.json({message :"Check your email"});
            })
        })
    })
});

generalRoutes.post('/update-password',(req,res)=>{
    console.log(req.body)
    const newPassword = req.body.password;
    const sentToken = req.body.token;
    console.log(sentToken);
    User.findOne({resetToken : req.body.token, expireToken : {$gt:Date.now()}}).then(user=>{
        if(!user){
            return res.status(422).json({err:"Token expired!"});
        }
        bcrypt.hash(newPassword,12).then(hashedPassword=>{
            user.password = hashedPassword
            user.resetToken = undefined
            user.expireToken = undefined
            user.save().then((saveduser) =>{
                res.json({message:"password updated successfully"})
            })
        })
    }).catch(err =>{
        console.log(err);
    })
});

module.exports = generalRoutes;
