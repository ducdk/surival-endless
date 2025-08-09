import Skill from './Skill.js';
import Bullet from './Bullet.js';

// Character entity for the Endless Survival game
class Character {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.health = 500;
    this.maxHealth = 500;
    this.damage = 50;
    this.speed = 6;
    this.level = 1;
    this.experience = 0;
    this.experienceToNextLevel = 100;
    this.gold = 0;
    this.attackCooldown = 0;
    this.attackCooldownTime = 250; // milliseconds
    this.levelUpNotification = false;
    this.levelUpNotificationTime = 0;
    this.inventory = []; // Equipment inventory
    this.skills = []; // Skills array
    this.bullets = []; // Bullets array
    this.game = game; // Reference to the Game instance
    
    // Skill-related properties
    this.secondWindTimer = 0; // Timer for Second Wind passive healing
    this.secondWindInterval = 5000; // Heal every 5 seconds (5000ms)
    
    // Health Regeneration properties
    this.healthRegenTimer = 0; // Timer for Health Regeneration passive healing
    
    // Whirlwind skill properties
    this.whirlwindBalls = []; // Array to store ball positions
    this.whirlwindRotation = 0; // Current rotation angle
    this.whirlwindRadius = 90; // Initial radius of the whirlwind (matches level 1 with new formula)
    this.whirlwindBallCount = 10; // Number of balls
    
    // Load character image
    this.image = new Image();
    this.image.src = 'assets/character.png';
    
    // Initialize skills
    this.initializeSkills();
    
