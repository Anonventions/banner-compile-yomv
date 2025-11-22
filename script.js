// Application State
const state = {
    canvas: null,
    ctx: null,
    layers: [],
    baseImage: null,
    bannerImage: null,
    letters: {},
    zoom: 1,
    canvasWidth: 800,
    canvasHeight: 600,
    selectedLayer: null,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    gridEnabled: false,
    snapEnabled: false,
    presets: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initEventListeners();
    addDefaultLayers();
    loadPresets();
    render();
});

// Initialize Canvas
function initCanvas() {
    state.canvas = document.getElementById('mainCanvas');
    state.ctx = state.canvas.getContext('2d', { willReadFrequently: true });
    state.ctx.imageSmoothingEnabled = false;
    setCanvasSize(800, 600);
}

// Set Canvas Size
function setCanvasSize(width, height) {
    state.canvasWidth = width;
    state.canvasHeight = height;
    state.canvas.width = width;
    state.canvas.height = height;
    updateCanvasInfo();
}

// Initialize Event Listeners
function initEventListeners() {
    // File uploads
    document.getElementById('baseImage').addEventListener('change', handleBaseImage);
    document.getElementById('bannerImage').addEventListener('change', handleBannerImage);
    document.getElementById('lettersFolder').addEventListener('change', handleLetters);
    document.getElementById('customLayer').addEventListener('change', handleCustomLayer);
    
    // Banner properties
    document.getElementById('bannerColor').addEventListener('input', updateBannerColor);
    document.getElementById('bannerX').addEventListener('input', updateBannerPosition);
    document.getElementById('bannerY').addEventListener('input', updateBannerPosition);
    document.getElementById('bannerZ').addEventListener('input', updateBannerZ);
    
    // Text properties
    document.getElementById('bannerText').addEventListener('input', updateText);
    document.getElementById('textColor').addEventListener('input', updateTextColor);
    document.getElementById('letterSpacing').addEventListener('input', updateLetterSpacing);
    document.getElementById('textX').addEventListener('input', updateTextPosition);
    document.getElementById('textY').addEventListener('input', updateTextPosition);
    document.getElementById('textZ').addEventListener('input', updateTextZ);
    
    // Canvas controls
    document.getElementById('zoomSlider').addEventListener('input', handleZoom);
    document.getElementById('resetZoom').addEventListener('click', resetZoom);
    document.getElementById('centerCanvas').addEventListener('click', centerCanvas);
    document.getElementById('toggleGrid').addEventListener('click', toggleGrid);
    document.getElementById('toggleSnap').addEventListener('click', toggleSnap);
    
    // Project controls
    document.getElementById('saveProject').addEventListener('click', saveProject);
    document.getElementById('loadProject').addEventListener('click', () => {
        document.getElementById('loadProjectInput').click();
    });
    document.getElementById('loadProjectInput').addEventListener('change', loadProject);
    document.getElementById('exportBtn').addEventListener('click', exportCanvas);
    
    // Layer controls
    document.getElementById('addLayer').addEventListener('click', () => {
        document.getElementById('customLayer').click();
    });
    
    // Preset controls
    document.getElementById('savePreset').addEventListener('click', savePreset);
    
    // Canvas interactions
    state.canvas.addEventListener('mousedown', handleCanvasMouseDown);
    state.canvas.addEventListener('mousemove', handleCanvasMouseMove);
    state.canvas.addEventListener('mouseup', handleCanvasMouseUp);
    state.canvas.addEventListener('mouseleave', handleCanvasMouseUp);
    document.getElementById('canvasWrapper').addEventListener('mousemove', updateMousePos);
    state.canvas.addEventListener('wheel', handleWheel, { passive: false });
}

// Add Default Layers
function addDefaultLayers() {
    state.layers = [
        { id: 1, name: 'Base', type: 'base', visible: true, data: null, x: 0, y: 0, z: 1 },
        { id: 2, name: 'Banner', type: 'banner', visible: true, data: null, x: 0, y: 0, z: 2, color: null },
        { id: 3, name: 'Text', type: 'text', visible: true, data: null, x: 0, y: 0, z: 3, text: '', color: '#ffffff', spacing: 0 }
    ];
    updateLayersList();
}

