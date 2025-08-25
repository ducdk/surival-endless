// CharacterAnimator.js - Manages and renders character animations
import ImageCache from './ImageCache.js';

class CharacterAnimator {
  constructor() {
    this.imageCache = ImageCache; // Use the singleton instance
    this.directions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
    this.currentDirection = 'south'; // Default direction
    this.currentFrame = 0;
    this.animationSpeed = 100; // milliseconds per frame
    this.lastFrameTime = 0;
    this.isMoving = false;
    this.isFiring = false; // Add state for firing animation
    this.animations = {};
    this.fireballAnimations = {}; // Add fireball animations object
    this.frameCount = 4; // Number of frames per direction for walking
    this.fireballFrameCount = 6; // Number of frames per direction for fireball
    
    this.loadAnimations();
    this.loadFireballAnimations(); // Load fireball animations
  }
  
  loadAnimations() {
    // For each direction, load all frames into the animations object
    this.directions.forEach(direction => {
      this.animations[direction] = [];
      
      // Ensure we're using the correct directory name format
      // The folder structure uses dashes, so we need to keep the original format
      const dirName = direction; // Already in correct format with dashes
      
      // Load all frames for this direction
      for (let i = 0; i < this.frameCount; i++) {
        const frameName = `frame_${i.toString().padStart(3, '0')}`;
        const imagePath = `assets/animations/walking/${dirName}/${frameName}.png`;
        
        // Use the existing image cache instead of loading directly
        this.animations[direction].push(imagePath);
        
        // Preload the image into cache
        this.imageCache.preloadImage(imagePath);
      }
    });
    
    // Add idle animation (just using the static character image)
    this.animations['idle'] = ['assets/character.png'];
    this.imageCache.preloadImage('assets/character.png');
  }
  
  // New method to load fireball animations
  loadFireballAnimations() {
    // For each direction, load all fireball frames
    this.directions.forEach(direction => {
      this.fireballAnimations[direction] = [];
      
      // The folder structure uses dashes, so we need to keep the original format
      const dirName = direction; // Already in correct format with dashes
      
      // Load all frames for this direction
      for (let i = 0; i < this.fireballFrameCount; i++) {
        const frameName = `frame_${i.toString().padStart(3, '0')}`;
        const imagePath = `assets/animations/fireball/${dirName}/${frameName}.png`;
        
        // Use the existing image cache instead of loading directly
        this.fireballAnimations[direction].push(imagePath);
        
        // Preload the image into cache
        this.imageCache.preloadImage(imagePath);
      }
    });
  }
  
  setDirection(direction) {
    // Make sure we're using the correct direction name
    if (this.directions.includes(direction)) {
      this.currentDirection = direction;
    } else {
      // Handle cases where direction names might differ
      const dirMap = {
        'northeast': 'north-east',
        'southeast': 'south-east',
        'southwest': 'south-west',
        'northwest': 'north-west'
      };
      
      if (dirMap[direction]) {
        this.currentDirection = dirMap[direction];
      } else {
        console.warn(`Invalid direction: ${direction}, defaulting to south`);
        this.currentDirection = 'south'; // Default to south if invalid
      }
    }
  }
  
  setMoving(isMoving) {
    this.isMoving = isMoving;
    if (!isMoving) {
      // Reset to first frame when stopping
      this.currentFrame = 0;
    }
  }
  
  // New method to set firing state
  setFiring(isFiring) {
    this.isFiring = isFiring;
    if (isFiring) {
      // Reset to first frame when starting to fire
      this.currentFrame = 0;
    }
  }
  
  update(timestamp) {
    // Only update animation if moving or firing
    if (!this.isMoving && !this.isFiring) return;
    
    // Get the appropriate frame count based on animation type
    const frameCount = this.isFiring ? this.fireballFrameCount : this.frameCount;
    
    // Update animation frame based on time
    if (timestamp - this.lastFrameTime > this.animationSpeed) {
      this.currentFrame = (this.currentFrame + 1) % frameCount;
      this.lastFrameTime = timestamp;
      
      // If firing and we've completed the animation, stop firing
      if (this.isFiring && this.currentFrame === 0) {
        this.isFiring = false;
      }
    }
  }
  
  getCurrentFrame() {
    // Determine which animation set to use
    if (this.isFiring) {
      // Use fireball animation
      const frames = this.fireballAnimations[this.currentDirection];
      if (!frames || frames.length === 0) {
        console.warn(`No fireball animation frames found for direction: ${this.currentDirection}`);
        return this.imageCache.getImage('assets/character.png'); // Fallback
      }
      
      const frameIndex = this.currentFrame % this.fireballFrameCount;
      return this.imageCache.getImage(frames[frameIndex]);
    } else if (!this.isMoving) {
      // If not moving, return idle frame
      return this.imageCache.getImage('assets/character.png');
    } else {
      // Use walking animation
      const frames = this.animations[this.currentDirection];
      if (!frames || frames.length === 0) {
        console.warn(`No walking animation frames found for direction: ${this.currentDirection}`);
        return this.imageCache.getImage('assets/character.png'); // Fallback
      }
      
      const frameIndex = this.currentFrame % this.frameCount;
      return this.imageCache.getImage(frames[frameIndex]);
    }
  }
  
  render(context, x, y, width, height) {
    const image = this.getCurrentFrame();
    if (image) {
      context.drawImage(image, x, y, width, height);
    } else {
      // Fallback if image is not loaded
      context.fillStyle = '#3498db';
      context.fillRect(x, y, width, height);
    }
  }
}

export default CharacterAnimator;
