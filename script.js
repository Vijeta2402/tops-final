const API_URL = "https://fedskillstest.coalitiontechnologies.workers.dev";

const username = "coalition";
const password = "skills-test";

const authHeader = "Basic " + btoa(`${username}:${password}`);

// ================= FORMAT DATE =================
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// ================= PROFILE =================
function renderProfile(patient) {
  document.getElementById("profileImg").src = patient.profile_picture;
  document.getElementById("patientName").innerText = patient.name;
  document.getElementById("dob").innerText = formatDate(patient.date_of_birth);
  document.getElementById("gender").innerText = patient.gender;
  document.getElementById("phone").innerText = patient.phone_number;
  document.getElementById("emergency").innerText = patient.emergency_contact;
  document.getElementById("insurance").innerText = patient.insurance_type;
}

// ================= LAB RESULTS =================
function renderLabResults(patient) {
  const labList = document.getElementById("labList");
  labList.innerHTML = "";

  const labs = patient.lab_results || [];

  labs.forEach(lab => {
    const div = document.createElement("div");
    div.classList.add("lab-item");

    const labName =
      typeof lab === "string"
        ? lab
        : lab.test_name || lab.name || "Unknown Test";

    div.innerHTML = `
      <span>${labName}</span>
      <span class="download-icon"></span>
    `;

    labList.appendChild(div);
  });
}

// ================= BP CHART =================

function renderBPChart(patient) {

  const ctx = document.getElementById("bpChart");

  const history = patient.diagnosis_history || [];

  if (!history.length) return;

  // ================= SORT =================
  const sorted = history.sort((a, b) => {
    return new Date(`${a.month} 1, ${a.year}`) -
      new Date(`${b.month} 1, ${b.year}`);
  });

  // ================= LAST 6 =================
  const last6 = sorted.slice(-6);

  // ================= LABELS =================
  // ✅ FULL LABELS
  const labels = last6.map(item => {

    const date = new Date(`${item.month} 1, ${item.year}`);

    return date.toLocaleString("en-US", {
      month: "short",
      year: "numeric"
    });
  });

  // ================= DATA =================
  const systolic = last6.map(
    item => item.blood_pressure.systolic.value
  );

  const diastolic = last6.map(
    item => item.blood_pressure.diastolic.value
  );

  // ================= DESTROY OLD CHART =================
  if (window.bpChartInstance) {
    window.bpChartInstance.destroy();
  }

  // ================= CREATE CHART =================
  window.bpChartInstance = new Chart(ctx, {

    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Systolic",
          data: systolic,

          borderColor: "#E66FD2",
          backgroundColor: "#E66FD2",

          tension: 0.4,
          borderWidth: 2,

          pointRadius:
            window.innerWidth <= 480 ? 2 :
            window.innerWidth <= 768 ? 3 : 5,

          pointHoverRadius: 5
        },

        {
          label: "Diastolic",
          data: diastolic,

          borderColor: "#8C6FE6",
          backgroundColor: "#8C6FE6",

          tension: 0.4,
          borderWidth: 2,

          pointRadius:
            window.innerWidth <= 480 ? 2 :
            window.innerWidth <= 768 ? 3 : 5,

          pointHoverRadius: 5
        }
      ]
    },

    options: {

      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: "index"
      },

      plugins: {
        legend: {
          display: false
        }
      },

      scales: {

        // ================= X AXIS ===============
x: {

  ticks: {

    color: "#072635",

    autoSkip: false,

    maxRotation: 0,
    minRotation: 0,

    // ✅ FONT SIZE BADA KIYA
    font: {
      size:
        window.innerWidth <= 480 ? 7 : 
        window.innerWidth <= 768 ? 8 :   
        11,                              

      weight: "600"
    },
    padding: 6
  },

  grid: {
    display: false
  },

  border: {
    display: false
  }
},

        // ================= Y AXIS =================
        y: {

          ticks: {

            color: "#072635",

            font: {
              size:
                window.innerWidth <= 480 ? 8 :
                window.innerWidth <= 768 ? 9 : 11
            },

            padding: 8
          },

          grid: {
            color: "#E3E3E3"
          },

          border: {
            display: false
          }
        }
      }
    }
  });
}

// ================= RESPONSIVE RELOAD =================

window.addEventListener("resize", () => {

  clearTimeout(window.resizeTimer);

  window.resizeTimer = setTimeout(() => {
    getPatients();
  }, 300);

});

// HEADER MENU TOGGLE

const menuBtn = document.querySelector(".menu-btn");
const header = document.querySelector(".header");

menuBtn.addEventListener("click", () => {
  header.classList.toggle("active");
});

// ================= CARDS + BP RIGHT SIDE =================
function renderVitals(patient) {
  const history = patient.diagnosis_history || [];

  if (!history.length) return;

  const latest = history[history.length - 1];

  // Respiratory
  document.getElementById("respRate").innerText =
    latest.respiratory_rate.value + " bpm";
  document.getElementById("respStatus").innerText =
    latest.respiratory_rate.levels;

  // Temperature
  document.getElementById("temp").innerText =
    latest.temperature.value + "°F";
  document.getElementById("tempStatus").innerText =
    latest.temperature.levels;

  // Heart Rate
  document.getElementById("heartRate").innerText =
    latest.heart_rate.value + " bpm";
  document.getElementById("heartStatus").innerText =
    latest.heart_rate.levels;

  // ✅ BP RIGHT SIDE (IMPORTANT FIX)
  const sysValue = document.getElementById("sysValue");
  const sysLevel = document.getElementById("sysLevel");
  const diaValue = document.getElementById("diaValue");
  const diaLevel = document.getElementById("diaLevel");

  if (sysValue && sysLevel && diaValue && diaLevel) {
    sysValue.innerText = latest.blood_pressure.systolic.value;
    sysLevel.innerText = latest.blood_pressure.systolic.levels;

    diaValue.innerText = latest.blood_pressure.diastolic.value;
    diaLevel.innerText = latest.blood_pressure.diastolic.levels;
  }
}

// ================= API CALL =================
async function getPatients() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        Authorization: authHeader
      }
    });

    const data = await res.json();

    const patient = data.find(p => p.name === "Jessica Taylor");

    if (!patient) {
      console.error("Patient not found");
      return;
    }

    renderProfile(patient);
    renderLabResults(patient);
    renderBPChart(patient);
    renderVitals(patient);
    renderDiagnosticList(patient);

  } catch (err) {
    console.error("API ERROR:", err);
  }
}
getPatients();
// ================= INIT =================


function renderDiagnosticList(patient) {
  const container = document.getElementById("diagnosticList");
  container.innerHTML = "";

  const list = patient.diagnostic_list || [];

  list.forEach(item => {
    const row = document.createElement("div");
    row.classList.add("diagnostic-row");

    // status class for color
    let statusClass = "";
    if (item.status.toLowerCase().includes("active")) {
      statusClass = "active";
    } else {
      statusClass = "observation";
    }

    row.innerHTML = `
      <div class="name">${item.name}</div>
      <div class="description">${item.description}</div>
      <div class="status ${statusClass}">${item.status}</div>
    `;

    container.appendChild(row);
  });
}