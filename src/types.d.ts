// Minimal Type Definitions for AMap to satisfy TS
declare namespace AMap {
    class Map {
        constructor(div: string | HTMLElement, opts: any);
        add(obj: any): void;
        setCenter(center: any, immediate?: boolean): void;
        lngLatToGeodeticCoord(lnglat: any): { x: number, y: number };
        geodeticCoordToLngLat(pixel: Pixel): any;
        plugin(name: string, callback: () => void): void;
        customCoords: any; // CustomCoords property
        render(): void;
    }
    class Pixel {
        constructor(x: number, y: number);
        x: number;
        y: number;
    }
    class LngLat {
        constructor(lng: number, lat: number);
        offset(w: number, s: number): LngLat;
        distance(lnglat: LngLat): number;
        getLng(): number;
        getLat(): number;
    }
    // Removed Object3D definitions as we are switching to GLCustomLayer + Three.js
    
    class GLCustomLayer {
        constructor(opts: any);
        setzIndex(z: number): void;
    }
}

declare const AMapLoader: {
    load(config: any): Promise<any>;
};

declare module "*.css";
