# Audio System

Comprehensive guide to Rabbit-Raycast's spatial audio and sound management system.

## 🔊 Audio Basics

### Audio Manager Setup

```javascript
import { AudioManager } from '../core/AudioSystem.js';

class Game {
  constructor() {
    this.audioManager = new AudioManager();

    // Set master volume
    this.audioManager.setMasterVolume(0.8);

    // Set category volumes
    this.audioManager.setMusicVolume(0.6);
    this.audioManager.setSFXVolume(1.0);
  }

  async init() {
    // Load audio assets
    await this.loadAudioAssets();
  }

  async loadAudioAssets() {
    const audioAssets = [
      { key: 'bgm_menu', url: '/audio/menu.mp3', type: 'audio' },
      { key: 'bgm_level1', url: '/audio/level1.mp3', type: 'audio' },
      { key: 'sfx_jump', url: '/audio/jump.wav', type: 'audio' },
      { key: 'sfx_coin', url: '/audio/coin.wav', type: 'audio' },
      { key: 'sfx_enemy_death', url: '/audio/enemy_death.wav', type: 'audio' }
    ];

    await this.assetManager.loadAssets(audioAssets);
  }
}
```

### Basic Audio Playback

```javascript
// Play sound effect
this.audioManager.playSound('sfx_jump', {
  volume: 0.8,
  loop: false
});

// Play background music
this.audioManager.playMusic('bgm_level1', {
  volume: 0.5,
  loop: true,
  fadeIn: 2000
});

// Stop music with fade out
this.audioManager.stopMusic(1000);
```

## 🎵 Spatial Audio

### 3D Audio Positioning

```javascript
class SpatialAudioComponent extends Component {
  constructor(audioKey, options = {}) {
    super('SpatialAudioComponent');
    this.audioKey = audioKey;
    this.options = {
      volume: 1.0,
      minDistance: 10,
      maxDistance: 100,
      rolloffFactor: 1.0,
      ...options
    };

    this.source = null;
    this.gainNode = null;
    this.pannerNode = null;
  }

  onAttach(entity) {
    this.setupSpatialAudio();
  }

  setupSpatialAudio() {
    const audioContext = this.entity.scene.engine.audio.audioContext;
    const buffer = this.entity.scene.engine.assetManager.getAsset(this.audioKey);

    if (!buffer) return;

    // Create audio nodes
    this.source = audioContext.createBufferSource();
    this.gainNode = audioContext.createGain();
    this.pannerNode = audioContext.createPanner();

    // Configure panner for 3D spatialization
    this.pannerNode.panningModel = 'HRTF';
    this.pannerNode.distanceModel = 'inverse';
    this.pannerNode.refDistance = this.options.minDistance;
    this.pannerNode.maxDistance = this.options.maxDistance;
    this.pannerNode.rolloffFactor = this.options.rolloffFactor;

    // Connect nodes
    this.source.buffer = buffer;
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.pannerNode);
    this.pannerNode.connect(audioContext.destination);

    // Set initial volume
    this.gainNode.gain.value = this.options.volume;
  }

  play() {
    if (this.source && this.entity.scene) {
      this.updatePosition();
      this.source.start(0);
    }
  }

  stop() {
    if (this.source) {
      this.source.stop();
    }
  }

  update(deltaTime) {
    if (this.pannerNode && this.entity.transform) {
      this.updatePosition();
    }
  }

  updatePosition() {
    const position = this.entity.transform.position;
    const camera = this.entity.scene.engine.camera;

    // Convert to listener-relative coordinates
    const relativeX = position.x - camera.x;
    const relativeY = position.y - camera.y;
    const relativeZ = position.z || 0;

    // Update panner position
    this.pannerNode.setPosition(relativeX, relativeY, relativeZ);
  }

  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  setPosition(x, y, z = 0) {
    if (this.pannerNode) {
      this.pannerNode.setPosition(x, y, z);
    }
  }
}
```

### Audio Listener

