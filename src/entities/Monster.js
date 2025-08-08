// Monster entity for the Endless Survival game
class Monster {
  constructor(x, y, type = 'normal', difficulty = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 30;
    this.height = 30;
    
    // Set properties based on monster type and scale with difficulty
    switch (type) {
      case 'tanker':
        this.health = Math.floor(120 * difficulty); // Reduced from 150
        this.maxHealth = this.health;
        this.damage = Math.floor(12 * difficulty); // Reduced from 15
        this.speed = 1;
        this.color = '#e74c3c';
        this.imagePath = 'assets/monster/tank.png';
        break;
      case 'fast':
        this.health = Math.floor(40 * difficulty); // Reduced from 50
        this.maxHealth = this.health;
        this.damage = Math.floor(6 * difficulty); // Reduced from 8
        this.speed = 4;
        this.color = '#f39c12';
        this.imagePath = 'assets/monster/fast.png';
        break;
      case 'ranged':
        this.health = Math.floor(55 * difficulty); // Reduced from 70
        this.maxHealth = this.health;
        this.damage = Math.floor(9 * difficulty); // Reduced from 12
        this.speed = 2;
        this.color = '#9b59b6';
        this.range = 150;
        this.imagePath = 'assets/monster/ranged.png';
        break;
      case 'elite':
        this.health = Math.floor(240 * difficulty); // Reduced from 300
        this.maxHealth = this.health;
        this.damage = Math.floor(20 * difficulty); // Reduced from 25
        this.speed = 2;
        this.color = '#ff6600';
        this.imagePath = 'assets/monster/elite.png';
        break;
      case 'boss':
        this.health = Math.floor(800 * difficulty); // Reduced from 1000
        this.maxHealth = this.health;
        this.damage = Math.floor(40 * difficulty); // Reduced from 50
        this.speed = 2;
        this.color = '#800080';
        this.width = 60;
        this.height = 60;
        this.imagePath = 'assets/monster/boss.png';
        break;
      default: // normal
        this.health = Math.floor(80 * difficulty); // Reduced from 100
        this.maxHealth = this.health;
        this.damage = Math.floor(8 * difficulty); // Reduced from 10
        this.speed = 3;
        this.color = '#2ecc71';
        this.imagePath = 'assets/monster/normal.png'; // We'll need to create this or use a default
    }
    
    // Load monster image
    this.image = new Image();
    this.image.src = this.imagePath;
  }

  update(playerX, playerY) {
    // Different AI behaviors based on monster type
    switch (this.type) {
      case 'ranged':
        // Ranged monsters keep distance from player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.range) {
          // Move away from player
          if (distance > 0) {
            this.x -= (dx / distance) * this.speed;
            this.y -= (dy / distance) * this.speed;
          }
        } else {
          // Move toward player if too far
          if (distance > 0) {
            this.x += (dx / distance) * this.speed * 0.5;
            this.y += (dy / distance) * this.speed * 0.5;
          }
        }
        break;
        
      case 'fast':
        // Fast monsters move quickly toward player
        const fdx = playerX - this.x;
        const fdy = playerY - this.y;
        const fdistance = Math.sqrt(fdx * fdx + fdy * fdy);
        
        if (fdistance > 0) {
          this.x += (fdx / fdistance) * this.speed;
          this.y += (fdy / fdistance) * this.speed;
        }
        break;
        
      case 'elite':
        // Elite monsters have more complex behavior
        const edx = playerX - this.x;
        const edy = playerY - this.y;
        const edistance = Math.sqrt(edx * edx + edy * edy);
        
        if (edistance > 0) {
          // Move toward player
          this.x += (edx / edistance) * this.speed;
          this.y += (edy / edistance) * this.speed;
          
          // Occasionally move in a random direction
          if (Math.random() < 0.02) {
            this.x += (Math.random() - 0.5) * this.speed * 2;
            this.y += (Math.random() - 0.5) * this.speed * 2;
          }
        }
        break;
        
      case 'boss':
        // Boss monsters have special behavior
        const bdx = playerX - this.x;
        const bdy = playerY - this.y;
        const bdistance = Math.sqrt(bdx * bdx + bdy * bdy);
        
        if (bdistance > 0) {
          // Move toward player
          this.x += (bdx / bdistance) * this.speed;
          this.y += (bdy / bdistance) * this.speed;
          
          // Periodically charge at player
          if (Math.random() < 0.005) {
            this.x += (bdx / bdistance) * this.speed * 3;
            this.y += (bdy / bdistance) * this.speed * 3;
          }
        }
        break;
        
      default:
        // Simple AI: move toward player
        const sdx = playerX - this.x;
        const sdy = playerY - this.y;
        const sdistance = Math.sqrt(sdx * sdx + sdy * sdy);
        
        if (sdistance > 0) {
          this.x += (sdx / sdistance) * this.speed;
          this.y += (sdy / sdistance) * this.speed;
        }
    }
  }

  render(ctx) {
    // Render monster image if loaded, otherwise render colored rectangle
    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    // Render health bar
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.x, this.y - 8, this.width, 3);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(this.x, this.y - 8, (this.health / this.maxHealth) * this.width, 3);
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
  }
}

export default Monster;