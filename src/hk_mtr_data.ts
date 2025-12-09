import { RailSystemData, TrackGeometry, TrainTrip, TrackPoint } from './types/RailData';

// Station Coordinates (WGS84)
const stationsSource: Record<string, [number, number]> = {
    // Island Line (Blue)
    'ISL_KET': [114.1278, 22.2812], // Kennedy Town
    'ISL_HKU': [114.1352, 22.2842],
    'ISL_SYP': [114.1444, 22.2863],
    'ISL_SHW': [114.1512, 22.2875],
    'ISL_CEN': [114.1582, 22.2820],
    'ISL_ADM': [114.1646, 22.2796],
    'ISL_WAC': [114.1728, 22.2778],
    'ISL_CAB': [114.1820, 22.2804],
    'ISL_TIH': [114.1918, 22.2878],
    'ISL_FOH': [114.1988, 22.2882],
    'ISL_NOP': [114.2062, 22.2913],
    'ISL_QUB': [114.2127, 22.2884],
    'ISL_TAK': [114.2209, 22.2878],
    'ISL_SWH': [114.2223, 22.2825],
    'ISL_SKW': [114.2285, 22.2783],
    'ISL_HFC': [114.2341, 22.2731],
    'ISL_CHW': [114.2366, 22.2647],

    // Tsuen Wan Line (Red)
    'TWL_CEN': [114.1582, 22.2820],
    'TWL_ADM': [114.1646, 22.2796],
    'TWL_TST': [114.1717, 22.2965],
    'TWL_JOR': [114.1691, 22.3048],
    'TWL_YMT': [114.1706, 22.3126],
    'TWL_MOK': [114.1693, 22.3204],
    'TWL_PRE': [114.1685, 22.3313],
    'TWL_SSP': [114.1614, 22.3308],
    'TWL_CSW': [114.1558, 22.3364],
    'TWL_LCK': [114.1485, 22.3385],
    'TWL_MEI': [114.1382, 22.3418],
    'TWL_LAK': [114.1293, 22.3387],
    'TWL_KWF': [114.1274, 22.3556],
    'TWL_KWH': [114.1302, 22.3637],
    'TWL_TWH': [114.1210, 22.3705],
    'TWL_TSW': [114.1147, 22.3739],

    // Kwun Tong Line (Green)
    'KTL_WHA': [114.1882, 22.3045],
    'KTL_HOM': [114.1824, 22.3094],
    'KTL_YMT': [114.1706, 22.3126],
    'KTL_MOK': [114.1693, 22.3204],
    'KTL_PRE': [114.1685, 22.3313],
    'KTL_SKM': [114.1705, 22.3332],
    'KTL_KOT': [114.1788, 22.3411],
    'KTL_LOF': [114.1873, 22.3392],
    'KTL_WTS': [114.1925, 22.3421],
    'KTL_DIH': [114.2023, 22.3402],
    'KTL_CHH': [114.2096, 22.3386],
    'KTL_KOB': [114.2140, 22.3235],
    'KTL_NTK': [114.2185, 22.3155],
    'KTL_KWT': [114.2259, 22.3120],
    'KTL_LAT': [114.2323, 22.3075],
    'KTL_YAT': [114.2384, 22.2968],
    'KTL_TIK': [114.2536, 22.3032],

    // Tseung Kwan O Line (Purple)
    'TKL_NOP': [114.2062, 22.2913],
    'TKL_QUB': [114.2127, 22.2884],
    'TKL_YAT': [114.2384, 22.2968],
    'TKL_TIK': [114.2536, 22.3032],
    'TKL_TKO': [114.2599, 22.3075],
    'TKL_HAH': [114.2635, 22.3154], // Hang Hau
    'TKL_POA': [114.2562, 22.3228], // Po Lam
    'TKL_LHP': [114.2694, 22.2949], // LOHAS Park

    // East Rail Line (Light Blue)
    'EAL_ADM': [114.1646, 22.2796],
    'EAL_EXC': [114.1782, 22.2818],
    'EAL_HUH': [114.1818, 22.3031],
    'EAL_MKK': [114.1723, 22.3243],
    'EAL_KOT': [114.1788, 22.3411],
    'EAL_TAW': [114.1793, 22.3731],
    'EAL_SHT': [114.1878, 22.3846],
    'EAL_FOT': [114.1970, 22.3950],
    'EAL_RAC': [114.2016, 22.3980],
    'EAL_UNI': [114.2100, 22.4132],
    'EAL_TAP': [114.1706, 22.4452],
    'EAL_TWO': [114.1565, 22.4510],
    'EAL_FAN': [114.1388, 22.4920],
    'EAL_SHS': [114.1287, 22.5020],
    'EAL_LOW': [114.1130, 22.5284],
    'EAL_LMC': [114.0660, 22.5152],

    // Tuen Ma Line (Brown)
    // Corrected Coordinates to avoid flying lines to HK/Kowloon
    'TML_WKS': [114.2403, 22.4243], // Wu Kai Sha
    'TML_MOS': [114.2309, 22.4230], // Ma On Shan
    'TML_HEO': [114.2255, 22.4172], // Heng On
    'TML_TSH': [114.2185, 22.4103], // Tai Shui Hang
    'TML_SHM': [114.2084, 22.3879], // Shek Mun
    'TML_CIO': [114.2045, 22.3828], // City One
    'TML_STW': [114.1965, 22.3768], // Sha Tin Wai
    'TML_CKT': [114.1864, 22.3746], // Che Kung Temple
    'TML_TAW': [114.1793, 22.3731], // Tai Wai
    'TML_HIK': [114.1738, 22.3670], // Hin Keng
    'TML_DIH': [114.2023, 22.3402], // Diamond Hill
    'TML_KAT': [114.1906, 22.3323], // Kai Tak
    'TML_SUW': [114.1884, 22.3242], // Sung Wong Toi
    'TML_TKW': [114.1856, 22.3168], // To Kwa Wan
    'TML_HOM': [114.1824, 22.3094], // Ho Man Tin
    'TML_HUH': [114.1818, 22.3031], // Hung Hom
    'TML_ETS': [114.1760, 22.2960], // East TST
    'TML_AUS': [114.1664, 22.3040], // Austin
    'TML_NAC': [114.1610, 22.3260], // Nam Cheong
    'TML_MEI': [114.1382, 22.3418], // Mei Foo
    'TML_TWW': [114.1130, 22.3718], // Tsuen Wan West
    'TML_KSR': [114.0661, 22.4360], // Kam Sheung Road (Corrected)
    'TML_YUL': [114.0347, 22.4457], // Yuen Long (Corrected)
    'TML_LOP': [114.0238, 22.4514], // Long Ping (Corrected)
    'TML_TIS': [114.0036, 22.4495], // Tin Shui Wai (Corrected)
    'TML_SIH': [113.9795, 22.4060], // Siu Hong (Corrected)
    'TML_TUM': [113.9736, 22.3952], // Tuen Mun (Corrected)

    // Tung Chung Line (Orange)
    'TCL_HOK': [114.1582, 22.2820],
    'TCL_KOW': [114.1618, 22.3052],
    'TCL_OLY': [114.1594, 22.3188],
    'TCL_NAC': [114.1610, 22.3260],
    'TCL_LAK': [114.1293, 22.3387],
    'TCL_TSY': [114.1068, 22.3592],
    'TCL_SUN': [114.0246, 22.3155],
    'TCL_TUC': [113.9388, 22.2891],

    // Airport Express (Teal)
    'AEL_HOK': [114.1582, 22.2820], // Hong Kong
    'AEL_KOW': [114.1618, 22.3052], // Kowloon
    'AEL_TSY': [114.1068, 22.3592], // Tsing Yi
    'AEL_AIR': [113.9348, 22.3154], // Airport
    'AEL_AWE': [113.9431, 22.3213], // AsiaWorld-Expo

    // Disneyland Resort Line (Pink)
    'DRL_SUN': [114.0246, 22.3155],
    'DRL_DIS': [114.0454, 22.3152],

    // South Island Line (Light Green/Yellow)
    'SIL_ADM': [114.1646, 22.2796],
    'SIL_OCP': [114.1727, 22.2475],
    'SIL_WCH': [114.1628, 22.2468],
    'SIL_LET': [114.1566, 22.2427],
    'SIL_SOH': [114.1530, 22.2401],
};

