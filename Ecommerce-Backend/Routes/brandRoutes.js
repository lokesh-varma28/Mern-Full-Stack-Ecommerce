const express = require("express");
const router = express.Router();

const {
    getBrands
} = require("../Controller/brandController");

router.get("/brands", getBrands);

module.exports = router;