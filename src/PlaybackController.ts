export class PlaybackController {
    container: HTMLElement;
    timeDisplay: HTMLElement;
    playBtn: HTMLButtonElement;
    
    isPlaying: boolean = true;
    currentTime: number;
    baseTime: number;
    initialBaseTime: number;

    constructor(initialBaseTime: number = Date.now()) {
        this.initialBaseTime = initialBaseTime;
        this.baseTime = initialBaseTime;
        this.currentTime = initialBaseTime;
        this.createUI();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.className = 'ui-panel'; // Use CSS class
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        this.container.style.minWidth = '240px';
        this.container.style.zIndex = '1000';

        // Time Display
        this.timeDisplay = document.createElement('div');
        this.timeDisplay.className = 'time-display';
        this.timeDisplay.innerText = this.formatTime(this.currentTime);
        this.container.appendChild(this.timeDisplay);

        // Controls Row
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '8px';

        // Play/Pause
        this.playBtn = document.createElement('button');
        this.playBtn.className = 'ui-button primary';
        this.playBtn.style.flex = '1';
        this.playBtn.innerHTML = this.isPlaying ? 
            '<span style="font-size:16px">⏸</span>' : 
            '<span style="font-size:16px">▶</span>';
        this.playBtn.onclick = () => this.togglePlay();
        controls.appendChild(this.playBtn);

        // Reset
        const resetBtn = document.createElement('button');
        resetBtn.className = 'ui-button';
        resetBtn.style.flex = '1';
        resetBtn.innerHTML = '<span style="font-size:16px">↺</span> Replay';
        resetBtn.onclick = () => this.reset();
        controls.appendChild(resetBtn);

        this.container.appendChild(controls);
        document.body.appendChild(this.container);
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        // Use innerHTML for icons, keeping it simple without svg assets for now
        this.playBtn.innerHTML = this.isPlaying ? 
            '<span style="font-size:16px">⏸</span>' : 
            '<span style="font-size:16px">▶</span>';
        
        if (!this.isPlaying) {
            this.playBtn.classList.remove('primary'); // Optional visual cue
            this.playBtn.classList.add('success');
        } else {
            this.playBtn.classList.add('primary');
            this.playBtn.classList.remove('success');
        }
    }

    reset() {
        this.currentTime = this.initialBaseTime;
        this.isPlaying = true;
        this.playBtn.innerHTML = '<span style="font-size:16px">⏸</span>';
        this.playBtn.classList.add('primary');
        this.updateDisplay();
    }

    update(deltaTime: number) {
        if (this.isPlaying) {
            this.currentTime += deltaTime;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        this.timeDisplay.innerText = this.formatTime(this.currentTime);
    }

    formatTime(ms: number): string {
        const date = new Date(ms);
        const dateStr = date.toLocaleDateString('en-GB');
        const timeStr = date.toLocaleTimeString('en-GB', { hour12: false });
        const msStr = Math.floor(date.getMilliseconds() / 100).toString();
        return `${dateStr} ${timeStr}.${msStr}`;
    }
}
