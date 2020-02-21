const DAL = require("./DAL");
const { transferRequestSchema } = require("./inputSchemas");
const { validate, ClientError } = require("../utils");
const { logger } = require("../../lib/logger");

const requestTransfer = (() => {
    const validateTransferRequest = validate(transferRequestSchema);
    return async transferDetails => {
        try {
            const transferReqDetails = await validateTransferRequest(
                transferDetails
            );
            const res = await DAL.requestTransfer(transferReqDetails);
            return res;
        } catch (err) {
            if (err instanceof ClientError) return err.toRes();
            logger.error(err);
            return ClientError.res("Unable to create transfer request");
        }
    };
})();

const main = async () => {
    const transferDetails = {
        from: 1,
        to: 2,
        amount: 100
    };
    const res = await requestTransfer(transferDetails);
    console.log(JSON.stringify(res));
};

main().catch(err => {
    console.log("ERROR ON MAIN");
    console.error(err);
});
