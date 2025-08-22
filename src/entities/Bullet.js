// Bullet entity for the Endless Survival game
import ImageCache from './ImageCache.js';

class Bullet {
  constructor(startX, startY, targetX, targetY, speed = 10, damage = 10, color = '#ffffff', isPlayerBullet = true) {
    this.x = startX;
    this.y = startY;
    this.width = 16;
    this.height = 16;
    
    // Calculate direction vector
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize and set velocity
    this.velocityX = (dx / distance) * speed;
    this.velocityY = (dy / distance) * speed;
    
    // Calculate rotation angle based on velocity
    this.angle = Math.atan2(this.velocityY, this.velocityX);
    
    this.speed = speed;
    this.damage = damage;
    this.color = color;
    this.isPlayerBullet = isPlayerBullet; // True if fired by player, false if fired by monster
    this.life = 1000; // milliseconds before bullet disappears
    this.maxLife = 1000;
    
    // Load bullet image from global cache
    this.image = ImageCache.getImage('assets/effects/attack/bullet.png');
  }
  
  update(deltaTime) {
    // Move bullet
    this.x += this.velocityX * (deltaTime / 16); // Normalize to 60fps
    this.y += this.velocityY * (deltaTime / 16);
    
    // Decrease life
    this.life -= deltaTime;
  }
  
  render(ctx) {
    // Render bullet image with rotation
    if (this.image && this.image.complete) {
      ctx.save();
      // Translate to the center of the bullet
      ctx.translate(this.x, this.y);
      // Rotate the context
      ctx.rotate(this.angle);
      // Draw the image centered on the bullet position
      ctx.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
      ctx.restore();
    } else {
      // Fallback to circle if image is not loaded
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Check if bullet is still alive
  isAlive() {
    return this.life > 0;
  }
  
  // Get bullet's center position
  getCenter() {
    return {
      x: this.x,
      y: this.y
    };
  }
}

export default Bullet;