const validator = require('validator');

exports.validEmail = (email) => validator.isEmail(email);
