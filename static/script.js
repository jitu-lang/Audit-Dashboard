let chart;
let fullData = [];

document.getElementById("mode").addEventListener("change", function () {
    if (this.value === "recon") {
        file1.style.display = "block";
        file2.style.display = "block";
        fileSingle.style.display = "none";
    } else {
        file1.style.display = "none";
        file2.style.display = "none";
        fileSingle.style.display = "block";
    }
});

document.getElementById("uploadBtn").addEventListener("click", function () {
    const mode = document.getElementById("mode").value;

    if (mode === "recon") {
        processRecon();
    } else {
        processSingle();
    }
});

function readFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const rows = text.split("\n").slice(1);
        const data = rows.map(r => {
            const cols = r.split(",");
            return {
                id: cols[0],
                dept: cols[1],
                amount: parseFloat(cols[2])
            };
        });
        callback(data);
    };
    reader.readAsText(file);
}

function processRecon() {
    const f1 = file1.files[0];
    const f2 = file2.files[0];

    if (!f1 || !f2) return alert("Upload both files");

    readFile(f1, d1 => {
        readFile(f2, d2 => {

            let results = [];

            d1.forEach(r1 => {
                let match = d2.find(r2 => r2.id === r1.id);

                if (!match) {
                    results.push({ ...r1, doc2: "Missing", status: "Missing" });
                } else if (r1.amount !== match.amount) {
                    results.push({ ...r1, doc2: match.amount, status: "Mismatch" });
                } else {
                    results.push({ ...r1, doc2: match.amount, status: "OK" });
                }
            });

            fullData = results;
            updateUI(results);
        });
    });
}

function processSingle() {
    const f = fileSingle.files[0];
    if (!f) return alert("Upload file");

    readFile(f, data => {
        let results = data.map(r => ({
            ...r,
            doc2: "-",
            status: r.amount > 100000 ? "High" : "OK"
        }));

        fullData = results;
        updateUI(results);
    });
}

function updateUI(data) {
    document.getElementById("totalRecords").innerText = data.length;
    document.getElementById("mismatchCount").innerText =
        data.filter(d => d.status === "Mismatch").length;
    document.getElementById("missingCount").innerText =
        data.filter(d => d.status === "Missing").length;

    populateFilter(data);
    renderTable(data);
    drawChart(data);
}

function populateFilter(data) {
    const set = new Set(data.map(d => d.dept));
    const filter = document.getElementById("deptFilter");

    filter.innerHTML = '<option value="all">All</option>';

    set.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.text = d;
        filter.appendChild(opt);
    });
}

document.getElementById("deptFilter").addEventListener("change", function () {
    const val = this.value;

    if (val === "all") {
        renderTable(fullData);
        drawChart(fullData);
    } else {
        const filtered = fullData.filter(d => d.dept === val);
        renderTable(filtered);
        drawChart(filtered);
    }
});

function renderTable(data) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    data.forEach(r => {
        const row = `<tr>
            <td>${r.id}</td>
            <td>${r.dept}</td>
            <td>${r.amount}</td>
            <td>${r.doc2}</td>
            <td>${r.status}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function drawChart(data) {
    const counts = {};

    data.forEach(d => {
        counts[d.status] = (counts[d.status] || 0) + 1;
    });

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"), {
        type: "bar",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: "Audit",
                data: Object.values(counts)
            }]
        }
    });
}