```javascript
class AudioListener {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.listener = audioContext.listener;
    this.position = { x: 0, y: 0, z: 0 };
    this.orientation = { x: 0, y: 0, z: -1 }; // Forward direction
    this.up = { x: 0, y: 1, z: 0 }; // Up direction
  }

  setPosition(x, y, z = 0) {
    this.position = { x, y, z };
    this.listener.setPosition(x, y, z);
  }

  setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ) {
    this.orientation = { x: forwardX, y: forwardY, z: forwardZ };
    this.up = { x: upX, y: upY, z: upZ };

    this.listener.setOrientation(
      forwardX, forwardY, forwardZ,
      upX, upY, upZ
    );
  }

  updateFromCamera(camera) {
    // Update listener position to match camera
    this.setPosition(camera.x, camera.y, camera.z || 0);

    // Update listener orientation based on camera rotation
    const forward = camera.getForward();
    const up = camera.getUp();

    this.setOrientation(
      forward.x, forward.y, forward.z,
      up.x, up.y, up.z
    );
  }
}
```

## 🎚️ Audio Effects and Processing

### Audio Effects Chain

```javascript
class AudioEffectsProcessor {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.effects = [];
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.wet = audioContext.createGain();
    this.dry = audioContext.createGain();

    // Connect dry path
    this.input.connect(this.dry);
    this.dry.connect(this.output);

    // Connect wet path (will be connected to effects)
    this.input.connect(this.wet);
  }

  addEffect(effectType, options = {}) {
    const effect = this.createEffect(effectType, options);
    this.effects.push(effect);

    // Connect effect to chain
    if (this.effects.length === 1) {
      // First effect
      this.wet.connect(effect.input);
    } else {
      // Connect to previous effect
      this.effects[this.effects.length - 2].output.connect(effect.input);
    }

    // Connect last effect to output
    effect.output.connect(this.output);

    return effect;
  }

  createEffect(type, options) {
    switch (type) {
      case 'reverb':
        return new ReverbEffect(this.audioContext, options);
      case 'delay':
        return new DelayEffect(this.audioContext, options);
      case 'distortion':
        return new DistortionEffect(this.audioContext, options);
      case 'filter':
        return new FilterEffect(this.audioContext, options);
      case 'compressor':
        return new CompressorEffect(this.audioContext, options);
      default:
        throw new Error(`Unknown effect type: ${type}`);
    }
  }

  setWetDryMix(wetAmount) {
    this.dry.gain.value = 1 - wetAmount;
    this.wet.gain.value = wetAmount;
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }
}
```

### Reverb Effect

```javascript
class ReverbEffect {
  constructor(audioContext, options = {}) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();

    // Create convolver for reverb
    this.convolver = audioContext.createConvolver();

    // Create reverb impulse response
    this.createImpulseResponse(options);

    // Create wet/dry mix
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();

    // Connect nodes
    this.input.connect(this.dryGain);
    this.input.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);

    // Set mix
    this.setMix(options.mix || 0.3);
  }

  createImpulseResponse(options) {
    const length = options.length || 2; // seconds
    const decay = options.decay || 2;
    const sampleRate = this.audioContext.sampleRate;
    const numSamples = length * sampleRate;

    const impulse = this.audioContext.createBuffer(2, numSamples, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);

      for (let i = 0; i < numSamples; i++) {
        const n = numSamples - i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / numSamples, decay);
      }
    }

    this.convolver.buffer = impulse;
  }

  setMix(mix) {
    this.dryGain.gain.value = 1 - mix;
    this.wetGain.gain.value = mix;
  }
}
```

### Dynamic Audio

