const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class Ipma {

  async fetch() {
    try {
      console.log('1️⃣ A pedir IPMA...');

      const res = await axios.get('https://www.ipma.pt/pt/riscoincendio/rcm.pt/');
      const html = res.data;

      // Extract GeoJSON (municipality polygons)
      const geoStart = html.indexOf('var concPT=');
      const geoEnd = html.indexOf('var rcmF=');
      if (geoStart === -1 || geoEnd === -1) {
        console.log('❌ Não encontrou concPT ou rcmF');
        return null;
      }

      let geoJsonText = html.substring(geoStart + 'var concPT='.length, geoEnd).trim();
      if (geoJsonText.endsWith(';')) geoJsonText = geoJsonText.slice(0, -1);

      const geoJson = JSON.parse(geoJsonText);
      console.log('✅ Features:', geoJson.features.length);

      // Extract risk data from rcmF[0]
      const rcmStart = html.indexOf('rcmF[0]=');
      if (rcmStart === -1) {
        console.log('❌ Não encontrou rcmF[0]');
        return null;
      }

      const rcmJsonStart = rcmStart + 'rcmF[0]='.length;
      const rcmEnd = html.indexOf(';', rcmJsonStart);
      const rcmData = JSON.parse(html.substring(rcmJsonStart, rcmEnd));
      console.log('✅ Dados RCM para', rcmData.dataPrev);

      // Build DICO → rcm level map
      const dicoRisk = {};
      for (const [dico, entry] of Object.entries(rcmData.local)) {
        dicoRisk[dico] = entry.data.rcm; // 1=Reduzido, 2=Moderado, 3=Elevado, 4=Muito Elevado, 5=Máximo
      }

      // Merge risk data into GeoJSON features
      const features = geoJson.features.map(f => ({
        ...f,
        properties: { ...f.properties, rcm: dicoRisk[f.properties.DICO] || 0 },
      }));

      const pngPath = await this.generateMap({ ...geoJson, features }, rcmData.dataPrev);
      return { attachment: pngPath, name: 'rcm_map.png' };

    } catch (err) {
      console.log('❌ ERRO:', err.message);
      return null;
    }
  }

  rcmColor(rcm) {
    switch (rcm) {
      case 1: return '#2ecc71';  // Reduzido
      case 2: return '#f1c40f';  // Moderado
      case 3: return '#e67e22';  // Elevado
      case 4: return '#e74c3c';  // Muito Elevado
      case 5: return '#8e44ad';  // Máximo
      default: return '#4a4a4a'; // Sem dados
    }
  }

  async generateMap(geoJson, dataPrev) {
    // Portugal mainland bounding box (from real GeoJSON data)
    const minLon = -9.501, maxLon = -6.189;
    const minLat = 36.961, maxLat = 42.149;

    // Apply cosine correction so the map isn't horizontally stretched
    // At ~39.5° lat, 1° lon ≈ 0.770 × 1° lat
    const centerLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos(centerLat * Math.PI / 180);

    const H = 700;
    const scale = H / (maxLat - minLat);       // px per degree lat
    const W = Math.round((maxLon - minLon) * scale * cosLat);

    const project = ([lon, lat]) => [
      ((lon - minLon) * scale * cosLat),
      ((maxLat - lat) * scale),
    ];

    const ringToPath = (ring) =>
      ring.map((pt, i) => {
        const [x, y] = project(pt);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' ') + ' Z';

    const featurePaths = geoJson.features.map(f => {
      const color = this.rcmColor(f.properties.rcm);
      const geom = f.geometry;
      let d = '';
      if (geom.type === 'Polygon') {
        d = geom.coordinates.map(ringToPath).join(' ');
      } else if (geom.type === 'MultiPolygon') {
        d = geom.coordinates.flat().map(ringToPath).join(' ');
      }
      return `<path d="${d}" fill="${color}" stroke="#0b1220" stroke-width="0.3"/>`;
    });

    const legendItems = [
      { rcm: 1, label: 'Reduzido' },
      { rcm: 2, label: 'Moderado' },
      { rcm: 3, label: 'Elevado' },
      { rcm: 4, label: 'Muito Elevado' },
      { rcm: 5, label: 'Máximo' },
    ];
    const legend = legendItems.map((item, i) => `
      <rect x="10" y="${60 + i * 35}" width="20" height="20" fill="${this.rcmColor(item.rcm)}" rx="3"/>
      <text x="38" y="${75 + i * 35}" fill="white" font-size="14">${item.label}</text>
    `).join('');

    const totalW = W + 180;
    const svg = `<svg width="${totalW}" height="730" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0b1220"/>
  <g transform="translate(0,10)">${featurePaths.join('')}</g>
  <text x="10" y="725" fill="#cccccc" font-size="14">Risco de Incêndio - ${dataPrev || ''} | IPMA</text>
  <g transform="translate(${W + 10}, 0)">${legend}</g>
</svg>`;

    const svgPath = path.join(process.cwd(), 'rcm.svg');
    const pngPath = path.join(process.cwd(), 'rcm_map.png');

    fs.writeFileSync(svgPath, svg);
    await sharp(svgPath).png().toFile(pngPath);

    console.log('✅ Mapa gerado:', pngPath);
    return pngPath;
  }
}

module.exports = new Ipma();
