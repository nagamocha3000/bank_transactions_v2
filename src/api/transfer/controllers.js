const DAL = require("./DAL");
const {
    transferRequestSchema,
    transferDetailsSchema
} = require("./inputSchemas");
const { controller, makeValidator: v } = require("../utils");

const requestTransfer = controller(
    v(transferRequestSchema),
    DAL.requestTransfer
);

const cancelTransfer = controller(v(transferDetailsSchema), DAL.cancelTransfer);

const confirmTransfer = controller(
    v(transferDetailsSchema),
    DAL.confirmTransfer
);

module.exports = {
    requestTransfer,
    cancelTransfer,
    confirmTransfer
};
