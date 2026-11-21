
const mongoose = require("mongoose");
const Lead = require("../models/Lead");


const createLead = async (req, res) => {
    try {
        const { name, email, phone, company, source, status } = req.body;

        const lead = await Lead.create({
            name,
            email,
            phone,
            company,
            source,
            status,
            user: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: "Lead created successfully",
            data: { lead },
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Create lead error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create lead",
        });
    }
};


const getLeads = async (req, res) => {
    try {
        const { search, status } = req.query;

        const filter = {
            user: req.user.id,
        };

        const allowedStatuses = [
            "New",
            "Contacted",
            "Qualified",
            "Lost",
        ];


        if (status) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status filter",
                });
            }

            filter.status = status;
        }


        if (search && search.trim()) {
            const escapedSearch = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.name = {
                $regex: escapedSearch,
                $options: "i",
            };
        }

        const leads = await Lead.find(filter).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            count: leads.length,
            data: { leads },
        });
    } catch (error) {
        console.error("Get leads error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch leads",
        });
    }
};



const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead ID",
            });
        }

        const allowedStatuses = [
            "New",
            "Contacted",
            "Qualified",
            "Lost",
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid lead status",
            });
        }

        const lead = await Lead.findOneAndUpdate(
            {
                _id: id,
                user: req.user.id,
            },
            {
                $set: { status },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lead status updated successfully",
            data: { lead },
        });
    } catch (error) {
        console.error("Update lead error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update lead status",
        });
    }
};
const getLeadById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead ID",
            });
        }

        const lead = await Lead.findOne({
            _id: id,
            user: req.user.id,
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: { lead },
        });
    } catch (error) {
        console.error("Get lead error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch lead",
        });
    }
};



const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead ID",
            });
        }

        const lead = await Lead.findOneAndDelete({
            _id: id,
            user: req.user.id,
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lead deleted successfully",
        });
    } catch (error) {
        console.error("Delete lead error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete lead",
        });
    }
};

module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
};
