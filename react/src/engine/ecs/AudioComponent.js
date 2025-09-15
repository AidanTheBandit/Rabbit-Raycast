/**
 * Audio Component
 *
 * Handles spatial audio, sound effects, and background music for entities.
 * Integrates with the audio system for 3D positional audio and effects.
 */

import { Component } from './ECS.js';

export class AudioComponent extends Component {
  constructor(options = {}) {
    super('AudioComponent');

    // Audio properties
    this.volume = options.volume || 1.0;
    this.pitch = options.pitch || 1.0;
    this.loop = options.loop || false;
    this.spatial = options.spatial !== false; // Enable 3D spatial audio
    this.minDistance = options.minDistance || 1.0;
    this.maxDistance = options.maxDistance || 100.0;
    this.rolloffFactor = options.rolloffFactor || 1.0;

    // Audio sources
    this.currentSound = null;
    this.soundQueue = [];
    this.playing = false;

    // Audio effects
    this.lowPassFilter = null;
    this.highPassFilter = null;
    this.reverb = null;
    this.delay = null;

    // Audio states
    this.muted = false;
    this.paused = false;
    this.fadeTime = 0;
    this.fadeDuration = 0;
    this.targetVolume = this.volume;

    // Cached values
    this.lastPosition = { x: 0, y: 0, z: 0 };
    this.listenerPosition = { x: 0, y: 0, z: 0 };
  }

  /**
   * Set audio source
   */
  setSound(soundName, engine) {
    if (engine && engine.audio && engine.audio.sounds.has(soundName)) {
      this.currentSound = soundName;
      return true;
    }
    console.warn(`Audio source '${soundName}' not found`);
    return false;
  }

