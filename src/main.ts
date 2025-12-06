import { railData, initialCenter } from './data';
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
        viewMode: '3D', pitch: 60, zoom: 14, center: initialCenter,
        mapStyle: 'amap://styles/dark', skyColor: '#1f263a'
    });

    const customCoords = map.customCoords;
    customCoords.setCenter(initialCenter);

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
                alpha: true, 
            });
            renderer.autoClear = false;
            
            scene = new THREE.Scene();

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(1000, -100, 900);
            scene.add(directionalLight);
            
            // Initialize Trains from Real Data Structure
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
            
            // For now, center is fixed at initial path start.
            // If paths span huge area, dynamic re-centering might be needed.
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

    function animate() {
        const now = Date.now();
        
        trains.forEach(train => {
            train.update(now);
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
