const express = require("express");

const {
  getAllProducts,
  getSingleProduct,
  addNewProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  getRecommendedProducts,
   addReview
} = require("../Controller/ProductController");

const authMiddleware = require("../MiddleWare/authMiddleware");
const adminMiddleware = require("../MiddleWare/adminMiddleware");
const upload = require("../MiddleWare/imageMiddleware");

const router = express.Router();


router.get("/", getAllProducts);

router.get("/related/:id", getRelatedProducts);
router.get(
    "/recommend/:id",
    getRecommendedProducts
);

// router.get("/:id", authMiddleware, getSingleProduct);
router.get("/:id", getSingleProduct);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  addNewProduct
);


router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateProduct
);


router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteProduct
);
// ================= ADD REVIEW =================

router.post(
    "/:id/review",
    authMiddleware,
    addReview
);

module.exports = router;