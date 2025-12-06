import { RailSystemData, TrackGeometry, LngLat, TrainTrip, TrackPoint } from './types/RailData';
import { railData } from './data';

export class Editor {
    map: AMap.Map;
    AMap: any;
    isEditing: boolean = false;
    
    // Editor State
    activePolyline: any | null = null;
    activeEditor: any | null = null;
    currentTrackId: string | null = null;

    // UI Elements
    container: HTMLElement;
    contentContainer: HTMLElement;
    tabContainer: HTMLElement;
    activeTab: 'tracks' | 'schedule' = 'tracks';

    // Callbacks
    onDataUpdate: (() => void) | null = null;

    constructor(map: AMap.Map, AMap: any) {
        this.map = map;
        this.AMap = AMap;
        this.createUI();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.width = '350px';
        this.container.style.maxHeight = '90vh';
        this.container.style.overflowY = 'auto';
        this.container.style.background = 'rgba(0, 0, 0, 0.8)';
        this.container.style.color = '#fff';
        this.container.style.borderRadius = '5px';
        this.container.style.zIndex = '1000';
        this.container.style.padding = '10px';

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '10px';
        
        const title = document.createElement('h3');
        title.textContent = 'Rail Editor';
        title.style.margin = '0';
        header.appendChild(title);
        
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Toggle Edit Mode';
        toggleBtn.onclick = () => this.toggleEditMode();
        header.appendChild(toggleBtn);
        this.container.appendChild(header);

        // Tab Container
        this.tabContainer = document.createElement('div');
        this.tabContainer.style.display = 'none'; // Hidden initially
        this.tabContainer.style.marginBottom = '10px';
        this.tabContainer.innerHTML = `
            <div style="display: flex; gap: 5px;">
                <button id="tab-tracks" style="flex: 1;">Tracks</button>
                <button id="tab-schedule" style="flex: 1;">Schedule</button>
            </div>
        `;
        this.container.appendChild(this.tabContainer);

        // Content Container
        this.contentContainer = document.createElement('div');
        this.contentContainer.style.display = 'none'; // Hidden initially
        this.container.appendChild(this.contentContainer);

        // Footer Actions
        const footer = document.createElement('div');
        footer.style.marginTop = '10px';
        footer.style.borderTop = '1px solid #444';
        footer.style.paddingTop = '10px';
        footer.style.display = 'flex';
        footer.style.gap = '5px';
        
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Log JSON';
        exportBtn.style.flex = '1';
        exportBtn.onclick = () => {
            console.log(JSON.stringify(railData, null, 2));
            alert('Data logged to console');
        };
        footer.appendChild(exportBtn);

        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.style.flex = '1';
        resetBtn.style.background = '#f44336';
        resetBtn.onclick = () => {
            if(confirm('Clear local storage and reset data?')) {
                localStorage.removeItem('railData');
                location.reload();
            }
        };
        footer.appendChild(resetBtn);

        this.container.appendChild(footer);

        document.body.appendChild(this.container);
        
        // Bind Tab Events
        this.container.querySelector('#tab-tracks')!.addEventListener('click', () => this.switchTab('tracks'));
        this.container.querySelector('#tab-schedule')!.addEventListener('click', () => this.switchTab('schedule'));
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        
        if (this.isEditing) {
            this.tabContainer.style.display = 'block';
            this.contentContainer.style.display = 'block';
            this.switchTab(this.activeTab);
        } else {
            this.tabContainer.style.display = 'none';
            this.contentContainer.style.display = 'none';
            this.stopEditingTrack();
        }
    }

