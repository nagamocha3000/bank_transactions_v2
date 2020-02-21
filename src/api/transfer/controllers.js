const DAL = require("./DAL");
const {
    transferRequestSchema,
    transferDetailsSchema
} = require("./inputSchemas");
const { controller } = require("../utils");

const requestTransfer = controller(transferRequestSchema, DAL.requestTransfer);

const cancelTransfer = controller(transferDetailsSchema, DAL.cancelTransfer);

const confirmTransfer = controller(transferDetailsSchema, DAL.confirmTransfer);

module.exports = {
    requestTransfer,
    cancelTransfer,
    confirmTransfer
};
