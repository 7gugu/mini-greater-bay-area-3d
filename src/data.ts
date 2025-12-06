import { RailSystemData, TrackGeometry, TrainTrip, TrackPoint } from './types/RailData';

// Helper to generate curve points (reused)
function getCurvePoints(p1: number[], p2: number[], control: number[], segments: number): [number, number][] {
    const points: [number, number][] = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const l1 = [
            p1[0] + (control[0] - p1[0]) * t,
            p1[1] + (control[1] - p1[1]) * t
        ];
        const l2 = [
            control[0] + (p2[0] - control[0]) * t,
            control[1] + (p2[1] - control[1]) * t
        ];
        const p: [number, number] = [
            l1[0] + (l2[0] - l1[0]) * t,
            l1[1] + (l2[1] - l1[1]) * t
        ];
        points.push(p);
    }
    return points;
}

// 1. Define Geometry (Tracks)
const start: [number, number] = [114.02919, 22.60954]; // Shenzhen North
const end: [number, number] = [113.26436, 22.99423];   // Guangzhou South
const control: [number, number] = [
    (start[0] + end[0]) / 2 + 0.1, 
    (start[1] + end[1]) / 2 - 0.1
];

const mainTrackPathCoords = getCurvePoints(start, end, control, 100);
const mainTrackPath: TrackPoint[] = mainTrackPathCoords.map((coord, i) => ({
    location: coord,
    name: i === 0 ? 'Shenzhen North' : (i === mainTrackPathCoords.length - 1 ? 'Guangzhou South' : undefined)
}));

const tracks: Record<string, TrackGeometry> = {
    'track_sz_gz': {
        id: 'track_sz_gz',
        path: mainTrackPath,
        color: '#00ccff' // Cyan
    },
    'track_gz_sz': { // Return Track
        id: 'track_gz_sz',
        path: mainTrackPath.slice().reverse().map((p, i) => ({ 
            location: [p.location[0] + 0.01, p.location[1] + 0.01], // Slight offset
            name: p.name 
        })),
        color: '#ff9900' // Orange
    }
};

// 2. Define Schedule (Trips)
// Generate 10 trains
const trips: TrainTrip[] = [];
const baseTime = Date.now(); 

for (let i = 0; i < 5; i++) {
    const departure = baseTime + i * 8000;
    const duration = 30000; 
    
    trips.push({
        trainId: `G${1000 + i}`,
        legs: [
            {
                trackId: 'track_sz_gz',
                fromStationId: 'SZ_NORTH',
                toStationId: 'GZ_SOUTH',
                departureTime: departure,
                arrivalTime: departure + duration
            }
        ]
    });
}

for (let i = 0; i < 5; i++) {
    const departure = baseTime + i * 9000 + 2000;
    const duration = 30000; 
    
    trips.push({
        trainId: `D${2000 + i}`,
        legs: [
            {
                trackId: 'track_gz_sz',
                fromStationId: 'GZ_SOUTH',
                toStationId: 'SZ_NORTH',
                departureTime: departure,
                arrivalTime: departure + duration
            }
        ]
    });
}

// Try load from LocalStorage
const savedData = localStorage.getItem('railData');
let finalData: RailSystemData;

if (savedData) {
    try {
        finalData = JSON.parse(savedData);
        console.log('Loaded railData from LocalStorage');
    } catch (e) {
        console.error('Failed to parse saved railData, using default', e);
        finalData = { tracks, trips };
    }
} else {
    finalData = { tracks, trips };
}

export const railData = finalData;

export const initialCenter = mainTrackPath[0].location;
