
const mongoose = require("mongoose");

const LEAD_STATUSES = [
    "New",
    "Contacted",
    "Qualified",
    "Lost",
];

const LEAD_SOURCES = [
    "Website",
    "Referral",
    "LinkedIn",
    "Cold Call",
    "Other",
];

const leadSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Lead owner is required"],
        },
        name: {
            type: String,
            required: [true, "Lead name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            maxlength: [254, "Email cannot exceed 254 characters"],
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address",
            ],
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            maxlength: [20, "Phone number cannot exceed 20 characters"],
            match: [
                /^\+?[0-9\s()-]{7,20}$/,
                "Please provide a valid phone number",
            ],
        },

        company: {
            type: String,
            required: [true, "Company is required"],
            trim: true,
            maxlength: [100, "Company cannot exceed 100 characters"],
        },

        source: {
            type: String,
            required: [true, "Lead source is required"],
            enum: {
                values: LEAD_SOURCES,
                message: "Invalid lead source",
            },
        },

        status: {
            type: String,
            enum: {
                values: LEAD_STATUSES,
                message: "Invalid lead status",
            },
            default: "New",
        },
    },
    {
        timestamps: true,
    }
);

//  for user-specific listing and status filtering
leadSchema.index({ user: 1, status: 1, createdAt: -1 });

//  for user-specific name searches
leadSchema.index({ user: 1, name: 1 });



const Lead = mongoose.model("Lead", leadSchema);

module.exports = Lead;
