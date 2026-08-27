const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  submitChangeRequest,
  respondToChangeRequest,
  getAllChangeRequests,
  getClientChangeRequests,
  deleteChangeRequest,
} = require("../controllers/changeRequest.controller");

// -------------------
// Client routes
// -------------------
router.post("/submit", protect, authorize("client"), submitChangeRequest);
router.get("/my-requests", protect, authorize("client"), getClientChangeRequests);

// -------------------
// Admin routes
// -------------------
router.get("/all", protect, authorize("admin"), getAllChangeRequests);
router.put("/respond/:requestId", protect, authorize("admin"), respondToChangeRequest);

// -------------------
// Shared
// -------------------
router.delete("/:id", protect, deleteChangeRequest);

module.exports = router;
