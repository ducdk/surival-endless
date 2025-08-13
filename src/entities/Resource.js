// Resource entity for the Endless Survival game

// Image cache to prevent continuous requests for the same images
const imageCache = new Map();

class Resource {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 20;
    this.height = 20;
    this.collected = false;
    
    // Animation properties
    this.animationOffset = Math.random() * Math.PI * 2;
    this.animationSpeed = 0.05;
    this.baseY = y;
    this.floatAmplitude = 5;
    
    // Timeout properties
    this.creationTime = Date.now();
    
    // Set properties based on resource type
    switch (type) {
      case 'health':
        this.color = '#e74c3c';
        this.value = 25; // Health points
        // Health resources should still disappear after a period
        this.lifeTime = 10; // 10 seconds
        break;
      case 'gold':
        this.color = '#f1c40f';
        this.value = 1; // Gold amount
        // Gold resources should not disappear
        this.lifeTime = 0; // No timeout
        break;
      case 'experience':
        this.color = '#9b59b6';
        this.value = 10; // Experience points
        // Experience resources should not disappear
        this.lifeTime = 0; // No timeout
        break;
      case 'blood':
        this.color = '#ff0000';
        this.value = 5; // Blood amount
        // Blood resources should not disappear
        this.lifeTime = 0; // No timeout
        break;
      default:
        this.color = '#3498db';
        this.value = 0;
        // Default resources should still disappear after a period
        this.lifeTime = 10000; // 10 seconds
    }
  }

  update() {
    // Keep resource at its base Y position (no shaking effect)
    this.y = this.baseY;
    
    // Check if resource has expired (only for resources with a lifetime)
    if (this.lifeTime > 0 && Date.now() - this.creationTime > this.lifeTime) {
      this.collected = true;
    }
  }

  render(ctx) {
    if (this.collected) return;
    
    // Check if we have a cached image for this resource type
    if (imageCache.has(this.type)) {
      const cachedImage = imageCache.get(this.type);
      // If image was successfully loaded, draw it
      if (cachedImage && cachedImage.complete && cachedImage.naturalWidth !== 0) {
        ctx.drawImage(cachedImage, this.x, this.y, this.width, this.height);
        return;
      }
      // If image failed to load, remove it from cache
      imageCache.delete(this.type);
    }
    
    // Try to load and draw image
    const image = new Image();
    image.src = `assets/resource/${this.type}.png`;
    
    // When image loads successfully, cache it and draw it
    image.onload = () => {
      imageCache.set(this.type, image);
    };
    
    // When image fails to load, cache the failure
    image.onerror = () => {
      imageCache.set(this.type, null);
    };
    
    // If image is already loaded (from cache), draw it immediately
    if (image.complete && image.naturalWidth !== 0) {
      ctx.drawImage(image, this.x, this.y, this.width, this.height);
      imageCache.set(this.type, image);
    } else {
      // Fallback to drawing shapes if images don't load
      ctx.fillStyle = this.color;
      ctx.beginPath();
      
      switch (this.type) {
        case 'health':
          // Heart shape for health
          ctx.moveTo(this.x, this.y + this.height * 0.3);
          ctx.bezierCurveTo(
            this.x, this.y,
            this.x + this.width, this.y,
            this.x + this.width, this.y + this.height * 0.3
          );
          ctx.bezierCurveTo(
            this.x + this.width, this.y + this.height,
            this.x, this.y + this.height,
            this.x, this.y + this.height * 0.3
          );
          break;
        case 'gold':
          // Circle for gold
          ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
          break;
        case 'experience':
          // Star shape for experience
          this.drawStar(ctx, this.x + this.width/2, this.y + this.height/2, 5, this.width/2, this.width/4);
          break;
        case 'blood':
          // Diamond shape for blood
          ctx.moveTo(this.x + this.width/2, this.y);
          ctx.lineTo(this.x + this.width, this.y + this.height/2);
          ctx.lineTo(this.x + this.width/2, this.y + this.height);
          ctx.lineTo(this.x, this.y + this.height/2);
          ctx.closePath();
          break;
        default:
          // Default square
          ctx.fillRect(this.x, this.y, this.width, this.height);
      }
      
      ctx.fill();
    }
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
  }

  collect() {
    this.collected = true;
    return { type: this.type, value: this.value };
  }
}

export default Resource;