```javascript
class DynamicAudioSystem {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.layers = new Map();
    this.parameters = new Map();
  }

  createLayer(name, sounds) {
    this.layers.set(name, {
      sounds: sounds,
      currentSound: null,
      volume: 1.0,
      crossfadeTime: 1000
    });
  }

  setParameter(name, value) {
    this.parameters.set(name, value);
    this.updateAudio();
  }

  updateAudio() {
    // Update all layers based on current parameters
    for (const [layerName, layer] of this.layers) {
      this.updateLayer(layerName);
    }
  }

  updateLayer(layerName) {
    const layer = this.layers.get(layerName);
    const intensity = this.calculateIntensity(layerName);

    if (intensity > 0) {
      this.playLayerSound(layer, intensity);
    } else {
      this.stopLayerSound(layer);
    }
  }

  calculateIntensity(layerName) {
    // Calculate audio intensity based on game state
    const parameters = this.parameters;

    switch (layerName) {
      case 'ambient':
        return Math.min(parameters.get('timeOfDay') || 1, 1);

      case 'combat':
        return Math.min(parameters.get('enemyCount') || 0, 1);

      case 'tension':
        return Math.min(parameters.get('playerHealth') || 1, 1);

      default:
        return 0;
    }
  }

  playLayerSound(layer, intensity) {
    const targetSound = this.selectSoundForIntensity(layer, intensity);

    if (layer.currentSound !== targetSound) {
      // Crossfade to new sound
      this.crossfadeToSound(layer, targetSound, intensity);
    } else {
      // Update volume
      this.setLayerVolume(layer, intensity);
    }
  }

  selectSoundForIntensity(layer, intensity) {
    // Select appropriate sound based on intensity
    const soundIndex = Math.floor(intensity * layer.sounds.length);
    return layer.sounds[Math.min(soundIndex, layer.sounds.length - 1)];
  }

  crossfadeToSound(layer, newSound, intensity) {
    const oldSound = layer.currentSound;

    // Start new sound
    this.audioManager.playSound(newSound, {
      volume: 0,
      loop: true
    });

    // Fade in new sound
    this.audioManager.fadeIn(newSound, layer.crossfadeTime);

    // Fade out old sound if exists
    if (oldSound) {
      this.audioManager.fadeOut(oldSound, layer.crossfadeTime);
    }

    layer.currentSound = newSound;
  }

  setLayerVolume(layer, intensity) {
    if (layer.currentSound) {
      this.audioManager.setSoundVolume(layer.currentSound, intensity * layer.volume);
    }
  }

  stopLayerSound(layer) {
    if (layer.currentSound) {
      this.audioManager.fadeOut(layer.currentSound, layer.crossfadeTime);
      layer.currentSound = null;
    }
  }
}

// Usage
const dynamicAudio = new DynamicAudioSystem(audioManager);

// Create dynamic layers
dynamicAudio.createLayer('ambient', ['ambient_day', 'ambient_night']);
dynamicAudio.createLayer('combat', ['combat_low', 'combat_medium', 'combat_high']);
dynamicAudio.createLayer('tension', ['tension_low', 'tension_high']);

// Update based on game state
dynamicAudio.setParameter('timeOfDay', 0.7); // Evening
dynamicAudio.setParameter('enemyCount', 0.3); // Some enemies nearby
dynamicAudio.setParameter('playerHealth', 0.8); // Healthy
```

## 🎼 Procedural Audio

### Synthesized Sounds

```javascript
class ProceduralAudioGenerator {
  constructor(audioContext) {
    this.audioContext = audioContext;
  }

  generateTone(frequency, duration, type = 'sine', options = {}) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    // Envelope
    const attack = options.attack || 0.01;
    const decay = options.decay || 0.1;
    const sustain = options.sustain || 0.3;
    const release = options.release || 0.2;

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);

    return { oscillator, gainNode };
  }

  generateNoise(duration, options = {}) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (options.amplitude || 1);
    }

    // Apply filter if specified
    if (options.filter) {
      this.applyFilter(buffer, options.filter);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start();
    return source;
  }

  generateDrumHit(options = {}) {
    const duration = options.duration || 0.1;
    const frequency = options.frequency || 200;

    // Create oscillator for main hit
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + duration);

    gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);

    return oscillator;
  }

  generateExplosion(options = {}) {
    const duration = options.duration || 0.5;
    const numLayers = options.layers || 3;

    for (let i = 0; i < numLayers; i++) {
      const frequency = 100 + Math.random() * 200;
      const delay = Math.random() * 0.1;

      setTimeout(() => {
        this.generateTone(frequency, duration * (0.5 + Math.random()), 'sawtooth', {
          attack: 0.001,
          decay: 0.05,
          sustain: 0.1,
          release: duration
        });
      }, delay * 1000);
    }
  }
}
```

### Audio Analysis

