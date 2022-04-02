const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    savedArticleIds: {
        type: [mongoose.Types.ObjectId],
        required: true
    },
    collegeName: {
        type: String
    },
    yearOfGraduation: {
        type: Number
    },
    resetToken:String,
    expireToken:Date
});

module.exports = User = mongoose.model("users", UserSchema);