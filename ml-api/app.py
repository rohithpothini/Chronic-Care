from flask import Flask, request, jsonify
import random

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    
    glucose = float(data["glucose"])
    systolic = float(data["bp_systolic"])
    diastolic = float(data["bp_diastolic"])
    heart_rate = float(data["heart_rate"])
    cholesterol = float(data["cholesterol"])

    # Health metrics categorization based on provided thresholds
    metrics = {
        "Glucose": "High" if glucose >= 200 else "Normal",
        "Systolic BP": "High" if systolic >= 180 else "Normal",
        "Diastolic BP": "High" if diastolic >= 120 else "Normal",
        "Heart Rate": "Low" if heart_rate < 50 else "Normal",
        "Cholesterol": "High" if cholesterol >= 240 else "Normal"
    }

    # Simple risk formula (replace with real ML model later)
    risk = (glucose * 0.3 + systolic * 0.2 + cholesterol * 0.3) / 100
    risk = round(min(risk, 1.0), 2)

    # Disease prediction logic based on new thresholds
    predicted = []
    if glucose >= 200:
        predicted.append("Diabetes")
    if systolic >= 180 or diastolic >= 120 or cholesterol >= 240:
        predicted.append("Hypertension")
    if heart_rate < 50:
        predicted.append("Arrhythmia")
    if not predicted:
        predicted.append("Healthy")

    # Antibiotic recommendations based on disease
    antibiotics = []
    if "Diabetes" in predicted:
        antibiotics.append("Metformin, Insulin")
    if "Hypertension" in predicted:
        antibiotics.append("Lisinopril, Amlodipine")
    if "Arrhythmia" in predicted:
        antibiotics.append("Beta-blockers")
    if "Healthy" in predicted:
        antibiotics.append("None required")

    # Alert categorization based on PREDICTED DISEASES
    if "Healthy" in predicted:
        risk_category = "Normal"
        high_risk_alert = "✅ NORMAL: No health concerns detected based on inputs."
    elif len(predicted) >= 2:
        risk_category = "High Risk"
        high_risk_alert = "⚠️ HIGH RISK ALERT: Multiple conditions detected. Immediate medical consultation recommended!"
    else:
        risk_category = "Low Risk"
        high_risk_alert = "⚠️ LOW RISK: One condition detected. Monitor health parameters regularly."

    return jsonify({
        "risk_score": risk,
        "message": risk_category,
        "predicted_disease": predicted,
        "recommended_antibiotics": antibiotics,
        "high_risk_alert": high_risk_alert,
        "health_metrics": metrics
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)