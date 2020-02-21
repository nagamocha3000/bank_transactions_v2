function ClientError(message) {
    Error.call(this);
    Error.captureStackTrace(this);
    this.isClientErr = true;
    this.isOperationalError = true;
    this.message = message;
}

ClientError.prototype = Object.create(Error.prototype);
ClientError.prototype.constructor = ClientError;
ClientError.prototype.toRes = function _toRes() {
    return ClientError.res(this.message);
};
ClientError.res = function _res(message = "error") {
    return { error: { message } };
};

const makeValidator = schema => (input = {}) =>
    new Promise((resolve, reject) => {
        const { error, value } = schema.validate(input);
        if (error) {
            reject(new ClientError(error.details[0].message));
        } else resolve(value);
    });

//The maximum is exclusive and the minimum is inclusive
const randInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};
const timer = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { ClientError, makeValidator, randInt, timer };