// Line Definitions
const lines = [
    { id: 'ISL', name: 'Island Line', color: '#0071CE', stations: ['ISL_KET', 'ISL_HKU', 'ISL_SYP', 'ISL_SHW', 'ISL_CEN', 'ISL_ADM', 'ISL_WAC', 'ISL_CAB', 'ISL_TIH', 'ISL_FOH', 'ISL_NOP', 'ISL_QUB', 'ISL_TAK', 'ISL_SWH', 'ISL_SKW', 'ISL_HFC', 'ISL_CHW'] },
    { id: 'TWL', name: 'Tsuen Wan Line', color: '#E2231A', stations: ['TWL_CEN', 'TWL_ADM', 'TWL_TST', 'TWL_JOR', 'TWL_YMT', 'TWL_MOK', 'TWL_PRE', 'TWL_SSP', 'TWL_CSW', 'TWL_LCK', 'TWL_MEI', 'TWL_LAK', 'TWL_KWF', 'TWL_KWH', 'TWL_TWH', 'TWL_TSW'] },
    { id: 'KTL', name: 'Kwun Tong Line', color: '#00AF49', stations: ['KTL_WHA', 'KTL_HOM', 'KTL_YMT', 'KTL_MOK', 'KTL_PRE', 'KTL_SKM', 'KTL_KOT', 'KTL_LOF', 'KTL_WTS', 'KTL_DIH', 'KTL_CHH', 'KTL_KOB', 'KTL_NTK', 'KTL_KWT', 'KTL_LAT', 'KTL_YAT', 'KTL_TIK'] },
    { id: 'TKL', name: 'Tseung Kwan O Line', color: '#A35EB5', stations: ['TKL_NOP', 'TKL_QUB', 'TKL_YAT', 'TKL_TIK', 'TKL_TKO', 'TKL_HAH', 'TKL_POA'] }, // Main branch (Po Lam)
    { id: 'TKL_LHP', name: 'Tseung Kwan O Line (LOHAS)', color: '#A35EB5', stations: ['TKL_TIK', 'TKL_TKO', 'TKL_LHP'] }, // LOHAS Park branch
    { id: 'EAL', name: 'East Rail Line', color: '#53B7E8', stations: ['EAL_ADM', 'EAL_EXC', 'EAL_HUH', 'EAL_MKK', 'EAL_KOT', 'EAL_TAW', 'EAL_SHT', 'EAL_FOT', 'EAL_RAC', 'EAL_UNI', 'EAL_TAP', 'EAL_TWO', 'EAL_FAN', 'EAL_SHS', 'EAL_LOW'] },
    { id: 'EAL_LMC', name: 'East Rail Line (LMC)', color: '#53B7E8', stations: ['EAL_SHS', 'EAL_LMC'] }, // LMC Spur
    { id: 'TML', name: 'Tuen Ma Line', color: '#923011', stations: ['TML_WKS', 'TML_MOS', 'TML_HEO', 'TML_TSH', 'TML_SHM', 'TML_CIO', 'TML_STW', 'TML_CKT', 'TML_TAW', 'TML_HIK', 'TML_DIH', 'TML_KAT', 'TML_SUW', 'TML_TKW', 'TML_HOM', 'TML_HUH', 'TML_ETS', 'TML_AUS', 'TML_NAC', 'TML_MEI', 'TML_TWW', 'TML_KSR', 'TML_YUL', 'TML_LOP', 'TML_TIS', 'TML_SIH', 'TML_TUM'] },
    { id: 'TCL', name: 'Tung Chung Line', color: '#F38B00', stations: ['TCL_HOK', 'TCL_KOW', 'TCL_OLY', 'TCL_NAC', 'TCL_LAK', 'TCL_TSY', 'TCL_SUN', 'TCL_TUC'] },
    { id: 'AEL', name: 'Airport Express', color: '#007078', stations: ['AEL_HOK', 'AEL_KOW', 'AEL_TSY', 'AEL_AIR', 'AEL_AWE'] },
    { id: 'DRL', name: 'Disneyland Resort Line', color: '#E777CB', stations: ['DRL_SUN', 'DRL_DIS'] },
    { id: 'SIL', name: 'South Island Line', color: '#B6BD00', stations: ['SIL_ADM', 'SIL_OCP', 'SIL_WCH', 'SIL_LET', 'SIL_SOH'] },
];

