const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("InterviewMirror Backend is running!");
});

app.get("/api/start", (req, res) => {
    res.json({
        success: true,
        interviewId: "12345"
    });
});

app.listen(5000, () => {
    console.log("🚀 Server running on http://localhost:5000");
});