```javascript
class AudioAnalyzer {
  constructor(audioContext, source) {
    this.audioContext = audioContext;
    this.analyzer = audioContext.createAnalyser();
    this.analyzer.fftSize = 256;

    this.bufferLength = this.analyzer.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    source.connect(this.analyzer);
  }

  getFrequencyData() {
    this.analyzer.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getTimeData() {
    this.analyzer.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }

  getRMS() {
    const timeData = this.getTimeData();
    let sum = 0;

    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      sum += sample * sample;
    }

    return Math.sqrt(sum / timeData.length);
  }

  getPeakFrequency() {
    const freqData = this.getFrequencyData();
    let maxIndex = 0;
    let maxValue = 0;

    for (let i = 0; i < freqData.length; i++) {
      if (freqData[i] > maxValue) {
        maxValue = freqData[i];
        maxIndex = i;
      }
    }

    // Convert index to frequency
    return (maxIndex * this.audioContext.sampleRate) / (2 * freqData.length);
  }

  getSpectralCentroid() {
    const freqData = this.getFrequencyData();
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < freqData.length; i++) {
      const frequency = (i * this.audioContext.sampleRate) / (2 * freqData.length);
      const magnitude = freqData[i];

      numerator += frequency * magnitude;
      denominator += magnitude;
    }

    return denominator > 0 ? numerator / denominator : 0;
  }
}
```

## 🎮 Audio Integration

### Audio Component

```javascript
class AudioComponent extends Component {
  constructor(options = {}) {
    super('AudioComponent');
    this.options = {
      volume: 1.0,
      spatial: false,
      loop: false,
      ...options
    };

    this.audioSource = null;
    this.spatialAudio = null;
  }

  onAttach(entity) {
    if (this.options.spatial) {
      this.spatialAudio = new SpatialAudioComponent(
        this.options.audioKey,
        this.options
      );
      this.entity.addComponent(this.spatialAudio);
    }
  }

  play(audioKey, options = {}) {
    if (this.spatialAudio) {
      this.spatialAudio.audioKey = audioKey;
      this.spatialAudio.play();
    } else {
      this.entity.scene.engine.audio.playSound(audioKey, {
        ...this.options,
        ...options
      });
    }
  }

  stop() {
    if (this.spatialAudio) {
      this.spatialAudio.stop();
    } else {
      // Stop non-spatial audio
      this.entity.scene.engine.audio.stopSound(this.currentSound);
    }
  }

  setVolume(volume) {
    this.options.volume = volume;
    if (this.spatialAudio) {
      this.spatialAudio.setVolume(volume);
    }
  }

  update(deltaTime) {
    // Update spatial audio position
    if (this.spatialAudio) {
      this.spatialAudio.update(deltaTime);
    }
  }
}
```

### Audio Events

```javascript
class AudioEventSystem {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.eventSounds = new Map();
  }

  registerEventSound(eventName, soundKey, options = {}) {
    this.eventSounds.set(eventName, { soundKey, options });
  }

  triggerEvent(eventName, context = {}) {
    const eventSound = this.eventSounds.get(eventName);
    if (!eventSound) return;

    const { soundKey, options } = eventSound;

    // Apply context-based modifications
    const finalOptions = { ...options };

    if (context.volume !== undefined) {
      finalOptions.volume = options.volume * context.volume;
    }

    if (context.pitch !== undefined) {
      finalOptions.pitch = options.pitch * context.pitch;
    }

    this.audioManager.playSound(soundKey, finalOptions);
  }

  setupGameEvents(game) {
    // Player events
    this.registerEventSound('player_jump', 'sfx_jump', { volume: 0.6 });
    this.registerEventSound('player_land', 'sfx_land', { volume: 0.4 });
    this.registerEventSound('player_damage', 'sfx_damage', { volume: 0.8 });
    this.registerEventSound('player_death', 'sfx_death', { volume: 1.0 });

    // Enemy events
    this.registerEventSound('enemy_attack', 'sfx_enemy_attack', { volume: 0.5 });
    this.registerEventSound('enemy_death', 'sfx_enemy_death', { volume: 0.7 });

    // Item events
    this.registerEventSound('item_collect', 'sfx_coin', { volume: 0.8 });
    this.registerEventSound('powerup_collect', 'sfx_powerup', { volume: 1.0 });

    // Connect to game events
    game.on('playerJump', () => this.triggerEvent('player_jump'));
    game.on('playerDamage', (damage) => this.triggerEvent('player_damage', { volume: damage / 100 }));
    game.on('enemyDeath', () => this.triggerEvent('enemy_death'));
    game.on('itemCollected', (item) => this.triggerEvent('item_collect', { pitch: item.value / 10 }));
  }
}
```

This audio system provides comprehensive sound management with spatial audio, effects processing, procedural generation, and dynamic audio that responds to game state.
