import { railData, initialCenter } from './data';
import { Train } from './Train';
import { config } from './config';
import { Editor } from './Editor';
import { PlaybackController } from './PlaybackController';
import '../assets/style.css'; 
import * as THREE from 'three';

// Set security config before loading AMap
(window as any)._AMapSecurityConfig = { securityJsCode: config.AMAP_SECURITY_CODE };

import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = config.AMAP_KEY;

AMapLoader.load({
    key: AMAP_KEY,
    version: "2.0",
    plugins: ['AMap.PolylineEditor'] // Load Editor Plugin
}).then((AMap: any) => {
    const map = new AMap.Map('container', {
        viewMode: '3D', pitch: 60, zoom: 14, center: initialCenter,
        mapStyle: 'amap://styles/dark', skyColor: '#1f263a'
    });

    const customCoords = map.customCoords;
    customCoords.setCenter(initialCenter);

    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    const trains: Train[] = [];
    
    // Playback Controller
    // Use the baseTime from data generation to align with the schedule
    // railData generation uses Date.now(). Let's use the earliest trip time or just Date.now() if we assume live.
    // In src/data.ts, trips start at baseTime.
    // We should probably expose baseTime from data.ts or just estimate.
    // For now, let's just init with Date.now() and assume data is relative to *now* when loaded.
    // Actually src/data.ts executes Date.now() on load.
    
    // Better approach: Find the earliest departure time in railData
    let minTime = Infinity;
    if (railData.trips.length > 0) {
        railData.trips.forEach(t => {
            t.legs.forEach(l => {
                if (l.departureTime < minTime) minTime = l.departureTime;
            });
        });
    }
    const startTime = minTime === Infinity ? Date.now() : minTime;

    const playback = new PlaybackController(startTime);
    
    // Editor Initialization
    const editor = new Editor(map, AMap);
    
    editor.onDataUpdate = () => {
        console.log("Data Updated, refreshing trains...");
        scene.remove(...trains.map(t => t.mesh));
        trains.length = 0;
        
        railData.trips.forEach(trip => {
            const t = new Train(
                map, 
                customCoords,
                trip,
                railData.tracks
            );
            t.addToScene(scene);
            trains.push(t);
        });
    };

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
                alpha: true, 
            });
            renderer.autoClear = false;
            
            scene = new THREE.Scene();

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(1000, -100, 900);
            scene.add(directionalLight);
            
            // Initialize Trains
            railData.trips.forEach(trip => {
                const t = new Train(
                    map, 
                    customCoords,
                    trip,
                    railData.tracks
                );
                t.addToScene(scene);
                trains.push(t);
            });
        },
        render: () => {
            renderer.resetState();
            customCoords.setCenter(initialCenter);

            const { near, far, fov, up, lookAt, position } = customCoords.getCameraParams();
            
            camera.near = near;
            camera.far = far;
            camera.fov = fov;
            camera.position.set(position[0], position[1], position[2]);
            camera.up.set(up[0], up[1], up[2]);
            camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
            camera.updateProjectionMatrix();
            
            renderer.render(scene, camera);
            renderer.resetState();
        }
    });
    
    map.add(glLayer);

    let lastTime = Date.now();

    function animate() {
        const now = Date.now();
        const deltaTime = now - lastTime;
        lastTime = now;

        playback.update(deltaTime);
        
        const simTime = playback.currentTime;
        
        trains.forEach(train => {
            train.update(simTime);
        });
        
        map.render();
        requestAnimationFrame(animate);
    }
    
    animate();

    window.addEventListener('resize', () => {
        if(camera && renderer) {
             camera.aspect = window.innerWidth / window.innerHeight;
             camera.updateProjectionMatrix();
             renderer.setSize(window.innerWidth, window.innerHeight);
        }
    });
});
