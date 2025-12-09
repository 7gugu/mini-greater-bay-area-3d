import { InterpolatedPoint, Point } from './utils';
import * as THREE from 'three';
import { TrainTrip, TripLeg, TrackGeometry } from './types/RailData';

export class Train {
    map: AMap.Map;
    customCoords: any;
    
    trip: TrainTrip;
    tracks: Record<string, TrackGeometry>; 
    
    // Use injected smoothed cache or local cache
    trackCoordsCache: Map<string, number[][]>;

    mesh: THREE.Mesh;
    active: boolean = true;

    constructor(
        map: AMap.Map, 
        customCoords: any, 
        trip: TrainTrip, 
        tracks: Record<string, TrackGeometry>,
        smoothedTracksCache?: Record<string, number[][]>
    ) {
        this.map = map;
        this.customCoords = customCoords;
        this.trip = trip;
        this.tracks = tracks;
        this.trackCoordsCache = new Map();

        // Populate cache from injected smoothed paths if available
        if (smoothedTracksCache) {
            Object.keys(smoothedTracksCache).forEach(key => {
                this.trackCoordsCache.set(key, smoothedTracksCache[key]);
            });
        }

        // Initialize Mesh
        const geometry = new THREE.BoxGeometry(200, 800, 200); 
        const material = new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.9 });
        this.mesh = new THREE.Mesh(geometry, material);
        // Initially hide until valid time
        this.mesh.visible = false;
        
        // Pre-convert coordinates for relevant tracks ONLY if not already cached
        this.trip.legs.forEach(leg => {
            if (!this.trackCoordsCache.has(leg.trackId)) {
                const track = this.tracks[leg.trackId];
                if (track) {
                    // Use raw coords as fallback (not smoothed)
                    // Note: This fallback path might fail the "index * 10" logic if not smoothed!
                    // But main.ts ensures we pass smoothed cache.
                    const pathLngLats = track.path.map(p => p.location);
                    const coords = this.customCoords.lngLatsToCoords(pathLngLats);
                    this.trackCoordsCache.set(leg.trackId, coords);
                }
            }
        });
    }
    
    addToScene(scene: THREE.Scene) {
        scene.add(this.mesh);
    }

    update(currentTime: number): Point | null {
        // Find current leg
        const currentLeg = this.trip.legs.find(leg => 
            currentTime >= leg.departureTime && currentTime <= leg.arrivalTime
        );

        if (!currentLeg) {
            // Not on any leg (either waiting at station or finished)
            this.mesh.visible = false;
            // TODO: Optional - Show at station if waiting between legs?
            return null;
        }

        this.mesh.visible = true;
        
        // Calculate progress in current leg
        const duration = currentLeg.arrivalTime - currentLeg.departureTime;
        const elapsed = currentTime - currentLeg.departureTime;
        const progress = Math.min(1, Math.max(0, elapsed / duration));
        
        const pathCoords = this.trackCoordsCache.get(currentLeg.trackId);
        const track = this.tracks[currentLeg.trackId];
        
        if (!pathCoords || !track) return null;

        // Find Station Indices
        // We assume track.path matches the smoothed path structure (segment count = 10)
        const fromIdx = track.path.findIndex(p => p.name === currentLeg.fromStationId);
        const toIdx = track.path.findIndex(p => p.name === currentLeg.toStationId);

        if (fromIdx === -1 || toIdx === -1) return null;

        // Extract Sub-segment
        // Assuming 10 segments per hop
        const SEGMENTS = 10;
        let segmentPath: number[][];

        if (fromIdx < toIdx) {
            // Forward
            const start = fromIdx * SEGMENTS;
            const end = toIdx * SEGMENTS;
            segmentPath = pathCoords.slice(start, end + 1);
        } else {
            // Backward
            const start = toIdx * SEGMENTS;
            const end = fromIdx * SEGMENTS;
            // Slice then reverse to simulate backward movement
            segmentPath = pathCoords.slice(start, end + 1).reverse();
        }

        const cur = this.getInterpolatedCoord(segmentPath, progress);
        
        if (cur) {
            this.mesh.position.set(cur.x, cur.y, 100); 
            // Rotation: -90 deg offset as model faces Y
            this.mesh.rotation.z = cur.angle - Math.PI / 2;
            return cur;
        }
        
        return null;
    }
    
    // Re-implement interpolation (similar to before)
    getInterpolatedCoord(path: number[][], t: number): InterpolatedPoint | null {
         if (!path || path.length < 2) return null;

        const dist = (p1: number[], p2: number[]) => Math.sqrt(Math.pow(p2[0]-p1[0], 2) + Math.pow(p2[1]-p1[1], 2));

        let totalLen = 0;
        for(let i=0; i<path.length-1; i++) totalLen += dist(path[i], path[i+1]);
        
        const targetLen = totalLen * t;
        let currentLen = 0;

        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i+1];
            const segLen = dist(p1, p2);
            
            if (currentLen + segLen >= targetLen) {
                const segT = (targetLen - currentLen) / segLen;
                const x = p1[0] + (p2[0] - p1[0]) * segT;
                const y = p1[1] + (p2[1] - p1[1]) * segT;
                const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
                return { x, y, angle };
            }
            currentLen += segLen;
        }
        
        const last = path[path.length-1];
        const prev = path[path.length-2];
        return { x: last[0], y: last[1], angle: Math.atan2(last[1]-prev[1], last[0]-prev[0]) };
    }

    destroy(scene: THREE.Scene) {
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}
