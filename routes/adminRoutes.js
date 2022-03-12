const adminRoutes = require('express').Router();

const User = require("../models/User.js");

adminRoutes.get("/getUsers", (req, res) => {
    User.find({ username: { $ne: "admin" } }).then(users => {
        res.json(users);
    }).catch(err => console.log(err));
});

adminRoutes.delete("/deleteUser/:username", (req, res) => {
    User.findOneAndDelete({ username: req.params.username }).then(() => res.json({ "success": "true" })).catch(err => console.log(err));
})

module.exports = adminRoutes;