    // Initialize whirlwind balls
    this.initializeWhirlwindBalls();
  }
  
  initializeWhirlwindBalls() {
    // Initialize the positions of the whirlwind balls
    this.whirlwindBalls = [];
    for (let i = 0; i < this.whirlwindBallCount; i++) {
      const angle = (i / this.whirlwindBallCount) * Math.PI * 2;
      this.whirlwindBalls.push({
        x: Math.cos(angle) * this.whirlwindRadius,
        y: Math.sin(angle) * this.whirlwindRadius,
        angle: angle
      });
    }
  }
  
  update(deltaTime) {
    // Update character logic
    if (this.attackCooldown > 0) {
      // Ensure deltaTime is a valid number
      if (typeof deltaTime === 'number' && !isNaN(deltaTime)) {
        this.attackCooldown -= deltaTime;
        if (this.attackCooldown < 0) this.attackCooldown = 0;
      }
    }
    
    // Update Second Wind passive healing
    const secondWindSkill = this.getSkill('Second Wind');
    if (secondWindSkill && secondWindSkill.currentLevel > 0) {
      this.secondWindTimer += deltaTime;
      if (this.secondWindTimer >= this.secondWindInterval) {
        // Heal a small amount
        const healAmount = secondWindSkill.getEffectValue() / 10; // Heal 10% of the skill's value per interval
        this.heal(healAmount);
        this.secondWindTimer = 0; // Reset timer
      }
    }
    
    // Update Health Regeneration passive healing
    const healthRegenSkill = this.getSkill('Health Regeneration');
    if (healthRegenSkill && healthRegenSkill.currentLevel > 0) {
      this.healthRegenTimer += deltaTime;
      
      // Calculate healing interval based on skill level (8/7/6/5/4s)
      const healingIntervals = [0, 8000, 7000, 6000, 5000, 4000]; // Index 0 unused, levels 1-5
      const healingInterval = healingIntervals[healthRegenSkill.currentLevel];
      
      if (this.healthRegenTimer >= healingInterval) {
        // Heal a small amount
        const healAmount = healthRegenSkill.getEffectValue();
        this.heal(healAmount);
        this.healthRegenTimer = 0; // Reset timer
      }
    }
    
    // Update whirlwind rotation and radius
    const whirlwindSkill = this.getSkill('Whirlwind');
    if (whirlwindSkill && whirlwindSkill.currentLevel > 0) {
      // Rotation speed increases with skill level
      const rotationSpeed = 0.05 + (whirlwindSkill.currentLevel * 0.01);
      this.whirlwindRotation += rotationSpeed * (deltaTime / 16); // Normalize to 60fps
      
      // Radius increases with skill level (base 80, +10 per level)
      const radius = 80 + (whirlwindSkill.currentLevel * 10);
      
      // Update ball positions
      for (let i = 0; i < this.whirlwindBalls.length; i++) {
        const ball = this.whirlwindBalls[i];
        ball.angle += rotationSpeed * (deltaTime / 16);
        ball.x = Math.cos(ball.angle) * radius;
        ball.y = Math.sin(ball.angle) * radius;
      }
    }
    
    // Update skills
    this.updateSkills(deltaTime);
    
    // Update bullets
    this.updateBullets(deltaTime);
  }

  render(ctx) {
    // Render character image if loaded, otherwise render colored rectangle
    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = '#3498db';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    // Render whirlwind balls if skill is unlocked
    const whirlwindSkill = this.getSkill('Whirlwind');
    if (whirlwindSkill && whirlwindSkill.currentLevel > 0) {
      ctx.fillStyle = '#3498db';
      for (const ball of this.whirlwindBalls) {
        ctx.beginPath();
        ctx.arc(
          this.x + this.width / 2 + ball.x,
          this.y + this.height / 2 + ball.y,
          5, // ball radius
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    
    // Render health bar
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.x, this.y - 10, this.width, 5);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(this.x, this.y - 10, (this.health / this.maxHealth) * this.width, 5);
    
    // Render bullets
    this.renderBullets(ctx);
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
  }

  heal(amount) {
    // Store previous health to calculate actual healing
    const previousHealth = this.health;
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
    
    // Calculate actual healing amount
    const actualHealAmount = this.health - previousHealth;
    
    // Notify game of healing for visual effect and statistics if there was actual healing
    if (actualHealAmount > 0 && this.game) {
      // Update total health recovered statistic
      if (this.game.totalHealthRecovered !== undefined) {
        this.game.totalHealthRecovered += actualHealAmount;
      }
      
      // Add visual effect for healing
      this.game.addHealingEffect(
        this.x + this.width / 2,
        this.y - 20, // Position above the character
        actualHealAmount
      );
    }
  }

  addExperience(exp) {
    this.experience += exp;
    if (this.experience >= this.experienceToNextLevel) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
    
    // Check if Whirlwind skill is upgraded
    const whirlwindSkill = this.getSkill('Whirlwind');
    if (whirlwindSkill && whirlwindSkill.currentLevel > 0) {
      // Increase HP more when Whirlwind skill is upgraded
      this.maxHealth += 30; // Increased from 20 to 30
    } else {
      this.maxHealth += 20;
    }
    
    this.health = this.maxHealth;
    this.damage += 5;
    this.speed += 0.125; // Increase speed by 2 when leveling up
  }

  move(dx, dy) {
    // Move at normal speed
    let speed = this.speed;
    
    this.x += dx * speed;
    this.y += dy * speed;
  }
  
  canAttack() {
    return this.attackCooldown <= 0;
  }
  
  attack(targetX, targetY) {
    if (this.canAttack()) {
      // Calculate damage including Power Attack bonus
      let damage = this.damage;
      const powerAttackSkill = this.getSkill('Power Attack');
      if (powerAttackSkill && powerAttackSkill.currentLevel > 0 && powerAttackSkill.isReady()) {
        // Always apply Power Attack bonus for passive version
        damage += powerAttackSkill.getEffectValue();
        // Activate skill cooldown
        powerAttackSkill.activate();
      }
      
      // Create multiple bullets with spread
      // Get bullet count from Bullet Storm skill
      let bulletCount = 3; // Default bullet count
      const bulletStormSkill = this.getSkill('Bullet Storm');
      if (bulletStormSkill && bulletStormSkill.currentLevel > 0) {
        bulletCount = bulletStormSkill.getEffectValue();
      }
      const spreadAngle = 0.4; // Spread angle in radians
      
      // Calculate the angle to the target
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      const dx = targetX - centerX;
      const dy = targetY - centerY;
      const targetAngle = Math.atan2(dy, dx);
      
      // Create bullets with spread
      for (let i = 0; i < bulletCount; i++) {
        // Calculate spread angle for this bullet
        const angleOffset = (i - (bulletCount - 1) / 2) * spreadAngle;
        const bulletAngle = targetAngle + angleOffset;
        
        // Calculate target position with spread
        const spreadDistance = 500; // Distance to calculate spread target
        const spreadTargetX = centerX + Math.cos(bulletAngle) * spreadDistance;
        const spreadTargetY = centerY + Math.sin(bulletAngle) * spreadDistance;
        
        // Create a bullet
        const bullet = new Bullet(
          centerX,
          centerY,
          spreadTargetX,
          spreadTargetY,
          10, // speed
          damage,
          '#ffffff',
          true // isPlayerBullet
        );
        
        this.bullets.push(bullet);
      }
      
      this.attackCooldown = this.attackCooldownTime;
      console.log(`Character shoots ${bulletCount} bullets for ${damage} damage each`);
      return true;
    }
    return false;
  }
  
  // Update bullets
  updateBullets(deltaTime) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);
      
      // Remove bullets that have expired or gone off-screen
      if (!bullet.isAlive() ||
          bullet.x < -100 || bullet.x > this.game.width + 100 ||
          bullet.y < -100 || bullet.y > this.game.height + 100) {
        this.bullets.splice(i, 1);
      }
    }
  }
  
  // Render bullets
  renderBullets(ctx) {
    for (const bullet of this.bullets) {
      bullet.render(ctx);
    }
  }
  
  // Add equipment to inventory
  addEquipment(equipment) {
    this.inventory.push(equipment);
    this.applyEquipmentBonus(equipment);
  }
  
  // Apply equipment bonus to character stats
  applyEquipmentBonus(equipment) {
    switch (equipment.type) {
      case 'sword':
        this.damage += equipment.damage;
        break;
      case 'shield':
        // Defense could be used to reduce damage taken
        break;
      case 'boots':
        this.speed += equipment.speed;
        break;
      case 'amulet':
        this.maxHealth += equipment.health;
        this.health += equipment.health;
        break;
    }
  }
  
  // Get total equipment bonus for a specific stat
  getEquipmentBonus(stat) {
    let bonus = 0;
    for (const item of this.inventory) {
      switch (stat) {
        case 'damage':
          if (item.type === 'sword') bonus += item.damage;
          break;
        case 'speed':
          if (item.type === 'boots') bonus += item.speed;
          break;
        case 'health':
          if (item.type === 'amulet') bonus += item.health;
          break;
      }
    }
    return bonus;
  }
  
  // Initialize character skills
  initializeSkills() {
    // Combat Skills
    this.skills.push(new Skill('Critical Strike', 'passive', {
      type: 'chance',
      baseValue: 5,
      perLevel: 5,
      description: 'Chance to deal increased damage on attacks',
      cooldown: 5000 // 5 seconds
    }, 5, 3, 100));
    
    this.skills.push(new Skill('Whirlwind', 'passive', {
      type: 'damage',
      baseValue: 50,
      perLevel: 25,
      description: '6 balls orbit character dealing damage to nearby enemies',
      cooldown: 1000 // 1 second
    }, 5, 5, 150));
    
    this.skills.push(new Skill('Power Attack', 'passive', {
      type: 'damage',
      baseValue: 150,
      perLevel: 30,
      description: 'Always deal increased damage on attacks',
      cooldown: 10000 // 10 seconds
    }, 5, 7, 120));
    
    // Survival Skills
    this.skills.push(new Skill('Health Regeneration', 'passive', {
      type: 'heal',
      baseValue: 20,
      perLevel: 1,
      description: 'Regenerate health over time',
      cooldown: 1000 // 1 second
    }, 5, 4, 100));
    
    this.skills.push(new Skill('Second Wind', 'passive', {
      type: 'heal',
      baseValue: 30,
      perLevel: 5,
      description: 'Automatically heal a small amount every few seconds',
      cooldown: 10000 // 10 seconds
    }, 3, 8, 200));
    
    
    this.skills.push(new Skill('Evasion', 'passive', {
      type: 'chance',
      baseValue: 5,
      perLevel: 5,
      description: 'Chance to avoid incoming attacks',
      cooldown: 1000 // 1 second
    }, 5, 7, 150));
    // Utility Skills
    this.skills.push(new Skill('Gold Finder', 'passive', {
      type: 'chance',
      baseValue: 5,
      perLevel: 5,
      description: 'Increase gold dropped by enemies',
      cooldown: 1000 // 1 second
    }, 5, 4, 100));
    
    this.skills.push(new Skill('Experience Boost', 'passive', {
      type: 'chance',
      baseValue: 10,
      perLevel: 10,
      description: 'Increase experience gained from enemies',
      cooldown: 1000 // 1 second
    }, 5, 6, 120));
    
    this.skills.push(new Skill('Resource Magnet', 'passive', {
      type: 'range',
      baseValue: 20,
      perLevel: 20,
      description: 'Increase pickup range for resources',
      cooldown: 1000 // 1 second
    }, 3, 9, 180));
    
    // New Triple Eff skill
    this.skills.push(new Skill('Triple Eff', 'passive', {
      type: 'attack',
      baseValue: 1,
      perLevel: 0,
      description: 'Shoot 3 lines at 3 targets instead of 1 basic line',
      cooldown: 1000 // 1 second
    }, 1, 10, 200));
    
    // Bullet Storm skill
    this.skills.push(new Skill('Bullet Storm', 'passive', {
      type: 'bullet',
      baseValue: 3,
      perLevel: 1,
      description: 'Increase the number of bullets fired per attack',
      cooldown: 1000 // 1 second
    }, 5, 6, 150));
  }
  
  // Get available skills for current level
  getAvailableSkills() {
    return this.skills.filter(skill => skill.unlockLevel <= this.level);
  }
  
  // Get unlocked skills
  getUnlockedSkills() {
    return this.skills.filter(skill => skill.currentLevel > 0);
  }
  
  // Upgrade a skill
  upgradeSkill(skillName) {
    const skill = this.skills.find(s => s.name === skillName);
    if (skill && skill.canUpgrade() && this.gold >= skill.getUpgradeCost()) {
      this.gold -= skill.getUpgradeCost();
      skill.upgrade();
      return true;
    }
    return false;
  }
  
  // Update skill cooldowns
  updateSkills(deltaTime) {
    for (const skill of this.skills) {
      skill.update(deltaTime);
    }
  }
  
  // Activate a skill by name
  activateSkill(skillName) {
    const skill = this.skills.find(s => s.name === skillName);
    if (skill && skill.activate()) {
      console.log(`Activated skill: ${skillName}`);
      return skill;
    }
    return null;
  }
  
  // Get a skill by name
  getSkill(skillName) {
    return this.skills.find(s => s.name === skillName);
  }
}

export default Character;