const express = require("express");
const router = express.Router();

const {
    getCategories
} = require("../Controller/categoryController");

router.get("/categories", getCategories);

module.exports = router;