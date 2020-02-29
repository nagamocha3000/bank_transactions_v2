const express = require("express");
const { parseJSONMiddleware } = require("./utils");
const { transferControllers } = require("./transfer");
const api = express.Router();

const asyncRouteWrapper = routerFn => (req, res, next) =>
    Promise.resolve(routerFn(req, res)).catch(next);

api.use(parseJSONMiddleware);

api.post(
    "/transfers/requests",
    asyncRouteWrapper(async (req, res) => {
        const details = req.body;
        const result = await transferControllers.requestTransfer(details);
        res.json(result);
    })
);

api.put(
    "/transfers/finalize",
    asyncRouteWrapper(async (req, res) => {
        const details = req.body;
        const result = await transferControllers.finalizeTransfer(details);
        res.json(result);
    })
);

api.get(
    "/accounts/:accountID/pending_transfers",
    asyncRouteWrapper(async (req, res) => {
        const accountID = parseInt(req.params.accountID, 10);
        const pendingTransfers = await transferControllers.getPendingTransfers({
            accountID
        });
        res.json(pendingTransfers);
    })
);

module.exports = { api };