    switchTab(tab: 'tracks' | 'schedule') {
        this.activeTab = tab;
        this.contentContainer.innerHTML = ''; // Clear content
        
        // Update Tab Styles
        const trackBtn = this.container.querySelector('#tab-tracks') as HTMLElement;
        const scheduleBtn = this.container.querySelector('#tab-schedule') as HTMLElement;
        trackBtn.style.background = tab === 'tracks' ? '#4CAF50' : '';
        scheduleBtn.style.background = tab === 'schedule' ? '#4CAF50' : '';

        if (tab === 'tracks') {
            this.renderTracksUI();
        } else {
            this.stopEditingTrack(); // Stop track editing when switching away
            this.renderScheduleUI();
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('railData', JSON.stringify(railData));
    }

    triggerUpdate() {
        this.saveToLocalStorage();
        if (this.onDataUpdate) this.onDataUpdate();
    }

    // --- Tracks UI ---
    renderTracksUI() {
        this.contentContainer.innerHTML = '';
        const wrapper = document.createElement('div');
        
        const selectLabel = document.createElement('label');
        selectLabel.textContent = 'Select Track: ';
        wrapper.appendChild(selectLabel);

        const select = document.createElement('select');
        select.style.width = '100%';
        select.style.marginBottom = '10px';
        
        Object.keys(railData.tracks).forEach(id => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = id;
            select.appendChild(opt);
        });
        
        select.onchange = (e) => {
            this.startEditingTrack((e.target as HTMLSelectElement).value);
        };
        
        if (this.currentTrackId) select.value = this.currentTrackId;
        wrapper.appendChild(select);

        // Point List Container
        const pointListDiv = document.createElement('div');
        pointListDiv.id = 'point-list';
        pointListDiv.style.maxHeight = '300px';
        pointListDiv.style.overflowY = 'auto';
        pointListDiv.style.border = '1px solid #555';
        pointListDiv.style.marginTop = '10px';
        wrapper.appendChild(pointListDiv);

        this.contentContainer.appendChild(wrapper);

        // Auto-select first if none selected
        if (!this.currentTrackId && Object.keys(railData.tracks).length > 0) {
            this.startEditingTrack(Object.keys(railData.tracks)[0]);
            select.value = this.currentTrackId!;
        } else if (this.currentTrackId) {
            this.renderPointList();
        }
    }

    renderPointList() {
        const container = this.contentContainer.querySelector('#point-list');
        if (!container || !this.currentTrackId) return;
        
        container.innerHTML = '';
        const track = railData.tracks[this.currentTrackId];
        
        track.path.forEach((pt, idx) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '5px';
            row.style.padding = '5px';
            row.style.borderBottom = '1px solid #444';
            row.style.alignItems = 'center';

            // Index
            const idxSpan = document.createElement('span');
            idxSpan.textContent = `#${idx}`;
            idxSpan.style.width = '30px';
            row.appendChild(idxSpan);

            // Name
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = 'Name';
            nameInput.style.width = '80px';
            nameInput.value = pt.name || '';
            nameInput.onchange = (e) => {
                pt.name = (e.target as HTMLInputElement).value;
                this.triggerUpdate();
            };
            row.appendChild(nameInput);

            // Coords (Lng/Lat)
            const lngInput = document.createElement('input');
            lngInput.type = 'number';
            lngInput.step = '0.00001';
            lngInput.style.width = '70px';
            lngInput.value = pt.location[0].toString();
            lngInput.onchange = (e) => {
                pt.location[0] = parseFloat((e.target as HTMLInputElement).value);
                this.updatePolylineFromData();
                this.triggerUpdate();
            };
            row.appendChild(lngInput);

            const latInput = document.createElement('input');
            latInput.type = 'number';
            latInput.step = '0.00001';
            latInput.style.width = '70px';
            latInput.value = pt.location[1].toString();
            latInput.onchange = (e) => {
                pt.location[1] = parseFloat((e.target as HTMLInputElement).value);
                this.updatePolylineFromData();
                this.triggerUpdate();
            };
            row.appendChild(latInput);

            // Delete Btn
            const delBtn = document.createElement('button');
            delBtn.textContent = 'x';
            delBtn.style.color = 'red';
            delBtn.onclick = () => {
                track.path.splice(idx, 1);
                this.updatePolylineFromData();
                this.renderPointList();
                this.triggerUpdate();
            };
            row.appendChild(delBtn);

            container.appendChild(row);
        });

