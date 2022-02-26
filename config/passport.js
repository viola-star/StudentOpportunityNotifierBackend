const JwtStrategy = require('passport-jwt').Strategy,
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require("mongoose");

const User = require("../models/User.js");

const options = {};
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); // when user visits routes
//like login route jwt is added to HTTP authentication header, that jwt is parsed here 
options.secretOrKey = process.env.SECRET;

const usePassport = (passport) => {
    passport.use(new JwtStrategy(options, function(jwt_payload, done) {
        User.findById(jwt_payload.id, function(err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        });
    }));
}