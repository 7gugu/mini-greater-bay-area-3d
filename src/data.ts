export const railPath: number[][] = [
    // Mock curved path
    // We will regenerate it at runtime or hardcode it here.
    // Since data.js had logic to generate it, we should port that logic.
];

// Helper to generate curve points
function getCurvePoints(p1: number[], p2: number[], control: number[], segments: number): number[][] {
    const points: number[][] = [];
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
        const p = [
            l1[0] + (l2[0] - l1[0]) * t,
            l1[1] + (l2[1] - l1[1]) * t
        ];
        points.push(p);
    }
    return points;
}

const start = [114.02919, 22.60954];
const end = [113.26436, 22.99423];
const control = [
    (start[0] + end[0]) / 2 + 0.1, 
    (start[1] + end[1]) / 2 - 0.1
];

export const generatedRailPath = getCurvePoints(start, end, control, 50);

export interface ScheduleItem {
    id: string;
    startTime: number;
    duration: number;
}

export const schedule: ScheduleItem[] = [];
for (let i = 0; i < 10; i++) {
    schedule.push({
        id: `G${1000 + i}`,
        startTime: i * 3000, 
        duration: 30000 
    });
}
