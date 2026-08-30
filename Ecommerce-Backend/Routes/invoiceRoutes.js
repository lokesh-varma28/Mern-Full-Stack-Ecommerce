const express = require("express");

const router = express.Router();

const auth = require("../MiddleWare/authMiddleware");

const {
    downloadInvoice
} = require("../Controller/invoiceController");

router.get(
    "/invoice/:id",
    auth,
    downloadInvoice
);

module.exports = router;