async function convertCoords(AMap: any, coords: [number, number][]): Promise<[number, number][]> {
    return new Promise((resolve, reject) => {
        AMap.convertFrom(coords, 'gps', (status: string, result: any) => {
            if (status === 'complete' && result.info === 'ok') {
                const converted = result.locations.map((l: any) => [l.getLng(), l.getLat()]);
                resolve(converted);
            } else {
                reject(new Error('Coord conversion failed'));
            }
        });
    });
}

async function convertAllCoords(AMap: any, coords: [number, number][]): Promise<[number, number][]> {
    const CHUNK_SIZE = 40;
    const results: [number, number][] = [];
    for (let i = 0; i < coords.length; i += CHUNK_SIZE) {
        const chunk = coords.slice(i, i + CHUNK_SIZE);
        const convertedChunk = await convertCoords(AMap, chunk);
        results.push(...convertedChunk);
    }
    return results;
}

// Helper to generate schedule
function generateSchedule(
    stations: Record<string, [number, number]>,
    trips: TrainTrip[],
    lineId: string, 
    trackId: string, 
    stationList: string[], 
    startTime: number, 
    intervalMs: number, 
    count: number, 
    speedKmph: number = 60
) {
    for (let i = 0; i < count; i++) {
        const departureTime = startTime + i * intervalMs;
        const legs: any[] = [];
        let currentDeparture = departureTime;

        for (let j = 0; j < stationList.length - 1; j++) {
            const fromId = stationList[j];
            const toId = stationList[j+1];
            const p1 = stations[fromId];
            const p2 = stations[toId];
            
            // Calc distance (approx)
            const dx = (p2[0] - p1[0]) * 111000;
            const dy = (p2[1] - p1[1]) * 111000;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Calc duration
            const speedMs = speedKmph * 1000 / 3600;
            const travelTime = (dist / speedMs) * 1000 * 1.5; // +50% for accel/decel/stops

            legs.push({
                trackId: trackId,
                fromStationId: fromId,
                toStationId: toId,
                departureTime: currentDeparture,
                arrivalTime: currentDeparture + travelTime
            });

            currentDeparture += travelTime + 30000; // 30s dwell time
        }

        trips.push({
            trainId: `${lineId}-${1000 + i}`,
            legs: legs
        });
    }
}

