const DAL = require("./DAL");
const {
    transferRequestSchema,
    transferFinalizeSchema,
    accountDetailsSchema
} = require("./inputSchemas");
const { controller, makeValidator: v } = require("../utils");

const requestTransfer = controller(
    v(transferRequestSchema),
    DAL.requestTransfer
);

const finalizeTransfer = controller(
    v(transferFinalizeSchema),
    DAL.finalizeTransfer
);

const getPendingTransfers = controller(
    v(accountDetailsSchema),
    DAL.getPendingTransfers
);

module.exports = {
    requestTransfer,
    finalizeTransfer,
    getPendingTransfers
};
