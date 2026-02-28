import express from "express";
import cors from "cors";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pool from "./db.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

const genAI = new GoogleGenerativeAI("AIzaSyCRy4mgUKdApHaynd8GeIvdtdcs37Zvh7M");

// Route: Save patient health data to database
app.post("/save-patient", async (req, res) => {
  try {
    const { name, age, weight, glucose, bp_systolic, bp_diastolic, heart_rate, cholesterol, risk_score, message } = req.body;
    
    const connection = await pool.getConnection();
    
    const query = `
      INSERT INTO patient_health (name, age, weight, glucose, bp_systolic, bp_diastolic, heart_rate, cholesterol, risk_score, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const [result] = await connection.execute(query, [name, age, weight, glucose, bp_systolic, bp_diastolic, heart_rate, cholesterol, risk_score, message]);
    
    connection.release();
    
    res.json({ success: true, id: result.insertId, message: "Patient data saved successfully" });
  } catch (error) {
    console.error("Database Error:", error.message);
    res.status(500).json({ error: "Failed to save patient data" });
  }
});

// Route: Get patient health history
app.get("/patient-history/:name", async (req, res) => {
  try {
    const { name } = req.params;
    
    const connection = await pool.getConnection();
    
    const query = `
      SELECT * FROM patient_health 
      WHERE name = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    const [rows] = await connection.execute(query, [name]);
    
    connection.release();
    
    res.json({ data: rows });
  } catch (error) {
    console.error("Database Error:", error.message);
    res.status(500).json({ error: "Failed to retrieve patient data" });
  }
});

// Route: Forward requests to ML API
app.post("/predict", async (req, res) => {
  try {
    const response = await axios.post("http://127.0.0.1:5000/predict", req.body);
    res.json(response.data);
  } catch (error) {
    console.error("ML API Error:", error.message);
    res.status(500).json({ error: "ML API connection failed" });
  }
});

// Route: Gemini AI insights
app.post("/ai-chart-insight", async (req, res) => {
  try {
    const { bpData, sugarData } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Analyze this patient health data:

    BP readings: ${bpData}
    Sugar readings: ${sugarData}

    Provide:
    1. Risk level (Low/Moderate/High)
    2. Short medical insight
    3. Lifestyle recommendation
    Keep it concise.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ insight: text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gemini failed" });
  }
});

// Start server
app.listen(3000, () => {
  console.log("✅ Backend running on http://localhost:3000");
});