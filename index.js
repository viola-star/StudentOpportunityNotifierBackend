const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config();
const passport = require("passport");
const nodemailer = require("nodemailer")
let cron = require('node-cron');

const generalRoutes = require("./routes/generalRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const loggedInRoutes = require("./routes/loggedInRoutes.js");
const { default: mongoose } = require("mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use(passport.initialize());
const usePassport = require("./config/passport");
const User = require("./models/User.js");
usePassport(passport);

app.use('/api', generalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', loggedInRoutes);


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }).then(() => console.log("MongoDB connected successfully!")).catch((err) => console.log(err));

const port = process.env.port || 5000;

app.listen(port, () => {
    console.log(`App running port ${port}`);
    User.find({}).then(users => {
        users.forEach(user => {
            console.log("User is", user)

            const articleIds = user.savedArticleIds;
            console.log(articleIds);
            if (articleIds.length === 0) {
                console.log("no saved articles")
            }
            else {
                Article.find({ '_id': { $in: user.savedArticleIds } }).then(articles => {

                    let output = [];
                    articles.forEach(article => {
                        //console.log(Date.parse(article.applyBy));

                        let currTime = new Date();
                        if(currTime<= Date.parse(article.applyBy)){
                            let detail = {
                                'title': article.title,
                                'link': article.link,
                                'applyby' : article.applyBy
                            }
                            output.push(detail);
                        }
                        
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
                        tls: {
                            rejectUnauthorized: false
                        }
                    });

                    let mailOptions = {
                        from: '"Student NotifierHut" <notifierstudent123@gmail.com>', // sender address
                        to: `${user.email}`, // list of receivers
                        subject: 'Knock! Knock! Opportunities on the door', // Subject line
                        html: `<p> 
                                                <h4> ${output[0].title} </h4>
                                                <a href="${output[0].link}">Check Opportunity here!</a>
                                            </p><br>
                                            <p> 
                                                <h4> ${output[1].title} </h4>
                                                <a href="${output[1].link}">Check Opportunity here!</a>
                                            </p><br>
                                            `
                    };

                    /*cron.schedule('0 0 * * * 7',() => {
                    
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message sent: %s', info.messageId);   
                            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                        });
 
                    })*/

                    //notification in every 1 minute
                    
                    cron.schedule('*/5 * * * *',() => {
                    
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                return console.log(error);
                            }
                            console.log('Message sent: %s', info.messageId);   
                            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
                        });
 
                    })
                    

                });

            }
        });
    });
});
