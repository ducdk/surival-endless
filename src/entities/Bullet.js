// Bullet entity for the Endless Survival game
class Bullet {
  constructor(startX, startY, targetX, targetY, speed = 10, damage = 10, color = '#ffffff', isPlayerBullet = true) {
    this.x = startX;
    this.y = startY;
    this.width = 6;
    this.height = 6;
    
    // Calculate direction vector
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize and set velocity
    this.velocityX = (dx / distance) * speed;
    this.velocityY = (dy / distance) * speed;
    
    this.speed = speed;
    this.damage = damage;
    this.color = color;
    this.isPlayerBullet = isPlayerBullet; // True if fired by player, false if fired by monster
    this.life = 1000; // milliseconds before bullet disappears
    this.maxLife = 1000;
  }
  
  update(deltaTime) {
    // Move bullet
    this.x += this.velocityX * (deltaTime / 16); // Normalize to 60fps
    this.y += this.velocityY * (deltaTime / 16);
    
    // Decrease life
    this.life -= deltaTime;
  }
  
  render(ctx) {
    // Render bullet as a circle
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
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