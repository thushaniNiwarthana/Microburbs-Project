const suburbPicker = document.getElementById('suburbPicker');
const summaryCards = document.getElementById('summaryCards');
const dashboardSummaryCards = document.getElementById('dashboardSummaryCards');
let priceHist, bedroomBar;

window.onload = () => {
    // Populate suburbs dynamically
    fetch('/api/suburbs')
        .then(res => res.json())
        .then(suburbs => {
            suburbPicker.innerHTML = suburbs.map(s => `<option value="${s}">${s}</option>`).join('');
            loadSuburb(suburbPicker.value);
        });
};
suburbPicker.addEventListener('change', () => loadSuburb(suburbPicker.value));

function loadSuburb(suburb) {
    fetch(`/api/properties?suburb=${encodeURIComponent(suburb)}`)
        .then(res => res.json())
        .then(properties => showDashboard(properties));
}

function showDashboard(properties) {
    // Add null/undefined checks for price and bedrooms calculations
    const validPrices = properties.filter(p => p.price && !isNaN(p.price));
    const validBedrooms = properties.filter(p => p.bedrooms && !isNaN(p.bedrooms));
    
    const avgPrice = validPrices.length ? 
        validPrices.reduce((acc, p) => acc + p.price, 0) / validPrices.length : 0;
    
    const avgBedrooms = validBedrooms.length ?
        validBedrooms.reduce((acc, p) => acc + p.bedrooms, 0) / validBedrooms.length : 0;

    // Show the three summary stats
    const numProperties = properties.length;

    dashboardSummaryCards.innerHTML = `
        <div class="summary-stat-card">Properties<br><strong>${numProperties}</strong></div>
        <div class="summary-stat-card">Average Price<br><strong>💲${Math.round(avgPrice).toLocaleString()}</strong></div>
        <div class="summary-stat-card">Average Bedrooms<br><strong>${Math.round(avgBedrooms * 10) / 10}</strong></div>
    `;

    // Split property cards: top 3 and remainder
    const top = properties.slice(0, 3);
    const rest = properties.slice(3);

    summaryCards.innerHTML =
        `<div class="top-property-row">${top.map(cardHtml).join("")}</div>` +
        `<div class="other-property-grid">${rest.map(cardHtml).join("")}</div>`;

    // Price distribution (histogram)
    const prices = properties.map(p => +p.price).filter(x => x);
    const priceBins = [0, 250000, 500000, 750000, 1000000, 1250000, 1500000, 2000000];
    const binLabels = priceBins.slice(1).map((v, i) => `$${priceBins[i].toLocaleString()}–${v.toLocaleString()}`);
    const binCounts = priceBins.slice(1).map((v, i) =>
        prices.filter(px => px > priceBins[i] && px <= v).length
    );
    if (priceHist) priceHist.destroy();
    priceHist = new Chart(document.getElementById("priceHist"), {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: "No. of Properties",
                data: binCounts,
                backgroundColor: "#5aadff"
            }]
        },
        options: {
            plugins: { title: { display: true, text: "Price Distribution" } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });

    // Bedroom count chart
    const bedroomNumbers = properties.map(p => +p.bedrooms).filter(x => x);
    let bedCounts = [1, 2, 3, 4, 5, 6].map(num =>
        bedroomNumbers.filter(b => b === num).length
    );
    if (bedroomBar) bedroomBar.destroy();
    bedroomBar = new Chart(document.getElementById("bedroomBar"), {
        type: 'bar',
        data: {
            labels: ["1 BR", "2 BR", "3 BR", "4 BR", "5 BR", "6 BR"],
            datasets: [{
                label: "Property Count",
                data: bedCounts,
                backgroundColor: "#1763a6"
            }]
        },
        options: {
            plugins: { title: { display: true, text: "Properties by Bedroom Count" } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function cardHtml(p) {
    return `<div class="summary-card">
        <strong>${p.address}</strong><br>
        🏷️ ${p.property_type}<br>
        🛏 ${p.bedrooms} BR | 🛁 ${p.bathrooms} | 🚗 ${p.garage} | 💲${p.price !== undefined && p.price !== "?" ? p.price.toLocaleString() : '?' }
        <br>Land: ${p.land_size !== undefined && p.land_size !== "?" ? p.land_size + ' m²' : '?' }
        <br><small>${p.description ? p.description.split('\n')[0] : ''}</small>
     </div>`;
}
