import { generatedRailPath, schedule } from './data';
import { Train } from './Train';
import { config } from './config';
import { InterpolatedPoint } from './utils';
import '../assets/style.css'; 
import * as THREE from 'three';

// Set security config before loading AMap
(window as any)._AMapSecurityConfig = { securityJsCode: config.AMAP_SECURITY_CODE };

import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = config.AMAP_KEY;

AMapLoader.load({
    key: AMAP_KEY,
    version: "2.0",
    plugins: [] 
}).then((AMap: any) => {
    const map = new AMap.Map('container', {
        viewMode: '3D', pitch: 60, zoom: 14, center: generatedRailPath[0],
        mapStyle: 'amap://styles/dark', skyColor: '#1f263a'
    });

    // Use GLCustomLayer with Three.js
    const customCoords = map.customCoords;
    
    // Set center for coordinate conversion precision
    // We pick the first point of rail path as reference
    customCoords.setCenter(generatedRailPath[0]);

    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    const trains: Train[] = [];
    
    const glLayer = new AMap.GLCustomLayer({
        zIndex: 110,
        init: (gl: WebGLRenderingContext) => {
            camera = new THREE.PerspectiveCamera(
                60,
                window.innerWidth / window.innerHeight,
                100,
                1 << 30
            );

            renderer = new THREE.WebGLRenderer({
                context: gl,
                alpha: true, // Important for transparency
            });
            renderer.autoClear = false;
            
            scene = new THREE.Scene();

            // Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(1000, -100, 900);
            scene.add(directionalLight);
            
            // Initialize Trains
            const baseTime = Date.now();
            schedule.forEach(s => {
                const t = new Train(
                    map, 
                    customCoords,
                    generatedRailPath, 
                    baseTime + s.startTime, 
                    s.duration
                );
                t.addToScene(scene);
                trains.push(t);
            });
        },
        render: () => {
            renderer.resetState();
            
            // Important: Update customCoords center if needed, but usually fixed center for small areas is fine.
            // If area is large, might need to update center dynamically or use multiple centers?
            // For this demo, let's keep it simple.
            customCoords.setCenter(generatedRailPath[0]);

            const { near, far, fov, up, lookAt, position } = customCoords.getCameraParams();
            
            camera.near = near;
            camera.far = far;
            camera.fov = fov;
            // Spread operator issues if type is number[] but expect [x,y,z] tuple or args
            // customCoords.getCameraParams() returns arrays for vectors
            camera.position.set(position[0], position[1], position[2]);
            camera.up.set(up[0], up[1], up[2]);
            camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
            camera.updateProjectionMatrix();
            
            renderer.render(scene, camera);
            renderer.resetState();
        }
    });
    
    map.add(glLayer);

    function animate() {
        const now = Date.now();
        let firstActivePos: InterpolatedPoint | null = null;
        
        trains.forEach(train => {
            const pos = train.update(now);
            // We need to convert pos back to LngLat if we want camera follow
            // But train.update returns pos in CustomCoords space (relative to center)
            if (pos && !firstActivePos) {
                // We'll need a way to get LngLat from CustomCoords if we want to setCenter
                // AMap customCoords doesn't easily reverse coordsToLngLats publicly in doc?
                // Actually we can just use the progress to get LngLat from original pathLngLats?
                // For now, let's skip camera follow or implement it using original lat/lng interpolation.
                // firstActivePos = pos; 
            }
        });
        
        // Map render triggers GL layer render
        map.render();
        requestAnimationFrame(animate);
    }
    
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        if(camera && renderer) {
             camera.aspect = window.innerWidth / window.innerHeight;
             camera.updateProjectionMatrix();
             renderer.setSize(window.innerWidth, window.innerHeight);
        }
    });
});
