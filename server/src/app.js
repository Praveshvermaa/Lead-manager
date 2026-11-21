const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");

const healthRoutes = require("./routes/healthRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();




app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);





app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);



app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});


app.use(errorHandler);

module.exports = app;