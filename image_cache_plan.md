# Image Cache Implementation Plan

## Problem Analysis
The game is making excessive HTTP requests for images, causing performance issues and lag. This happens because:
1. Each entity instance creates its own Image() object
2. No global caching mechanism exists for images
3. The same images are loaded multiple times (e.g., each monster instance loads its own image)

## Solution Overview
Create a global image cache system using a singleton pattern that:
1. Loads each image only once
2. Reuses cached images across all entity instances
3. Handles both successful loading and error cases
4. Provides a simple interface for entities to get images

## Implementation Steps

### 1. Create ImageCache.js
- Implement a singleton ImageCache class
- Use a Map to store cached images
- Provide methods to get images with caching
- Handle loading states and errors

### 2. Modify Entity Files
- Update Resource.js to use global cache
- Update Monster.js to use global cache
- Update Bullet.js to use global cache
- Update Character.js to use global cache

### 3. Integration
- Import ImageCache in all entity files
- Replace direct Image() creation with cache calls
- Maintain backward compatibility with fallback rendering

## ImageCache.js Implementation Details

```javascript
class ImageCache {
  constructor() {
    if (ImageCache.instance) {
      return ImageCache.instance;
    }
    
    this.cache = new Map();
    ImageCache.instance = this;
  }
  
  getImage(src) {
    // Return cached image if it exists
    if (this.cache.has(src)) {
      return this.cache.get(src);
    }
    
    // Create new image and cache it
    const image = new Image();
    image.src = src;
    
    // Cache the image immediately (before it loads)
    this.cache.set(src, image);
    
    return image;
  }
  
  // Clear the cache (useful for cleanup)
  clear() {
    this.cache.clear();
  }
  
  // Get cache statistics
  getStats() {
    return {
      cachedImages: this.cache.size
    };
  }
}

// Export singleton instance
export default new ImageCache();
```

## Entity Modifications

### Resource.js
Replace the local imageCache with global ImageCache:
- Remove local `const imageCache = new Map();`
- Import global ImageCache
- Replace image loading logic with `ImageCache.getImage()`

### Monster.js
Replace direct Image creation with global cache:
- Import global ImageCache
- Replace `this.image = new Image(); this.image.src = this.imagePath;` with `this.image = ImageCache.getImage(this.imagePath);`

### Bullet.js
Replace direct Image creation with global cache:
- Import global ImageCache
- Replace `this.image = new Image(); this.image.src = 'assets/effects/attack/bulltet.png';` with `this.image = ImageCache.getImage('assets/effects/attack/bulltet.png');`

### Character.js
Replace direct Image creation with global cache:
- Import global ImageCache
- Replace `this.image = new Image(); this.image.src = 'assets/character.png';` with `this.image = ImageCache.getImage('assets/character.png');`

## Benefits
1. Each image file is loaded only once
2. Reduced HTTP requests and bandwidth usage
3. Improved rendering performance
4. Better memory usage through reuse
5. Maintains existing rendering fallbacks