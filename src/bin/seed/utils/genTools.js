const faker = require("faker");

//generate fake user data
//faker.seed(54321);

function User(firstname, lastname) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = `${firstname}.${lastname}@email.com`;
    this.password = this.email.split("@")[0];
}
User.prototype.toString = function _toString() {
    return `(${this.irstname}, ${this.lastname}, ${this.email})`;
};

const genRandomUser = () => {
    const firstname = faker.name.firstName();
    const lastname = faker.name.lastName();
    return new User(firstname, lastname);
};

const randInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const amountFn = ({ upper, lower, useRandom, constAmount }) => {
    let max = upper;
    let min = lower;
    if (useRandom) {
        return () =>
            Math.round(
                (Math.random() * (max - min) + min + Number.EPSILON) * 100
            ) / 100;
    } else {
        return () => constAmount;
    }
};

const timer = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { genRandomUser, randInt, amountFn, timer };
