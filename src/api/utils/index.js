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

const validate = schema => (input = {}) =>
    new Promise((resolve, reject) => {
        const { error, value } = schema.validate(input);
        if (error) {
            reject(new ClientError(error.details[0].message));
        } else resolve(value);
    });

module.exports = { ClientError, validate };
