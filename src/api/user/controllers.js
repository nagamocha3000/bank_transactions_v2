const { validateNewUser } = require("./validators");
const { hashPassword } = require("./utils");
const DAL = require("./DAL");

//returns res obj with either userID or error property
const createNewUser = async userDetails => {
    const user = await validateNewUser(userDetails);
    user.password = await hashPassword(user.password);
    const res = await DAL.createNewUser(user);
    return res;
};

module.exports = { createNewUser };