// File Handlers
async function handleBaseImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    document.getElementById('baseFileName').textContent = file.name;
    const img = await loadImage(file);
    state.baseImage = img;
    setCanvasSize(img.width, img.height);
    
    const layer = state.layers.find(l => l.type === 'base');
    if (layer) layer.data = img;
    
    render();
}

async function handleBannerImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    document.getElementById('bannerFileName').textContent = file.name;
    const img = await loadImage(file);
    state.bannerImage = img;
    
    const layer = state.layers.find(l => l.type === 'banner');
    if (layer) layer.data = img;
    
    render();
}

async function handleLetters(e) {
    const files = Array.from(e.target.files);
    document.getElementById('lettersFileName').textContent = `${files.length} files`;
    
    state.letters = {};
    for (const file of files) {
        const img = await loadImage(file);
        const letterName = file.name.replace(/\.(png|jpg|jpeg)$/i, '').toLowerCase();
        state.letters[letterName] = img;
    }
    
    render();
}

async function handleCustomLayer(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const img = await loadImage(file);
    const maxZ = Math.max(...state.layers.map(l => l.z), 0);
    
    const newLayer = {
        id: Date.now(),
        name: file.name.replace(/\.(png|jpg|jpeg)$/i, ''),
        type: 'custom',
        visible: true,
        data: img,
        x: 0,
        y: 0,
        z: maxZ + 1
    };
    
    state.layers.push(newLayer);
    updateLayersList();
    render();
}

// Property Updates
function updateBannerColor(e) {
    const layer = state.layers.find(l => l.type === 'banner');
    if (layer) {
        layer.color = e.target.value;
        render();
    }
}

function updateBannerPosition() {
    const layer = state.layers.find(l => l.type === 'banner');
    if (layer) {
        layer.x = parseInt(document.getElementById('bannerX').value) || 0;
        layer.y = parseInt(document.getElementById('bannerY').value) || 0;
        render();
    }
}

function updateBannerZ() {
    const layer = state.layers.find(l => l.type === 'banner');
    if (layer) {
        layer.z = parseInt(document.getElementById('bannerZ').value) || 0;
        sortLayers();
        updateLayersList();
        render();
    }
}

function updateText(e) {
    const layer = state.layers.find(l => l.type === 'text');
    if (layer) {
        layer.text = e.target.value.toUpperCase();
        render();
    }
}

function updateTextColor(e) {
    const layer = state.layers.find(l => l.type === 'text');
    if (layer) {
        layer.color = e.target.value;
        render();
    }
}

function updateLetterSpacing(e) {
    const spacing = parseInt(e.target.value);
    document.getElementById('spacingValue').textContent = spacing;
    
    const layer = state.layers.find(l => l.type === 'text');
    if (layer) {
        layer.spacing = spacing;
        render();
    }
}

function updateTextPosition() {
    const layer = state.layers.find(l => l.type === 'text');
    if (layer) {
        layer.x = parseInt(document.getElementById('textX').value) || 0;
        layer.y = parseInt(document.getElementById('textY').value) || 0;
        render();
    }
}

function updateTextZ() {
    const layer = state.layers.find(l => l.type === 'text');
    if (layer) {
        layer.z = parseInt(document.getElementById('textZ').value) || 0;
        sortLayers();
        updateLayersList();
        render();
    }
}

// Canvas Controls
function handleZoom(e) {
    const zoom = parseInt(e.target.value);
    document.getElementById('zoomValue').textContent = zoom + '%';
    document.getElementById('zoomDisplay').textContent = zoom + '%';
    state.zoom = zoom / 100;
    updateCanvasTransform();
}

function resetZoom() {
    state.zoom = 1;
    document.getElementById('zoomSlider').value = 100;
    document.getElementById('zoomValue').textContent = '100%';
    document.getElementById('zoomDisplay').textContent = '100%';
    updateCanvasTransform();
}

function centerCanvas() {
    const wrapper = document.getElementById('canvasWrapper');
    wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;
    wrapper.scrollTop = (wrapper.scrollHeight - wrapper.clientHeight) / 2;
}

function toggleGrid() {
    state.gridEnabled = !state.gridEnabled;
    document.getElementById('toggleGrid').classList.toggle('active');
    render();
}