export async function getHkRailData(AMap: any): Promise<RailSystemData> {
    const stationKeys = Object.keys(stationsSource);
    const stationCoords = stationKeys.map(k => stationsSource[k]);
    
    const convertedCoords = await convertAllCoords(AMap, stationCoords);
    
    const stations: Record<string, [number, number]> = {};
    stationKeys.forEach((key, idx) => {
        stations[key] = convertedCoords[idx];
    });

    const tracks: Record<string, TrackGeometry> = {};
    const trips: TrainTrip[] = [];

    // Build Data
    lines.forEach(line => {
        // 1. Shared Track (Single track per line)
        const path: TrackPoint[] = [];
        line.stations.forEach(stationId => {
             path.push({ location: stations[stationId], name: stationId });
        });

        const trackId = `track_${line.id}`;
        tracks[trackId] = {
            id: trackId,
            path: path,
            color: line.color
        };

        // 2. Generate Schedule (Forward & Backward)
        const now = Date.now();
        // Schedule Config:
        // - High frequency for urban lines (ISL, TWL, KTL, TKL): 3 mins
        // - Medium for others: 5-8 mins
        const interval = ['ISL', 'TWL', 'KTL', 'TKL'].includes(line.id.split('_')[0]) ? 3 * 60 * 1000 : 6 * 60 * 1000;
        
        // Forward
        generateSchedule(stations, trips, line.id, trackId, line.stations, now, interval, 15);
        
        // Backward (pass reversed station list, but same trackId)
        generateSchedule(stations, trips, line.id, trackId, [...line.stations].reverse(), now + 120000, interval, 15);
    });

    return {
        tracks,
        trips
    };
}

// Export initial center (WGS84)
export const initialCenterWGS84: [number, number] = stationsSource['ISL_CEN'];
