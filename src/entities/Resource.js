// Resource entity for the Endless Survival game
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
    this.lifeTime = 10000; // 10 seconds
    this.creationTime = Date.now();
    
    // Set properties based on resource type
    switch (type) {
      case 'health':
        this.color = '#e74c3c';
        this.value = 25; // Health points
        break;
      case 'gold':
        this.color = '#f1c40f';
        this.value = 1; // Gold amount
        break;
      case 'experience':
        this.color = '#9b59b6';
        this.value = 10; // Experience points
        break;
      default:
        this.color = '#3498db';
        this.value = 0;
    }
  }

  update() {
    // Float animation
    const time = Date.now() * this.animationSpeed;
    this.y = this.baseY + Math.sin(time + this.animationOffset) * this.floatAmplitude;
    
    // Check if resource has expired
    if (Date.now() - this.creationTime > this.lifeTime) {
      this.collected = true;
    }
  }

  render(ctx) {
    if (this.collected) return;
    
    // Render resource on canvas
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
      default:
        // Default square
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    ctx.fill();
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