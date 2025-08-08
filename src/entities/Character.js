import Skill from './Skill.js';

// Character entity for the Endless Survival game
class Character {
  constructor(x, y) {
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
    
    // Skill-related properties
    this.powerAttackBonus = 0; // Bonus damage for Power Attack skill
    this.dashSpeed = 0; // Dash speed multiplier
    this.dashDuration = 0; // Remaining dash duration
    
    // Whirlwind skill properties
    this.whirlwindBalls = []; // Array to store ball positions
    this.whirlwindRotation = 0; // Current rotation angle
    this.whirlwindRadius = 40; // Radius of the whirlwind
    this.whirlwindBallCount = 6; // Number of balls
    
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
    
    // Update dash duration
    if (this.dashDuration > 0) {
      this.dashDuration -= deltaTime;
      if (this.dashDuration < 0) this.dashDuration = 0;
    }
    
    // Update whirlwind rotation and radius
    const whirlwindSkill = this.getSkill('Whirlwind');
    if (whirlwindSkill && whirlwindSkill.currentLevel > 0) {
      // Rotation speed increases with skill level
      const rotationSpeed = 0.05 + (whirlwindSkill.currentLevel * 0.01);
      this.whirlwindRotation += rotationSpeed * (deltaTime / 16); // Normalize to 60fps
      
      // Radius increases with skill level (base 40, +5 per level)
      const radius = 40 + (whirlwindSkill.currentLevel * 5);
      
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
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
  }

  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
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
    // Apply dash speed if dashing
    let speed = this.speed;
    if (this.dashDuration > 0) {
      speed *= this.dashSpeed;
    }
    
    this.x += dx * speed;
    this.y += dy * speed;
  }
  
  canAttack() {
    return this.attackCooldown <= 0;
  }
  
  attack(monster) {
    if (this.canAttack()) {
      // Calculate damage including Power Attack bonus
      let damage = this.damage;
      if (this.powerAttackBonus > 0) {
        damage += this.powerAttackBonus;
        this.powerAttackBonus = 0; // Reset bonus after use
      }
      
      monster.takeDamage(damage);
      this.attackCooldown = this.attackCooldownTime;
      console.log(`Character attacks monster for ${damage} damage`);
      return true;
    }
    return false;
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
      description: 'Chance to deal increased damage on attacks'
    }, 5, 3, 100));
    
    this.skills.push(new Skill('Whirlwind', 'passive', {
      type: 'damage',
      baseValue: 50,
      perLevel: 25,
      description: '6 balls orbit character dealing damage to nearby enemies'
    }, 5, 5, 150));
    
    this.skills.push(new Skill('Power Attack', 'active', {
      type: 'damage',
      baseValue: 150,
      perLevel: 30,
      description: 'Next attack deals increased damage',
      cooldown: 10000 // 10 seconds
    }, 5, 7, 120));
    
    // Survival Skills
    this.skills.push(new Skill('Health Regeneration', 'passive', {
      type: 'heal',
      baseValue: 1,
      perLevel: 1,
      description: 'Regenerate health over time'
    }, 5, 4, 100));
    
    this.skills.push(new Skill('Damage Reduction', 'passive', {
      type: 'chance',
      baseValue: 2,
      perLevel: 2,
      description: 'Reduce incoming damage'
    }, 5, 6, 150));
    
    this.skills.push(new Skill('Second Wind', 'active', {
      type: 'heal',
      baseValue: 30,
      perLevel: 5,
      description: 'Instantly heal when health drops below 20%',
      cooldown: 60000 // 60 seconds
    }, 3, 8, 200));
    
    // Movement Skills
    this.skills.push(new Skill('Dash', 'active', {
      type: 'movement',
      baseValue: 2,
      perLevel: 1,
      description: 'Quickly move in a direction',
      cooldown: 8000 // 8 seconds
    }, 3, 5, 120));
    
    this.skills.push(new Skill('Evasion', 'passive', {
      type: 'chance',
      baseValue: 5,
      perLevel: 5,
      description: 'Chance to avoid incoming attacks'
    }, 5, 7, 150));
    
    // Utility Skills
    this.skills.push(new Skill('Gold Finder', 'passive', {
      type: 'chance',
      baseValue: 5,
      perLevel: 5,
      description: 'Increase gold dropped by enemies'
    }, 5, 4, 100));
    
    this.skills.push(new Skill('Experience Boost', 'passive', {
      type: 'chance',
      baseValue: 10,
      perLevel: 10,
      description: 'Increase experience gained from enemies'
    }, 5, 6, 120));
    
    this.skills.push(new Skill('Resource Magnet', 'passive', {
      type: 'range',
      baseValue: 20,
      perLevel: 20,
      description: 'Increase pickup range for resources'
    }, 3, 9, 180));
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