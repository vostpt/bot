const RcmApi = require('../../src/api/Rcm');

describe('RCM API parser', () => {
  test('keeps fire-risk data separate from IPMA warnings', () => {
    const html = [
      'var concPT={"features":[{"properties":{"DICO":"0101"},"geometry":{"type":"Polygon","coordinates":[]}}]};',
      'var rcmF=[];',
      'rcmF[0]={"dataPrev":"2026-10-24","local":{"0101":{"data":{"rcm":4}}}};',
    ].join('');

    const { geoJson, riskData } = RcmApi.parse(html);

    expect(riskData.dataPrev).toBe('2026-10-24');
    expect(geoJson.features[0].properties.rcm).toBe(4);
  });

  test('rejects an unexpected upstream page', () => {
    expect(() => RcmApi.parse('<html></html>')).toThrow(/expected data/);
  });
});
