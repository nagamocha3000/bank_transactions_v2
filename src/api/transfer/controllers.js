const DAL = require("./DAL");
const {
    transferRequestSchema,
    transferDetailsSchema
} = require("./inputSchemas");
const { makeValidator, ClientError } = require("../utils");
const { logger } = require("../../lib/logger");

const handleTransfer = (schema, DALfn) => {
    const validate = makeValidator(schema);
    return async _transferDetails => {
        try {
            const transferDetails = await validate(_transferDetails);
            const res = await DALfn(transferDetails);
            return res;
        } catch (err) {
            if (err instanceof ClientError) return err.toRes();
            logger.error(err);
            return ClientError.res("Unable to process transfer");
        }
    };
};

const requestTransfer = handleTransfer(
    transferRequestSchema,
    DAL.requestTransfer
);

const cancelTransfer = handleTransfer(
    transferDetailsSchema,
    DAL.cancelTransfer
);

const confirmTransfer = handleTransfer(
    transferDetailsSchema,
    DAL.confirmTransfer
);

module.exports = {
    requestTransfer,
    cancelTransfer,
    confirmTransfer
};
