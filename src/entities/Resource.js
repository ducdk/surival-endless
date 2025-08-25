// Resource entity for the Endless Survival game
import ImageCache from './ImageCache.js';

class Resource {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 20;
    this.height = 20;
    this.icon = null;
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
        this.icon = '❤️';
        break;
      case 'gold':
        this.color = '#f1c40f';
        this.value = 1; // Gold amount
        // Gold resources should not disappear
        this.lifeTime = 0; // No timeout
        this.icon = '💰';
        break;
      case 'experience':
        this.color = '#9b59b6';
        this.value = 10; // Experience points
        // Experience resources should not disappear
        this.lifeTime = 0; // No timeout
        this.icon = '⚡';
        break;
      case 'blood':
        this.color = '#ff0000';
        this.value = 5; // Blood amount
        // Blood resources should not disappear
        this.lifeTime = 0; // No timeout
        this.icon = '🩸';
        break;
      default:
        this.color = '#3498db';
        this.value = 0;
        // Default resources should still disappear after a period
        this.lifeTime = 10000; // 10 seconds
        this.icon = '⚡';
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

  render(ctx, screenX, screenY) {
    if (this.collected) return;
    
    // Check if we have a cached image for this resource type
    // Try to get image from global cache
    const image = ImageCache.getImage(`assets/resource/${this.type}.png`);
    
    // If image is loaded, draw it at screen coordinates
    if (image.complete && image.naturalWidth !== 0) {
      ctx.drawImage(image, screenX, screenY, this.width, this.height);
    } else {
      // Fallback to drawing shapes if images don't load
      ctx.fillStyle = this.color;
      ctx.beginPath();
      
      switch (this.type) {
        case 'health':
          // Heart shape for health (adjusted for screen coordinates)
          ctx.moveTo(screenX, screenY + this.height * 0.3);
          ctx.bezierCurveTo(
            screenX, screenY,
            screenX + this.width, screenY,
            screenX + this.width, screenY + this.height * 0.3
          );
          ctx.bezierCurveTo(
            screenX + this.width, screenY + this.height,
            screenX, screenY + this.height,
            screenX, screenY + this.height * 0.3
          );
          break;
        case 'gold':
          // Circle for gold
          ctx.arc(screenX + this.width/2, screenY + this.height/2, this.width/2, 0, Math.PI * 2);
          break;
        case 'experience':
          // Star shape for experience
          this.drawStar(ctx, screenX + this.width/2, screenY + this.height/2, 5, this.width/2, this.width/4);
          break;
        case 'blood':
          // Diamond shape for blood
          ctx.moveTo(screenX + this.width/2, screenY);
          ctx.lineTo(screenX + this.width, screenY + this.height/2);
          ctx.lineTo(screenX + this.width/2, screenY + this.height);
          ctx.lineTo(screenX, screenY + this.height/2);
          ctx.closePath();
          break;
        default:
          // Default square
          ctx.fillRect(screenX, screenY, this.width, this.height);
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