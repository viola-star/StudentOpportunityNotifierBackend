const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
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
    }
});

module.exports = User = mongoose.model("users", UserSchema);