function toggleSnap() {
    state.snapEnabled = !state.snapEnabled;
    document.getElementById('toggleSnap').classList.toggle('active');
}

function updateCanvasTransform() {
    state.canvas.style.transform = `scale(${state.zoom})`;
}

function updateMousePos(e) {
    const rect = state.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / state.zoom);
    const y = Math.floor((e.clientY - rect.top) / state.zoom);
    document.getElementById('mousePos').textContent = `${x}, ${y}`;
}

function handleWheel(e) {
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        const newZoom = Math.max(25, Math.min(500, parseInt(document.getElementById('zoomSlider').value) + delta));
        document.getElementById('zoomSlider').value = newZoom;
        handleZoom({ target: { value: newZoom } });
    }
}

// Canvas Interaction
function handleCanvasMouseDown(e) {
    const rect = state.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / state.zoom);
    const y = Math.floor((e.clientY - rect.top) / state.zoom);
    
    state.isDragging = true;
    state.dragStart = { x, y };
    
    // Find clicked layer
    const sortedLayers = [...state.layers].sort((a, b) => b.z - a.z);
    for (const layer of sortedLayers) {
        if (layer.visible && isPointInLayer(x, y, layer)) {
            state.selectedLayer = layer;
            break;
        }
    }
}

function handleCanvasMouseMove(e) {
    if (!state.isDragging || !state.selectedLayer) return;
    
    const rect = state.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / state.zoom);
    const y = Math.floor((e.clientY - rect.top) / state.zoom);
    
    let deltaX = x - state.dragStart.x;
    let deltaY = y - state.dragStart.y;
    
    if (state.snapEnabled) {
        deltaX = Math.round(deltaX / 10) * 10;
        deltaY = Math.round(deltaY / 10) * 10;
    }
    
    state.selectedLayer.x += deltaX;
    state.selectedLayer.y += deltaY;
    
    state.dragStart = { x, y };
    
    // Update property inputs
    if (state.selectedLayer.type === 'banner') {
        document.getElementById('bannerX').value = state.selectedLayer.x;
        document.getElementById('bannerY').value = state.selectedLayer.y;
    } else if (state.selectedLayer.type === 'text') {
        document.getElementById('textX').value = state.selectedLayer.x;
        document.getElementById('textY').value = state.selectedLayer.y;
    }
    
    render();
}

function handleCanvasMouseUp() {
    state.isDragging = false;
    state.selectedLayer = null;
}

function isPointInLayer(x, y, layer) {
    if (!layer.data && layer.type !== 'text') return false;
    
    if (layer.type === 'text') {
        const text = layer.text || '';
        const spacing = layer.spacing || 0;
        let width = 0;
        let height = 0;
        
        for (const char of text) {
            const letterImg = state.letters[char.toLowerCase()];
            if (letterImg) {
                width += letterImg.width + spacing;
                height = Math.max(height, letterImg.height);
            }
        }
        
        return x >= layer.x && x <= layer.x + width &&
               y >= layer.y && y <= layer.y + height;
    }
    
    return x >= layer.x && x <= layer.x + layer.data.width &&
           y >= layer.y && y <= layer.y + layer.data.height;
}

// Layer Management
function sortLayers() {
    state.layers.sort((a, b) => a.z - b.z);
}

function updateLayersList() {
    const list = document.getElementById('layersList');
    list.innerHTML = '';
    
    const sorted = [...state.layers].sort((a, b) => b.z - a.z);
    
    sorted.forEach(layer => {
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.dataset.layerId = layer.id;
        
        const visIcon = layer.visible ? 'fa-eye' : 'fa-eye-slash';
        const visClass = layer.visible ? '' : 'hidden';
        
        item.innerHTML = `
            <i class="fas ${visIcon} layer-visibility ${visClass}" onclick="toggleLayerVisibility(${layer.id})"></i>
            <div class="layer-info">
                <div class="layer-name">${layer.name}</div>
                <div class="layer-type">Z: ${layer.z} | ${layer.type}</div>
            </div>
            <div class="layer-controls">
                <button class="layer-btn" onclick="moveLayerUp(${layer.id})" title="Move Up">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button class="layer-btn" onclick="moveLayerDown(${layer.id})" title="Move Down">
                    <i class="fas fa-arrow-down"></i>
                </button>
                ${layer.type === 'custom' ? `
                    <button class="layer-btn delete" onclick="deleteLayer(${layer.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        list.appendChild(item);
    });
}