        // Add Point Button
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add Point';
        addBtn.style.width = '100%';
        addBtn.style.marginTop = '5px';
        addBtn.onclick = () => {
            // Add near last point or default
            const last = track.path[track.path.length - 1];
            const newLoc: LngLat = last ? [last.location[0] + 0.001, last.location[1] + 0.001] : [114.0, 22.6];
            track.path.push({ location: newLoc });
            this.updatePolylineFromData();
            this.renderPointList();
            this.triggerUpdate();
        };
        container.appendChild(addBtn);
    }

    startEditingTrack(trackId: string) {
        this.stopEditingTrack(); 
        this.currentTrackId = trackId;
        const track = railData.tracks[trackId];
        if (!track) return;

        const path = track.path.map(p => p.location);
        this.activePolyline = new this.AMap.Polyline({
            path: path,
            strokeColor: "#FF33FF", 
            strokeWeight: 6,
            strokeOpacity: 0.9,
            zIndex: 200,
            bubble: true
        });

        this.map.add(this.activePolyline);

        this.renderPointList();

        if (!this.AMap.PolylineEditor) return;
        this.activeEditor = new this.AMap.PolylineEditor(this.map, this.activePolyline);
        this.activeEditor.open();

        // Listen to editor events to sync list
        this.activeEditor.on('addnode', (e: any) => this.syncDataFromPolyline());
        this.activeEditor.on('removenode', (e: any) => this.syncDataFromPolyline());
        this.activeEditor.on('adjust', (e: any) => this.syncDataFromPolyline());
    }

    syncDataFromPolyline() {
        if (!this.currentTrackId || !this.activePolyline) return;
        const newPath = this.activePolyline.getPath(); // Array of AMap.LngLat
        const track = railData.tracks[this.currentTrackId];

        // We try to preserve metadata (name) if length matches or minimal change
        // But for full flexibility, we just map new coords.
        // If length changed, we might lose names of shifted points unless we diff.
        // For MVP: Rebuild path array, keeping names for indices that exist.
        
        const newTrackPoints: TrackPoint[] = newPath.map((p: any, i: number) => {
            const existing = track.path[i];
            return {
                location: [p.getLng(), p.getLat()],
                name: existing ? existing.name : undefined
            };
        });
        
        track.path = newTrackPoints;
        this.renderPointList(); // Refresh list to show new coords
        this.triggerUpdate();
    }

    updatePolylineFromData() {
        if (!this.currentTrackId || !this.activePolyline) return;
        const track = railData.tracks[this.currentTrackId];
        const path = track.path.map(p => p.location);
        this.activePolyline.setPath(path);
        // Editor needs refresh? Usually setPath updates view, but editor handles might need reset.
        // Re-opening editor is safest
        if (this.activeEditor) {
            this.activeEditor.close();
            this.activeEditor.open();
        }
    }

    stopEditingTrack() {
        if (this.activeEditor) {
            // Final sync not needed as we sync on events, but good measure
            // this.syncDataFromPolyline(); 
            this.activeEditor.close();
            this.activeEditor = null;
        }
        if (this.activePolyline) {
            this.map.remove(this.activePolyline);
            this.activePolyline = null;
        }
        this.currentTrackId = null;
    }

    // --- Schedule UI ---
    renderScheduleUI() {
        this.contentContainer.innerHTML = '';
        const wrapper = document.createElement('div');
        
        // List of Trips
        const listContainer = document.createElement('div');
        listContainer.style.maxHeight = '300px';
        listContainer.style.overflowY = 'auto';
        listContainer.style.marginBottom = '10px';
        listContainer.style.border = '1px solid #555';

        railData.trips.forEach((trip, index) => {
            const item = document.createElement('div');
            item.style.padding = '5px';
            item.style.borderBottom = '1px solid #444';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            
            const info = document.createElement('span');
            const startTime = new Date(trip.legs[0]?.departureTime || 0).toLocaleTimeString();
            info.textContent = `${trip.trainId} (${startTime})`;
            item.appendChild(info);
            
            const btnGroup = document.createElement('div');
            
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginRight = '5px';
            editBtn.onclick = () => this.renderTripForm(index);
            btnGroup.appendChild(editBtn);
            
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Del';
            delBtn.style.background = '#d32f2f';
            delBtn.onclick = () => {
                if(confirm('Delete ' + trip.trainId + '?')) {
                    railData.trips.splice(index, 1);
                    this.triggerUpdate();
                    this.renderScheduleUI(); 
                }
            };
            btnGroup.appendChild(delBtn);
            
            item.appendChild(btnGroup);
            listContainer.appendChild(item);
        });

        wrapper.appendChild(listContainer);

        // Add New Trip Button
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add New Trip';
        addBtn.style.width = '100%';
        addBtn.onclick = () => {
            const newTrip: TrainTrip = {
                trainId: `G${Date.now().toString().slice(-4)}`,
                legs: []
            };
            railData.trips.push(newTrip);
            this.renderTripForm(railData.trips.length - 1);
        };
        wrapper.appendChild(addBtn);

        this.contentContainer.appendChild(wrapper);
    }

    renderTripForm(tripIndex: number) {
        this.contentContainer.innerHTML = ''; 
        const trip = railData.trips[tripIndex];
        
        const wrapper = document.createElement('div');
        
        // Back Button
        const backBtn = document.createElement('button');
        backBtn.textContent = '< Back to List';
        backBtn.onclick = () => this.renderScheduleUI();
        wrapper.appendChild(backBtn);

        // Train ID Input
        const idRow = document.createElement('div');
        idRow.style.margin = '10px 0';
        idRow.innerHTML = `<label>Train ID: </label>`;
        const idInput = document.createElement('input');
        idInput.type = 'text';
        idInput.value = trip.trainId;
        idInput.onchange = (e) => {
            trip.trainId = (e.target as HTMLInputElement).value;
            this.triggerUpdate();
        };
        idRow.appendChild(idInput);
        wrapper.appendChild(idRow);

        // Legs Section
        const legsContainer = document.createElement('div');
        const renderLegs = () => {
            legsContainer.innerHTML = '<h4>Legs</h4>';
            trip.legs.forEach((leg, idx) => {
                const legDiv = document.createElement('div');
                legDiv.style.border = '1px solid #555';
                legDiv.style.padding = '5px';
                legDiv.style.marginBottom = '5px';
                
                // Track Selector
                const trackRow = document.createElement('div');
                trackRow.innerHTML = `<label>Track: </label>`;
                const trackSel = document.createElement('select');
                Object.keys(railData.tracks).forEach(tid => {
                    const opt = document.createElement('option');
                    opt.value = tid;
                    opt.textContent = tid;
                    if(tid === leg.trackId) opt.selected = true;
                    trackSel.appendChild(opt);
                });
                trackSel.onchange = (e) => {
                    leg.trackId = (e.target as HTMLSelectElement).value;
                    this.triggerUpdate();
                };
                trackRow.appendChild(trackSel);
                legDiv.appendChild(trackRow);

                // Time Inputs
                const tsToVal = (ts: number) => new Date(ts).toISOString().slice(0, 16);
                const valToTs = (val: string) => new Date(val).getTime();

                const timeRow = document.createElement('div');
                timeRow.style.display = 'flex';
                timeRow.style.flexDirection = 'column';
                timeRow.style.gap = '5px';
                timeRow.style.marginTop = '5px';
                
                // Departure
                const depDiv = document.createElement('div');
                depDiv.innerHTML = `<label>Dep: </label>`;
                const depInput = document.createElement('input');
                depInput.type = 'datetime-local';
                depInput.value = tsToVal(leg.departureTime);
                depInput.onchange = (e) => {
                    leg.departureTime = valToTs((e.target as HTMLInputElement).value);
                    this.triggerUpdate();
                };
                depDiv.appendChild(depInput);
                timeRow.appendChild(depDiv);
                
                // Arrival
                const arrDiv = document.createElement('div');
                arrDiv.innerHTML = `<label>Arr: </label>`;
                const arrInput = document.createElement('input');
                arrInput.type = 'datetime-local';
                arrInput.value = tsToVal(leg.arrivalTime);
                arrInput.onchange = (e) => {
                    leg.arrivalTime = valToTs((e.target as HTMLInputElement).value);
                    this.triggerUpdate();
                };
                arrDiv.appendChild(arrInput);
                timeRow.appendChild(arrDiv);

                legDiv.appendChild(timeRow);
                
                // Remove Leg Button
                const rmBtn = document.createElement('button');
                rmBtn.textContent = 'Remove Leg';
                rmBtn.style.marginTop = '5px';
                rmBtn.style.fontSize = '12px';
                rmBtn.onclick = () => {
                    trip.legs.splice(idx, 1);
                    renderLegs();
                    this.triggerUpdate();
                };
                legDiv.appendChild(rmBtn);

                legsContainer.appendChild(legDiv);
            });

            // Add Leg Button
            const addLegBtn = document.createElement('button');
            addLegBtn.textContent = '+ Add Leg';
            addLegBtn.onclick = () => {
                const now = Date.now();
                const firstTrack = Object.keys(railData.tracks)[0];
                trip.legs.push({
                    trackId: firstTrack,
                    fromStationId: 'A',
                    toStationId: 'B',
                    departureTime: now,
                    arrivalTime: now + 300000 
                });
                renderLegs();
                this.triggerUpdate();
            };
            legsContainer.appendChild(addLegBtn);
        };
        
        renderLegs();
        wrapper.appendChild(legsContainer);
        this.contentContainer.appendChild(wrapper);
    }
}
