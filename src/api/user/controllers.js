const { validateNewUser } = require("./validators");
const { hashPassword } = require("./utils");
const DAL = require("./DAL");

//returns res obj with either userID or error property
const createNewUser = async userDetails => {
    const newUser = await validateNewUser(userDetails);
    newUser.password = await hashPassword(newUser.password);
    const res = await DAL.createNewUser(newUser);
    return res;
};

module.exports = { createNewUser };
