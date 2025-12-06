import { InterpolatedPoint, Point } from './utils';
import * as THREE from 'three';

export class Train {
    map: AMap.Map;
    pathLngLats: number[][];
    startTime: number;
    duration: number;
    pathCoords: number[][]; // Use customCoords
    mesh: THREE.Mesh;
    trail: THREE.Line; // We will need to implement trail in Three.js
    active: boolean;
    customCoords: any; // AMap.CustomCoords

    constructor(map: AMap.Map, customCoords: any, pathLngLats: number[][], startTime: number, duration: number = 30000) {
        this.map = map;
        this.customCoords = customCoords;
        this.pathLngLats = pathLngLats;
        this.startTime = startTime; 
        this.duration = duration;
        
        // Precompute CustomCoords for path
        // Ensure input is [lng, lat]
        this.pathCoords = this.customCoords.lngLatsToCoords(this.pathLngLats);
        
        // Train Mesh (Box)
        const geometry = new THREE.BoxGeometry(200, 800, 200); // BoxBufferGeometry is now BoxGeometry in newer Three
        const material = new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.9 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        this.active = true;
    }
    
    addToScene(scene: THREE.Scene) {
        scene.add(this.mesh);
    }

    update(currentTime: number): Point | null {
        if (!this.active) return null;
        
        const cycle = this.duration + 5000;
        const elapsed = (currentTime - this.startTime) % cycle;
        
        if (elapsed > this.duration) {
            this.mesh.visible = false;
            return null;
        } else {
            this.mesh.visible = true;
        }

        const progress = elapsed / this.duration;
        
        // Interpolate using pathCoords (which are in Three.js world space relative to center)
        // We need a helper that works with simple arrays
        const cur = this.getInterpolatedCoord(this.pathCoords, progress);
        
        if (cur) {
            this.mesh.position.set(cur.x, cur.y, 100); // z=100 (half height)
            
            // Rotation - Three.js rotation is typically Euler (x, y, z)
            // Our angle is in XY plane.
            // In AMap GLCustomLayer space (usually Z up if using standard coords? No, let's check doc)
            // Doc example: mesh.position.set(d[0], d[1], 500);
            // So XY is map plane, Z is height.
            // Angle from atan2(dy, dx) is typically counter-clockwise from X.
            // Train is aligned with Y axis (length 800 in Y)? 
            // My geometry: BoxGeometry(200, 800, 200). Y is 800. So it points along Y.
            // If angle is 0 (moving along X), we want Y axis of mesh to point X. Rotation -90 deg (-PI/2).
            // Let's try: rotation.z = angle - PI/2.
            
            this.mesh.rotation.z = cur.angle - Math.PI / 2;
            
            return cur;
        }
        return null;
    }
    
    // Re-implement interpolation for plain number arrays (coords)
    getInterpolatedCoord(path: number[][], t: number): InterpolatedPoint | null {
         if (!path || path.length < 2) return null;

        // Helper for distance
        const dist = (p1: number[], p2: number[]) => Math.sqrt(Math.pow(p2[0]-p1[0], 2) + Math.pow(p2[1]-p1[1], 2));

        // Total length
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
