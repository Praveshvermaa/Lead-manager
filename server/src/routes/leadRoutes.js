
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
} = require("../controllers/leadController");


router.use(authMiddleware);

router.route("/")
    .post(createLead)
    .get(getLeads);

router.route("/:id")
    .get(getLeadById)
    .put(updateLead)
    .delete(deleteLead);

module.exports = router;
