import { railData, initialCenter } from './data';
import { Train } from './Train';
import { config } from './config';
import { Editor } from './Editor';
import { PlaybackController } from './PlaybackController';
import '../assets/style.css'; 
import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from 'three.meshline';

// Set security config before loading AMap
(window as any)._AMapSecurityConfig = { securityJsCode: config.AMAP_SECURITY_CODE };

import AMapLoader from '@amap/amap-jsapi-loader';

const AMAP_KEY = config.AMAP_KEY;

AMapLoader.load({
    key: AMAP_KEY,
    version: "2.0",
    plugins: ['AMap.PolylineEditor'] 
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
    const trackMeshes: THREE.Mesh[] = []; 
    const stationMeshes: THREE.Mesh[] = [];

    // Playback Controller
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
    
    // Function to rebuild scene elements
    const refreshScene = () => {
        console.log("Refreshing Scene...");
        if (!scene) return;
        
        // 1. Cleanup Trains
        scene.remove(...trains.map(t => t.mesh));
        trains.length = 0;
        
        // 2. Cleanup Tracks & Stations
        scene.remove(...trackMeshes);
        trackMeshes.forEach(m => {
            m.geometry.dispose();
            (m.material as THREE.Material).dispose();
        });
        trackMeshes.length = 0;

        scene.remove(...stationMeshes);
        stationMeshes.forEach(m => {
            m.geometry.dispose();
            (m.material as THREE.Material).dispose();
        });
        stationMeshes.length = 0;

        // 3. Rebuild Tracks (MeshLine)
        Object.values(railData.tracks).forEach(track => {
            const pathLngLats = track.path.map(p => p.location);
            const coords = customCoords.lngLatsToCoords(pathLngLats);
            
            // 3.1 Track Lines
            const points: number[] = [];
            for(let i=0; i<coords.length; i++) {
                points.push(coords[i][0], coords[i][1], 20); 
            }
            
            const line = new MeshLine();
            line.setPoints(points);
            
            const color = track.color || '#00ffff';
            
            const material = new MeshLineMaterial({
                color: new THREE.Color(color),
                opacity: 0.8,
                transparent: true,
                lineWidth: 60, // World units, increased 3x
                resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
                sizeAttenuation: 1, 
                near: camera.near,
                far: camera.far
            });
            
            const mesh = new THREE.Mesh(line, material);
            scene.add(mesh);
            trackMeshes.push(mesh);

            // 3.2 Stations (Circles)
            // We identify stations by having a 'name' property
            track.path.forEach((p, idx) => {
                if (p.name) {
                    const pos = coords[idx];
                    // Station Geometry: Circle (Cylinder with low height)
                    // Increased size 3x: 60 -> 180
                    const stationGeo = new THREE.CylinderGeometry(180, 180, 10, 32);
                    stationGeo.rotateX(Math.PI / 2); // Lay flat
                    
                    // White fill, Black border effect
                    // Use simple materials
                    const fillMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                    const stationMesh = new THREE.Mesh(stationGeo, fillMat);
                    stationMesh.position.set(pos[0], pos[1], 25); // Slightly above track
                    scene.add(stationMesh);
                    stationMeshes.push(stationMesh);

                    // Black Border (Ring)
                    // Increased size 3x: 50->150, 70->210
                    const borderGeo = new THREE.RingGeometry(150, 210, 32);
                    const borderMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
                    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
                    borderMesh.position.set(pos[0], pos[1], 26);
                    scene.add(borderMesh);
                    stationMeshes.push(borderMesh);
                }
            });
        });

        // 4. Rebuild Trains
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

    // Editor Initialization
    const editor = new Editor(map, AMap);
    editor.onDataUpdate = refreshScene;

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

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(1000, -100, 900);
            scene.add(directionalLight);
            
            // Initial Build
            refreshScene();
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
