const bcrypt = require("bcrypt");
const saltRounds = 10;

const hashPassword = plainTextPassword =>
    bcrypt.hash(plainTextPassword, saltRounds);

//true/false
const checkPassword = (plainTextPassword, hash) =>
    bcrypt.compare(plainTextPassword, hash);

module.exports = {
    hashPassword,
    checkPassword
};
