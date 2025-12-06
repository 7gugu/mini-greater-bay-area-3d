import { RailSystemData, TrackGeometry, TrainTrip } from './types/RailData';

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

const mainTrackPath = getCurvePoints(start, end, control, 100);

const tracks: Record<string, TrackGeometry> = {
    'track_sz_gz': {
        id: 'track_sz_gz',
        path: mainTrackPath
    }
};

// 2. Define Schedule (Trips)
// Generate 10 trains
const trips: TrainTrip[] = [];
const baseTime = Date.now(); 

for (let i = 0; i < 10; i++) {
    // Staggered starts every 5 seconds
    const departure = baseTime + i * 5000;
    const duration = 30000; // 30s trip for demo
    
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

export const railData: RailSystemData = {
    tracks,
    trips
};

// Export raw generated path for camera initialization if needed
export const initialCenter = mainTrackPath[0];
