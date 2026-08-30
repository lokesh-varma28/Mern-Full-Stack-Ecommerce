const express = require("express");

const router = express.Router();

const auth = require("../MiddleWare/authMiddleware");
const admin = require("../MiddleWare/adminMiddleware");

const {
    dashboardAnalytics
} = require("../Controller/analyticsController");

router.get(
    "/analytics",
    auth,
    admin,
    dashboardAnalytics
);

module.exports = router;