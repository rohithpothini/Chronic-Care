let chart;
let diseaseChart;
let metricsChart;
// history arrays
let scoreHistory = [];
let diseaseCounts = {}; // accumulate frequency of each predicted disease

async function predictRisk() {
  try {
    const data = {
      name: document.getElementById("name").value,
      age: document.getElementById("age").value,
      weight: document.getElementById("weight").value,
      glucose: document.getElementById("glucose").value,
      bp_systolic: document.getElementById("bp_systolic").value,
      bp_diastolic: document.getElementById("bp_diastolic").value,
      heart_rate: document.getElementById("heart_rate").value,
      cholesterol: document.getElementById("cholesterol").value
    };

    console.log("Sending data to backend:", data);

    // use relative paths so the frontend can be served by the backend
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Backend response:", result);

    document.getElementById("riskScore").innerText =
      "Risk Score: " + (result.risk_score || "0");

    document.getElementById("alertMessage").innerText =
      result.message || "Analysis complete";

    // Color code alert based on risk category
    const alertEl = document.getElementById("alertMessage");
    if (result.message === "High Risk") {
      alertEl.style.color = "red";
      alertEl.style.fontWeight = "bold";
    } else if (result.message === "Normal") {
      alertEl.style.color = "green";
      alertEl.style.fontWeight = "bold";
    } else if (result.message === "Low Risk") {
      alertEl.style.color = "orange";
      alertEl.style.fontWeight = "bold";
    }

    // show high-risk alert
    if (result.high_risk_alert) {
      const riskAlertEl = document.getElementById("highRiskAlert");
      riskAlertEl.innerText = result.high_risk_alert;
      if (result.message === "High Risk") {
        riskAlertEl.style.color = "red";
      } else if (result.message === "Normal") {
        riskAlertEl.style.color = "green";
      } else {
        riskAlertEl.style.color = "orange";
      }
    } else {
      document.getElementById("highRiskAlert").innerText = "";
    }

    // update health metrics bar chart
    if (result.health_metrics) {
      updateMetricsChart(result.health_metrics);
    }

    // update disease counts and pie chart
    if (result.predicted_disease) {
      result.predicted_disease.forEach(d => {
        diseaseCounts[d] = (diseaseCounts[d] || 0) + 1;
      });
      updateDiseaseChart(Object.keys(diseaseCounts).reduce((arr,k)=>{
        for(let i=0;i<diseaseCounts[k];i++) arr.push(k);
        return arr;
      }, []));
    }

    // show predicted diseases
    if (result.predicted_disease) {
      document.getElementById("diseasePrediction").innerText =
        "🔬 Predicted: " + result.predicted_disease.join(", ");
    }

    // show recommended antibiotics/medications
    if (result.recommended_antibiotics) {
      document.getElementById("medicationDisplay").innerText =
        "💊 Recommended Medication: " + result.recommended_antibiotics.join(", ");
    }

    updateChart(result.risk_score || 0);

    // Save patient data to database
    await savePatientData(data, result.risk_score, result.message);
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("riskScore").innerText = "Risk Score: ERROR";
    document.getElementById("alertMessage").innerText =
      "❌ Error: " + error.message + ". Make sure the backend server is running and reachable.";
  }
}

function updateChart(score) {
  // push the new score into history
  scoreHistory.push(score);
  const ctx = document.getElementById("healthChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: scoreHistory.map((v,i)=>"#"+(i+1)),
      datasets: [{
        label: "Risk Score Over Time",
        data: scoreHistory,
        fill: false,
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.1
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 1 }
      }
    }
  });
}

// Update health metrics bar chart
function updateMetricsChart(metrics) {
  const ctx = document.getElementById("metricsChart");
  if (metricsChart) metricsChart.destroy();
  
  const labels = Object.keys(metrics);
  const data = labels.map(l => metrics[l] === "High" ? 1 : 0);
  const colors = labels.map(l => metrics[l] === "High" ? "#FF6384" : "#36A2EB");
  
  metricsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Health Status (Red=High/Low, Blue=Normal)",
        data: labels.map((l,i) => i + 1),
        backgroundColor: colors
      }]
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: true } }
    }
  });
}

// Update disease pie chart
function updateDiseaseChart(predictions) {
  const ctx = document.getElementById("diseaseChart");
  if (diseaseChart) diseaseChart.destroy();
  const counts = {};
  predictions.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
  diseaseChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"]
      }]
    }
  });
}

// Save patient data to database
async function savePatientData(data, riskScore, message) {
  try {
    const response = await fetch("http://localhost:3000/save-patient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        risk_score: riskScore,
        message: message
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Patient data saved:", result);
    }
  } catch (error) {
    console.error("Failed to save patient data:", error);
  }
}