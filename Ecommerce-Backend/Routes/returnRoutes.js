

const express = require("express");

const router = express.Router();

const auth = require("../MiddleWare/authMiddleware");
const admin = require("../MiddleWare/adminMiddleware");

const {

    requestReturn,
    getMyReturns,
    getReturnRequests,
    updateReturnStatus

} = require("../Controller/returnController");

// ========================================
// CUSTOMER ROUTES
// ========================================

// Request Return

router.post(
    "/return",
    auth,
    requestReturn
);

// My Returns

router.get(
    "/return/my",
    auth,
    getMyReturns
);

// ========================================
// ADMIN ROUTES
// ========================================

// View All Return Requests

router.get(
    "/admin/returns",
    auth,
    admin,
    getReturnRequests
);

// Update Return Status

router.put(
    "/admin/returns/:id",
    auth,
    admin,
    updateReturnStatus
);

module.exports = router;