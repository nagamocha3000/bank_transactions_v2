const { logger } = require("../logger");

const handleError = err => {
    logger.error(err);
};

/*
operational errors, marked as so, are 'trusted errors'
ie errors already sort of expected to occur, logging suffices
logging ought to suffice.
For further info: https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/operationalvsprogrammererror.md
*/
const markAsOperationalError = err => {
    err.isOperationalError = true;
    return err;
};

const genClientErrors = (() => {
    function ClientError(errCode) {
        Error.call(this);
        this.isClientErr = true;
        this.isOperationalError = true;
        this.errCode = errCode;
    }
    ClientError.prototype = Object.create(Error.prototype);
    ClientError.prototype.constructor = ClientError;

    return (errCodes = []) => {
        const generatedErrs = errCodes.reduce(
            (acc, errCode) => ({
                ...acc,
                [errCode]: new ClientError(errCode)
            }),
            Object.create(null)
        );
        return generatedErrs;
    };
})();

const isUntrustedError = err => !err.isOperationalError;

module.exports = {
    handleError,
    markAsOperationalError,
    isUntrustedError,
    genClientErrors
};
