const Validator = require("validator");
const isEmpty = require("is-empty"); // unlike Validator.isEmpty checks all data types,
// if null, undefined or value 0 it takes it as an empty value

function validateRegistrationInput(data) {
    let errors = {};

    data.firstName = !isEmpty(data.firstName) ? data.firstName : "";
    data.lastName = !isEmpty(data.lastName) ? data.lastName : "";
    data.username = !isEmpty(data.username) ? data.username : "";
    data.email = !isEmpty(data.email) ? data.email : "";
    data.password = !isEmpty(data.password) ? data.password : "";
    data.repeatedPassword = !isEmpty(data.repeatedPassword) ? data.repeatedPassword : "";

    if (Validator.isEmpty(data.firstName)) {
        errors.firstName = "First name field is required";
    }
    if (Validator.isEmpty(data.lastName)) {
        errors.lastName = "Last name field is required";
    }
    if (Validator.isEmpty(data.username)) {
        errors.username = "Username field is required";
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

    return {
        errors,
        isValid: isEmpty(errors)
    };
}

module.exports = validateRegistrationInput;