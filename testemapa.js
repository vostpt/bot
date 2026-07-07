const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {

const html = `
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
</head>

<body style="margin:0">
<div id="map" style="width:1000px;height:800px"></div>

<script>
const map = L.map('map').setView([39.5,-8], 7);

L.tileLayer(
'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
).addTo(map);

L.circle([38.72,-9.13],{
color:'red',
radius:50000
}).addTo(map);
</script>

</body>
</html>
`;

fs.writeFileSync('teste.html', html);

const browser = await puppeteer.launch();

const page = await browser.newPage();

await page.goto(
`file://${process.cwd()}/teste.html`,
{
waitUntil:'networkidle0'
}
);

await page.screenshot({
path:'testeMapa.png'
});

await browser.close();

console.log('Mapa criado');

})();