window.toggleLayerVisibility = function(id) {
    const layer = state.layers.find(l => l.id === id);
    if (layer) {
        layer.visible = !layer.visible;
        updateLayersList();
        render();
    }
};

window.moveLayerUp = function(id) {
    const layer = state.layers.find(l => l.id === id);
    if (layer) {
        layer.z++;
        sortLayers();
        updateLayersList();
        render();
    }
};

window.moveLayerDown = function(id) {
    const layer = state.layers.find(l => l.id === id);
    if (layer && layer.z > 0) {
        layer.z--;
        sortLayers();
        updateLayersList();
        render();
    }
};

window.deleteLayer = function(id) {
    state.layers = state.layers.filter(l => l.id !== id);
    updateLayersList();
    render();
};

// Render
function render() {
    state.ctx.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
    
    if (state.gridEnabled) {
        renderGrid();
    }
    
    const sorted = [...state.layers].sort((a, b) => a.z - b.z);
    
    sorted.forEach(layer => {
        if (!layer.visible) return;
        
        switch (layer.type) {
            case 'base':
                if (layer.data) {
                    state.ctx.drawImage(layer.data, layer.x, layer.y);
                }
                break;
            case 'banner':
                if (layer.data) {
                    if (layer.color) {
                        const colored = applyColorWithShading(layer.data, layer.color);
                        state.ctx.drawImage(colored, layer.x, layer.y);
                    } else {
                        state.ctx.drawImage(layer.data, layer.x, layer.y);
                    }
                }
                break;
            case 'text':
                renderText(layer);
                break;
            case 'custom':
                if (layer.data) {
                    state.ctx.drawImage(layer.data, layer.x, layer.y);
                }
                break;
        }
    });
}

function renderGrid() {
    state.ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
    state.ctx.lineWidth = 1;
    
    for (let x = 0; x < state.canvasWidth; x += 10) {
        state.ctx.beginPath();
        state.ctx.moveTo(x, 0);
        state.ctx.lineTo(x, state.canvasHeight);
        state.ctx.stroke();
    }
    
    for (let y = 0; y < state.canvasHeight; y += 10) {
        state.ctx.beginPath();
        state.ctx.moveTo(0, y);
        state.ctx.lineTo(state.canvasWidth, y);
        state.ctx.stroke();
    }
}

function renderText(layer) {
    const text = layer.text || '';
    const spacing = layer.spacing || 0;
    const color = layer.color || '#ffffff';
    
    if (!text || Object.keys(state.letters).length === 0) return;
    
    let currentX = layer.x;
    const y = layer.y;
    
    for (const char of text) {
        const letterKey = char.toLowerCase();
        const letterImg = state.letters[letterKey];
        
        if (letterImg) {
            const colored = applyColorWithShading(letterImg, color);
            state.ctx.drawImage(colored, currentX, y);
            currentX += letterImg.width + spacing;
        } else if (char === ' ') {
            currentX += 10 + spacing;
        }
    }
}

function applyColorWithShading(img, hexColor) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const targetColor = hexToRgb(hexColor);
    
    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) continue;
        
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255;
        
        data[i] = targetColor.r * brightness;
        data[i + 1] = targetColor.g * brightness;
        data[i + 2] = targetColor.b * brightness;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Project Management
