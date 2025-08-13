// ImageCache.js - Global image cache to prevent excessive HTTP requests
class ImageCache {
  constructor() {
    // Singleton pattern - return existing instance if it exists
    if (ImageCache.instance) {
      return ImageCache.instance;
    }
    
    // Initialize cache
    this.cache = new Map();
    this.loading = new Map(); // Track loading promises
    
    // Set this instance as the singleton instance
    ImageCache.instance = this;
  }
  
  /**
   * Get an image from cache or load it if not cached
   * @param {string} src - Image source URL
   * @returns {HTMLImageElement} Image element
   */
  getImage(src) {
    // Return cached image if it exists and is loaded
    if (this.cache.has(src)) {
      return this.cache.get(src);
    }
    
    // If image is currently loading, return the existing image object
    if (this.loading.has(src)) {
      return this.loading.get(src);
    }
    
    // Create new image and start loading
    const image = new Image();
    
    // Store the loading image to prevent duplicate requests
    this.loading.set(src, image);
    
    // Set the source to start loading
    image.src = src;
    
    // When image loads successfully, move it to cache and remove from loading
    image.onload = () => {
      this.cache.set(src, image);
      this.loading.delete(src);
    };
    
    // When image fails to load, remove from loading (don't cache failures)
    image.onerror = () => {
      this.loading.delete(src);
    };
    
    return image;
  }
  
  /**
   * Preload an image without returning it immediately
   * @param {string} src - Image source URL
   * @returns {Promise} Promise that resolves when image is loaded
   */
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      // If already cached, resolve immediately
      if (this.cache.has(src)) {
        resolve(this.cache.get(src));
        return;
      }
      
      // If already loading, resolve when loading completes
      if (this.loading.has(src)) {
        const existingImage = this.loading.get(src);
        existingImage.onload = () => {
          this.cache.set(src, existingImage);
          this.loading.delete(src);
          resolve(existingImage);
        };
        existingImage.onerror = () => {
          this.loading.delete(src);
          reject(new Error(`Failed to load image: ${src}`));
        };
        return;
      }
      
      // Create new image and start loading
      const image = new Image();
      this.loading.set(src, image);
      
      image.onload = () => {
        this.cache.set(src, image);
        this.loading.delete(src);
        resolve(image);
      };
      
      image.onerror = () => {
        this.loading.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      image.src = src;
    });
  }
  
  /**
   * Clear the cache
   */
  clear() {
    this.cache.clear();
    this.loading.clear();
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      cachedImages: this.cache.size,
      loadingImages: this.loading.size
    };
  }
  
  /**
   * Check if an image is cached
   * @param {string} src - Image source URL
   * @returns {boolean} True if image is cached
   */
  isCached(src) {
    return this.cache.has(src);
  }
}

// Export singleton instance
const imageCache = new ImageCache();
export default imageCache;