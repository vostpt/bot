const axios = require('axios');
const sharp = require('sharp');

const SOURCE_URL = 'https://www.ipma.pt/pt/riscoincendio/rcm.pt/';

class Rcm {
  async fetch() {
    const response = await axios.get(SOURCE_URL);
    const { geoJson, riskData } = this.parse(response.data);
    const attachment = await this.generateMap(geoJson, riskData.dataPrev);

    return { attachment, name: 'rcm_map.png' };
  }

  parse(html) {
    const geoStart = html.indexOf('var concPT=');
    const geoEnd = html.indexOf('var rcmF=');
    const riskStart = html.indexOf('rcmF[0]=');

    if (geoStart === -1 || geoEnd === -1 || riskStart === -1) {
      throw new Error('IPMA RCM page does not contain the expected data');
    }

    let geoJsonText = html.substring(geoStart + 'var concPT='.length, geoEnd).trim();
    if (geoJsonText.endsWith(';')) geoJsonText = geoJsonText.slice(0, -1);

    const riskJsonStart = riskStart + 'rcmF[0]='.length;
    const riskEnd = html.indexOf(';', riskJsonStart);
    const riskData = JSON.parse(html.substring(riskJsonStart, riskEnd));
    const geoJson = JSON.parse(geoJsonText);
    const risks = Object.fromEntries(
      Object.entries(riskData.local).map(([dico, entry]) => [dico, entry.data.rcm]),
    );

    return {
      riskData,
      geoJson: {
        ...geoJson,
        features: geoJson.features.map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            rcm: risks[feature.properties.DICO] || 0,
          },
        })),
      },
    };
  }

  rcmColor(rcm) {
    const colors = {
      1: '#2ecc71',
      2: '#f1c40f',
      3: '#e67e22',
      4: '#e74c3c',
      5: '#8e44ad',
    };

    return colors[rcm] || '#4a4a4a';
  }

  async generateMap(geoJson, date) {
    const minLon = -9.501;
    const maxLon = -6.189;
    const minLat = 36.961;
    const maxLat = 42.149;
    const centerLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos(centerLat * Math.PI / 180);
    const height = 700;
    const scale = height / (maxLat - minLat);
    const width = Math.round((maxLon - minLon) * scale * cosLat);

    const project = ([lon, lat]) => [
      (lon - minLon) * scale * cosLat,
      (maxLat - lat) * scale,
    ];
    const ringToPath = (ring) => ring.map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ').concat(' Z');

    const featurePaths = geoJson.features.map((feature) => {
      const { geometry, properties } = feature;
      let path = '';

      if (geometry.type === 'Polygon') {
        path = geometry.coordinates.map(ringToPath).join(' ');
      } else if (geometry.type === 'MultiPolygon') {
        path = geometry.coordinates.flat().map(ringToPath).join(' ');
      }

      return `<path d="${path}" fill="${this.rcmColor(properties.rcm)}" stroke="#0b1220" stroke-width="0.3"/>`;
    });

    const labels = ['Reduzido', 'Moderado', 'Elevado', 'Muito Elevado', 'Máximo'];
    const legend = labels.map((label, index) => `
      <rect x="10" y="${60 + index * 35}" width="20" height="20" fill="${this.rcmColor(index + 1)}" rx="3"/>
      <text x="38" y="${75 + index * 35}" fill="white" font-size="14">${label}</text>
    `).join('');
    const totalWidth = width + 180;
    const svg = `<svg width="${totalWidth}" height="730" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0b1220"/>
      <g transform="translate(0,10)">${featurePaths.join('')}</g>
      <text x="10" y="725" fill="#cccccc" font-size="14">Risco de Incêndio - ${date || ''} | IPMA</text>
      <g transform="translate(${width + 10}, 0)">${legend}</g>
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}

module.exports = new Rcm();