function saveProject() {
    const project = {
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        layers: state.layers.map(l => ({
            id: l.id,
            name: l.name,
            type: l.type,
            visible: l.visible,
            x: l.x,
            y: l.y,
            z: l.z,
            color: l.color,
            text: l.text,
            spacing: l.spacing
        })),
        bannerColor: document.getElementById('bannerColor').value,
        textColor: document.getElementById('textColor').value,
        letterSpacing: parseInt(document.getElementById('letterSpacing').value),
        bannerText: document.getElementById('bannerText').value
    };
    
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banner-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function loadProject(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const project = JSON.parse(event.target.result);
            
            // Restore canvas size
            setCanvasSize(project.canvasWidth, project.canvasHeight);
            
            // Restore layer properties
            project.layers.forEach(saved => {
                const layer = state.layers.find(l => l.id === saved.id);
                if (layer) {
                    Object.assign(layer, saved);
                }
            });
            
            // Restore UI
            document.getElementById('bannerColor').value = project.bannerColor;
            document.getElementById('textColor').value = project.textColor;
            document.getElementById('letterSpacing').value = project.letterSpacing;
            document.getElementById('bannerText').value = project.bannerText;
            document.getElementById('bannerX').value = project.layers.find(l => l.type === 'banner')?.x || 0;
            document.getElementById('bannerY').value = project.layers.find(l => l.type === 'banner')?.y || 0;
            document.getElementById('bannerZ').value = project.layers.find(l => l.type === 'banner')?.z || 2;
            document.getElementById('textX').value = project.layers.find(l => l.type === 'text')?.x || 0;
            document.getElementById('textY').value = project.layers.find(l => l.type === 'text')?.y || 0;
            document.getElementById('textZ').value = project.layers.find(l => l.type === 'text')?.z || 3;
            
            updateLayersList();
            render();
        } catch (error) {
            alert('Error loading project: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Presets
function savePreset() {
    const name = prompt('Enter preset name:');
    if (!name) return;
    
    const preset = {
        id: Date.now(),
        name,
        date: new Date().toISOString(),
        bannerX: parseInt(document.getElementById('bannerX').value),
        bannerY: parseInt(document.getElementById('bannerY').value),
        bannerZ: parseInt(document.getElementById('bannerZ').value),
        textX: parseInt(document.getElementById('textX').value),
        textY: parseInt(document.getElementById('textY').value),
        textZ: parseInt(document.getElementById('textZ').value),
        letterSpacing: parseInt(document.getElementById('letterSpacing').value),
        bannerColor: document.getElementById('bannerColor').value,
        textColor: document.getElementById('textColor').value
    };
    
    state.presets.push(preset);
    localStorage.setItem('bannerPresets', JSON.stringify(state.presets));
    updatePresetsList();
}

function loadPresets() {
    const saved = localStorage.getItem('bannerPresets');
    if (saved) {
        state.presets = JSON.parse(saved);
        updatePresetsList();
    }
}

function updatePresetsList() {
    const list = document.getElementById('presetsList');
    list.innerHTML = '';
    
    state.presets.forEach(preset => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.onclick = () => applyPreset(preset.id);
        
        const date = new Date(preset.date).toLocaleDateString();
        
        item.innerHTML = `
            <div>
                <span>${preset.name}</span>
                <small>${date}</small>
            </div>
            <button class="preset-delete" onclick="event.stopPropagation(); deletePreset(${preset.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        list.appendChild(item);
    });
}

function applyPreset(id) {
    const preset = state.presets.find(p => p.id === id);
    if (!preset) return;
    
    document.getElementById('bannerX').value = preset.bannerX;
    document.getElementById('bannerY').value = preset.bannerY;
    document.getElementById('bannerZ').value = preset.bannerZ;
    document.getElementById('textX').value = preset.textX;
    document.getElementById('textY').value = preset.textY;
    document.getElementById('textZ').value = preset.textZ;
    document.getElementById('letterSpacing').value = preset.letterSpacing;
    document.getElementById('bannerColor').value = preset.bannerColor;
    document.getElementById('textColor').value = preset.textColor;
    
    updateBannerPosition();
    updateBannerZ();
    updateTextPosition();
    updateTextZ();
    updateLetterSpacing({ target: { value: preset.letterSpacing } });
    updateBannerColor({ target: { value: preset.bannerColor } });
    updateTextColor({ target: { value: preset.textColor } });
}

window.deletePreset = function(id) {
    state.presets = state.presets.filter(p => p.id !== id);
    localStorage.setItem('bannerPresets', JSON.stringify(state.presets));
    updatePresetsList();
};

// Export
function exportCanvas() {
    const link = document.createElement('a');
    link.download = `banner-${Date.now()}.png`;
    link.href = state.canvas.toDataURL('image/png');
    link.click();
}

// Update Canvas Info
function updateCanvasInfo() {
    document.getElementById('canvasSize').textContent = `${state.canvasWidth} × ${state.canvasHeight}`;
}
