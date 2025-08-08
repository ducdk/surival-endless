class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.sfxVolume = 1.0;
    this.musicVolume = 0.7;
    this.muted = false;
  }
  
  // Load a sound effect
  loadSound(name, path) {
    const audio = new Audio(path);
    audio.volume = this.sfxVolume;
    this.sounds[name] = audio;
  }
  
  // Load background music
  loadMusic(path) {
    this.music = new Audio(path);
    this.music.volume = this.musicVolume;
    this.music.loop = true;
  }
  
  // Play a sound effect
  playSound(name) {
    if (this.muted || !this.sounds[name]) return;
    
    // Clone the audio to allow overlapping sounds
    const sound = this.sounds[name].cloneNode();
    sound.volume = this.sfxVolume;
    sound.play();
  }
  
  // Play background music
  playMusic() {
    if (this.muted || !this.music) return;
    
    this.music.play();
  }
  
  // Stop background music
  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }
  
  // Set sound effects volume
  setSFXVolume(volume) {
    this.sfxVolume = volume;
    for (const sound in this.sounds) {
      this.sounds[sound].volume = volume;
    }
  }
  
  // Set music volume
  setMusicVolume(volume) {
    this.musicVolume = volume;
    if (this.music) {
      this.music.volume = volume;
    }
  }
  
  // Toggle mute
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    } else {
      this.playMusic();
    }
  }
}

export default SoundManager;