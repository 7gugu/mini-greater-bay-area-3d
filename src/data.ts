import { RailSystemData } from './types/RailData';
import { getHkRailData, initialCenterWGS84 } from './hk_mtr_data';

// Export mutable railData object
export const railData: RailSystemData = {
    tracks: {},
    trips: []
};

export async function loadRailData(AMap: any): Promise<RailSystemData> {
    let data: RailSystemData | null = null;

    // Try load from LocalStorage
    const savedData = localStorage.getItem('railData');
    
    if (savedData) {
        try {
            data = JSON.parse(savedData);
            console.log('Loaded railData from LocalStorage');
        } catch (e) {
            console.error('Failed to parse saved railData, using default HK MTR data', e);
        }
    }
    
    // Default to HK MTR data (converted) if no local storage or parse error
    if (!data) {
        data = await getHkRailData(AMap);
    }

    // Update the exported object in place
    // We clear existing keys first to be safe, though initially empty
    // But since we want to replace content, Object.assign is good if we want to keep the reference.
    // If we wanted to clear, we could delete keys, but typically this is called once.
    railData.tracks = data.tracks;
    railData.trips = data.trips;
    
    return railData;
}

export { initialCenterWGS84 };
