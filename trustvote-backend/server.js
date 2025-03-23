require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');

// Import routes
const authRoutes = require("./routes/auth");

app.use(cors());

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Use your auth routes (e.g., login)
app.use("/api", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
