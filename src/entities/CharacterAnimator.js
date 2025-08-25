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
    this.animations = {};
    this.frameCount = 4; // Number of frames per direction, based on the actual files
    
    this.loadAnimations();
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
  
  update(timestamp) {
    if (!this.isMoving) return;
    
    // Update animation frame based on time
    if (timestamp - this.lastFrameTime > this.animationSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.lastFrameTime = timestamp;
    }
  }
  
  getCurrentFrame() {
    // If not moving, return idle frame
    if (!this.isMoving) {
      return this.imageCache.getImage('assets/character.png');
    }
    
    const direction = this.currentDirection;
    
    // Check if the animation for this direction exists
    if (!this.animations[direction] || this.animations[direction].length === 0) {
      console.warn(`No animation frames found for direction: ${direction}`);
      return this.imageCache.getImage('assets/character.png'); // Fallback
    }
    
    // Get the current frame for this direction
    const frames = this.animations[direction];
    const frameIndex = this.currentFrame % frames.length;
    const imagePath = frames[frameIndex];
    
    return this.imageCache.getImage(imagePath);
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
