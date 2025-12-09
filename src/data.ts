import { RailSystemData } from './types/RailData';
import { hkRailData, initialCenter as hkCenter } from './hk_mtr_data';

// Try load from LocalStorage
const savedData = localStorage.getItem('railData');
let finalData: RailSystemData;

if (savedData) {
    try {
        finalData = JSON.parse(savedData);
        console.log('Loaded railData from LocalStorage');
    } catch (e) {
        console.error('Failed to parse saved railData, using default HK MTR data', e);
        finalData = hkRailData;
    }
} else {
    // Default to HK MTR data
    finalData = hkRailData;
}

export const railData = finalData;

// Export initial center (Default to HK Central if not overridden)
export const initialCenter = hkCenter;
