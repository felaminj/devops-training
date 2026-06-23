import { describe, expect, it } from 'vitest';
import {
  mapPhivolcsBulletinToEarthquake,
  mapPhivolcsRowToEarthquake,
  parsePhivolcsBulletin,
  parsePhivolcsDateTimePst,
  parsePhivolcsIndexRows,
  parsePhivolcsLocation,
  toPhivolcsEarthquakeId,
} from '../parsers/phivolcsParser.js';

const SAMPLE_INDEX_ROW = `
<tr>
  <td><a href="2026_Earthquake_Information\\June\\2026_0609_1607_B2F.html">10 June 2026 - 12:07 AM</a></td>
  <td>13.26</td>
  <td>123.88</td>
  <td>003</td>
  <td>2.9</td>
  <td>011 km N 78 E of Santo Domingo (Albay)</td>
</tr>
`;

const SAMPLE_BULLETIN = `
<!-- 2 DateTime-Data  -->10 June 2026 - 12:07:06 AM</span>
<!-- 3 Location-Data  -->13.26N, 123.88E - Santo Domingo (Albay)</span>
<!-- 4 Depth-Data  -->003</span>
<!-- 5 Origin-Data  -->TECTONIC</span>
<!-- 6 Magnitude-Data  -->Ms 2.9</span>
Instrumental Intensity:<br><br>Intensity III - City of Legazpi, ALBAY</span>
<!-- 7 Map-Data  --><img src="2026_0609_1607_B2F.jpg" alt="Epicentral map"></span>
<!-- 8 Damage-Data  -->NO</span>
<!-- 9 Aftershock-Data  -->NO</span>
<!-- 10 IssuedDT-Data  -->10 June 2026 - 12:40 AM</span>
`;

describe('phivolcsParser', () => {
  it('parses PHIVOLCS PST datetime to UTC timestamp', () => {
    const time = parsePhivolcsDateTimePst('10 June 2026 - 12:07 AM');
    expect(time).toBe(Date.UTC(2026, 5, 9, 16, 7));
  });

  it('parses index rows with bulletin links', () => {
    const rows = parsePhivolcsIndexRows(SAMPLE_INDEX_ROW);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.bulletinSlug).toBe('2026_0609_1607_B2F');
    expect(rows[0]?.magnitude).toBe(2.9);
  });

  it('parses bulletin details', () => {
    const bulletinUrl = 'https://earthquake.phivolcs.dost.gov.ph/2026_Earthquake_Information/June/2026_0609_1607_B2F.html';
    const bulletin = parsePhivolcsBulletin(SAMPLE_BULLETIN, bulletinUrl);
    expect(bulletin.magnitudeText).toBe('Ms 2.9');
    expect(bulletin.instrumentalIntensity).toContain('Legazpi');
    expect(bulletin.epicentralMapUrl).toBe(
      'https://earthquake.phivolcs.dost.gov.ph/2026_Earthquake_Information/June/2026_0609_1607_B2F.jpg'
    );
    expect(bulletin.expectingDamage).toBe(false);
    expect(bulletin.expectingAftershocks).toBe(false);
  });

  it('parses PHIVOLCS bulletin location coordinates', () => {
    const location = parsePhivolcsLocation(
      '05.57N, 124.80E - 039 km S 34 W of Maasim (Sarangani)'
    );
    expect(location?.latitude).toBeCloseTo(5.57, 2);
    expect(location?.longitude).toBeCloseTo(124.8, 2);
    expect(location?.place).toContain('Maasim');
  });

  it('maps PHIVOLCS bulletins to earthquake records without index rows', () => {
    const bulletinUrl = 'https://earthquake.phivolcs.dost.gov.ph/2026_Earthquake_Information/June/2026_0609_1007_B2F.html';
    const bulletin = parsePhivolcsBulletin(`
<!-- 2 DateTime-Data  -->09 June 2026 - 10:07:00 AM</span>
<!-- 3 Location-Data  -->05.57N, 124.80E - 039 km S 34 W of Maasim (Sarangani)</span>
<!-- 4 Depth-Data  -->002</span>
<!-- 5 Origin-Data  -->TECTONIC</span>
<!-- 6 Magnitude-Data  -->Ms 5.3</span>
<!-- 7 Map-Data  --><img src="2026_0609_1007_B2F.jpg" alt="Epicentral map"></span>
Instrumental Intensity:<br><br>Intensity IV - Maasim, SARANGANI</span>
<!-- 8 Damage-Data  -->NO</span>
<!-- 9 Aftershock-Data  -->NO</span>
<!-- 10 IssuedDT-Data  -->09 June 2026 - 10:40 AM</span>
`, bulletinUrl);
    const earthquake = mapPhivolcsBulletinToEarthquake(
      '2026_0609_1007_B2F',
      bulletin,
      'https://earthquake.phivolcs.dost.gov.ph'
    );
    expect(earthquake?.id).toBe(toPhivolcsEarthquakeId('2026_0609_1007_B2F'));
    expect(earthquake?.magnitude).toBe(5.3);
    expect(earthquake?.epicentralMapUrl).toContain('2026_0609_1007_B2F.jpg');
    expect(earthquake?.instrumentalIntensity).toContain('Maasim');
  });

  it('maps PHIVOLCS rows to earthquake records', () => {
    const row = parsePhivolcsIndexRows(SAMPLE_INDEX_ROW)[0];
    const earthquake = mapPhivolcsRowToEarthquake(
      row!,
      'https://earthquake.phivolcs.dost.gov.ph',
      parsePhivolcsBulletin(SAMPLE_BULLETIN)
    );
    expect(earthquake?.id).toBe(toPhivolcsEarthquakeId('2026_0609_1607_B2F'));
    expect(earthquake?.dataSource).toBe('phivolcs');
    expect(earthquake?.instrumentalIntensity).toContain('Legazpi');
  });
});
