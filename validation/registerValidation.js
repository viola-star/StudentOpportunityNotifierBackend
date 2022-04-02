const Validator = require("validator");
const isEmpty = require("is-empty"); // unlike Validator.isEmpty checks all data types,
const { options } = require("request");
// if null, undefined or value 0 it takes it as an empty value

function validateRegistrationInput(data) {
    let errors = {};

    data.name = !isEmpty(data.name) ? data.name : "";
    data.username = !isEmpty(data.username) ? data.username : "";
    data.email = !isEmpty(data.email) ? data.email : "";
    data.password = !isEmpty(data.password) ? data.password : "";
    data.repeatedPassword = !isEmpty(data.repeatedPassword) ? data.repeatedPassword : "";
    data.collegeName = !isEmpty(data.collegeName) ? data.collegeName : "";
    data.yearOfGraduation = !isEmpty(data.yearOfGraduation) ? data.yearOfGraduation : "";

    if (Validator.isEmpty(data.name)) {
        errors.name = "Name field is required";
    } else {
        if (!Validator.isAlpha(data.name, 'en-US', {ignore: ' '})) {
            errors.name = "Name is not valid!";
        } 
    }
    if (Validator.isEmpty(data.username)) {
        errors.username = "Username field is required";
    }
    if (!Validator.isAlphanumeric(data.username) || !Validator.isAlpha(data.username.substring(0, 1))) {
        errors.username = "Username must have only letters and digits and must start with a letter";
    }

    if (Validator.isEmpty(data.email)) {
        errors.email = "Email field is required.";
    } else if (!Validator.isEmail(data.email)) {
        errors.email = "Email id is invalid.";
    }

    if (Validator.isEmpty(data.password)) {
        errors.password = "Password field is required";
    }
    if (Validator.isEmpty(data.repeatedPassword)) {
        errors.repeatedPassword = "Repeated password field is required";
    }

    if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
        errors.password = "Password must be at least 6 characters at maximum 30 characters long";
    }
    if (!Validator.equals(data.password, data.repeatedPassword)) {
        errors.repeatedPassword = "Passwords must match";
    }

    if (!Validator.isEmpty(data.collegeName)) {
        if (!Validator.isAlpha(data.collegeName, 'en-US', {ignore: ' '})) {
            errors.collegeName = "College name is not valid!";
        }
    }
    if (!Validator.isEmpty(data.yearOfGraduation)) {
        if (!Validator.isInt(data.yearOfGraduation, {gt: 1900, lt: 2100})) {
            errors.yearOfGraduation = "Year of graduation is invalid and/or not in yyyy form!";
        }
    }

    return {
        errors,
        isValid: isEmpty(errors)
    };
}

module.exports = validateRegistrationInput;