  /**
   * Load and set audio from asset manager
   */
  async loadSound(assetKey, engine) {
    if (engine && engine.assetManager) {
      try {
        await engine.assetManager.loadAsset(assetKey, assetKey, 'audio');
        this.currentSound = assetKey;
        return true;
      } catch (error) {
        console.warn(`Failed to load audio ${assetKey}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Play current sound
   */
  play(options = {}) {
    if (!this.currentSound || !this.entity || !this.entity.scene || !this.entity.scene.engine) return false;

    const engine = this.entity.scene.engine;
    if (!engine.audio || !engine.audio.enabled) return false;

    const playOptions = {
      volume: (options.volume || this.volume) * (this.muted ? 0 : 1),
      loop: options.loop !== undefined ? options.loop : this.loop,
      playbackRate: options.pitch || this.pitch
    };

    const soundInstance = engine.audio.playSound(this.currentSound, playOptions);
    if (soundInstance) {
      this.playing = true;
      this.paused = false;
      return true;
    }

    return false;
  }

  /**
   * Stop current sound
   */
  stop() {
    if (this.playing && this.entity && this.entity.scene && this.entity.scene.engine) {
      const engine = this.entity.scene.engine;
      if (engine.audio && this.currentSound) {
        // Note: AudioSystem doesn't have a direct stop method for named sounds
        // This would need to be enhanced in the AudioSystem
        this.playing = false;
      }
    }
  }

  /**
   * Pause current sound
   */
  pause() {
    this.paused = true;
    this.playing = false;
  }

  /**
   * Resume paused sound
   */
  resume() {
    if (this.paused) {
      this.paused = false;
      this.playing = true;
    }
  }

  /**
   * Set volume
   */
  setVolume(volume, fadeDuration = 0) {
    volume = Math.max(0, Math.min(1, volume));

    if (fadeDuration > 0) {
      this.targetVolume = volume;
      this.fadeTime = 0;
      this.fadeDuration = fadeDuration;
    } else {
      this.volume = volume;
      this.updateSpatialAudio();
    }
  }

  /**
   * Set pitch
   */
  setPitch(pitch) {
    this.pitch = Math.max(0.1, Math.min(4.0, pitch));
    // Update playing sound if possible
    if (this.playing) {
      // This would require AudioSystem enhancement
    }
  }

  /**
   * Set loop mode
   */
  setLoop(loop) {
    this.loop = loop;
  }

  /**
   * Mute/unmute
   */
  setMuted(muted) {
    this.muted = muted;
    this.updateSpatialAudio();
  }

  /**
   * Set spatial audio properties
   */
  setSpatial(enabled) {
    this.spatial = enabled;
  }

  /**
   * Set audio range
   */
  setRange(minDistance, maxDistance) {
    this.minDistance = Math.max(0.1, minDistance);
    this.maxDistance = Math.max(this.minDistance, maxDistance);
  }

  /**
   * Set rolloff factor
   */
  setRolloffFactor(factor) {
    this.rolloffFactor = Math.max(0, factor);
  }

  /**
   * Play sound with spatial positioning
   */
  playSpatial(options = {}) {
    if (!this.spatial || !this.play(options)) return false;

    this.updateSpatialAudio();
    return true;
  }

  /**
   * Update spatial audio based on position
   */
  updateSpatialAudio() {
    if (!this.spatial || !this.playing || !this.entity || !this.entity.transform) return;

    const engine = this.entity.scene.engine;
    if (!engine.audio || !engine.audio.enabled) return;

    const entityPos = this.entity.getWorldPosition();
    const listenerPos = this.getListenerPosition();

    // Calculate distance and volume
    const dx = entityPos.x - listenerPos.x;
    const dy = entityPos.y - listenerPos.y;
    const dz = entityPos.z - listenerPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Calculate volume based on distance
    let spatialVolume = this.volume;
    if (distance > this.minDistance) {
      if (distance >= this.maxDistance) {
        spatialVolume = 0;
      } else {
        const normalizedDistance = (distance - this.minDistance) / (this.maxDistance - this.minDistance);
        spatialVolume *= Math.pow(1 - normalizedDistance, this.rolloffFactor);
      }
    }

    // Apply mute
    if (this.muted) {
      spatialVolume = 0;
    }

    // Update audio volume (this would require AudioSystem enhancement)
    // For now, we'll just cache the spatial volume
    this.spatialVolume = spatialVolume;
  }

  /**
   * Get listener position (usually player/camera position)
   */
  getListenerPosition() {
    // Try to get from scene camera or player
    if (this.entity && this.entity.scene) {
      const scene = this.entity.scene;

      // Check for camera entity
      const camera = scene.findEntityWithComponent('CameraComponent');
      if (camera && camera.transform) {
        return camera.getWorldPosition();
      }

      // Check for player entity
      const player = scene.findEntityWithComponent('PlayerComponent');
      if (player && player.transform) {
        return player.getWorldPosition();
      }
    }

    return { x: 0, y: 0, z: 0 };
  }

  /**
   * Add sound to queue
   */
  queueSound(soundName, delay = 0) {
    this.soundQueue.push({
      sound: soundName,
      delay: delay,
      played: false,
      startTime: Date.now()
    });
  }

  /**
   * Clear sound queue
   */
  clearQueue() {
    this.soundQueue = [];
  }

  /**
   * Play procedural sound
   */
  playProcedural(frequency, duration, type = 'sine', options = {}) {
    if (!this.entity || !this.entity.scene || !this.entity.scene.engine) return false;

    const engine = this.entity.scene.engine;
    if (!engine.audio || !engine.audio.enabled) return false;

    const volume = (options.volume || this.volume) * (this.muted ? 0 : 1);
    engine.audio.playProceduralSound(frequency, duration, type, volume);
    return true;
  }

  /**
   * Add audio effect
   */
  addEffect(type, options = {}) {
    switch (type) {
      case 'lowpass':
        this.lowPassFilter = {
          frequency: options.frequency || 1000,
          Q: options.Q || 1
        };
        break;
      case 'highpass':
        this.highPassFilter = {
          frequency: options.frequency || 200,
          Q: options.Q || 1
        };
        break;
      case 'reverb':
        this.reverb = {
          wet: options.wet || 0.3,
          decay: options.decay || 2.0
        };
        break;
      case 'delay':
        this.delay = {
          wet: options.wet || 0.3,
          delayTime: options.delayTime || 0.5,
          feedback: options.feedback || 0.3
        };
        break;
    }
  }

  /**
   * Remove audio effect
   */
  removeEffect(type) {
    switch (type) {
      case 'lowpass':
        this.lowPassFilter = null;
        break;
      case 'highpass':
        this.highPassFilter = null;
        break;
      case 'reverb':
        this.reverb = null;
        break;
      case 'delay':
        this.delay = null;
        break;
    }
  }

  /**
   * Fade in audio
   */
  fadeIn(duration = 1000) {
    this.setVolume(0, 0); // Start at 0
    this.targetVolume = this.volume;
    this.volume = 0;
    this.fadeTime = 0;
    this.fadeDuration = duration;
    this.playing = true;
  }

  /**
   * Fade out audio
   */
  fadeOut(duration = 1000) {
    this.targetVolume = 0;
    this.fadeTime = 0;
    this.fadeDuration = duration;
  }

  /**
   * Update component
   */
  update(deltaTime) {
    // Update fade
    if (this.fadeDuration > 0) {
      this.fadeTime += deltaTime;
      const t = Math.min(this.fadeTime / this.fadeDuration, 1.0);

      if (this.targetVolume > this.volume) {
        // Fading in
        this.volume = t * this.targetVolume;
      } else {
        // Fading out
        this.volume = (1 - t) * this.volume;
      }

      if (t >= 1.0) {
        this.volume = this.targetVolume;
        this.fadeDuration = 0;
        this.fadeTime = 0;

        if (this.targetVolume === 0) {
          this.stop();
        }
      }

      this.updateSpatialAudio();
    }

    // Update spatial audio if position changed
    if (this.spatial && this.playing && this.entity && this.entity.transform) {
      const currentPos = this.entity.getWorldPosition();
      const listenerPos = this.getListenerPosition();

      if (currentPos.x !== this.lastPosition.x ||
          currentPos.y !== this.lastPosition.y ||
          currentPos.z !== this.lastPosition.z ||
          listenerPos.x !== this.listenerPosition.x ||
          listenerPos.y !== this.listenerPosition.y ||
          listenerPos.z !== this.listenerPosition.z) {

        this.lastPosition = { ...currentPos };
        this.listenerPosition = { ...listenerPos };
        this.updateSpatialAudio();
      }
    }

    // Process sound queue
    const now = Date.now();
    for (let i = this.soundQueue.length - 1; i >= 0; i--) {
      const queuedSound = this.soundQueue[i];
      if (!queuedSound.played && now - queuedSound.startTime >= queuedSound.delay) {
        this.setSound(queuedSound.sound, this.entity.scene.engine);
        this.play();
        queuedSound.played = true;
        this.soundQueue.splice(i, 1);
      }
    }
  }

  /**
   * Get audio statistics
   */
  getStats() {
    return {
      playing: this.playing,
      paused: this.paused,
      muted: this.muted,
      volume: this.volume,
      pitch: this.pitch,
      loop: this.loop,
      spatial: this.spatial,
      currentSound: this.currentSound,
      queueLength: this.soundQueue.length,
      hasLowPass: !!this.lowPassFilter,
      hasHighPass: !!this.highPassFilter,
      hasReverb: !!this.reverb,
      hasDelay: !!this.delay,
      fading: this.fadeDuration > 0
    };
  }
}
