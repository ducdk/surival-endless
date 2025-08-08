// Skill entity for the Endless Survival game
class Skill {
  constructor(name, type, effect, levels, unlockLevel, costPerLevel) {
    this.name = name;
    this.type = type; // 'passive' or 'active'
    this.effect = effect;
    this.levels = levels;
    this.currentLevel = 0;
    this.unlockLevel = unlockLevel;
    this.costPerLevel = costPerLevel;
    this.cooldown = 0; // For active skills
    this.maxCooldown = effect.cooldown || 0; // For active skills
  }

  // Upgrade the skill
  upgrade() {
    if (this.currentLevel < this.levels) {
      this.currentLevel++;
      return true;
    }
    return false;
  }

  // Get the cost to upgrade to the next level
  getUpgradeCost() {
    return this.costPerLevel * this.currentLevel;
  }

  // Check if the skill can be upgraded
  canUpgrade() {
    return this.currentLevel < this.levels;
  }

  // Check if an active skill is ready to use
  isReady() {
    return this.type === 'active' && this.cooldown <= 0 && this.currentLevel > 0;
  }

  // Activate an active skill
  activate() {
    if (this.isReady()) {
      this.cooldown = this.maxCooldown;
      return true;
    }
    return false;
  }

  // Update skill cooldowns
  update(deltaTime) {
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
      if (this.cooldown < 0) this.cooldown = 0;
    }
  }

  // Get the effect value based on current level
  getEffectValue() {
    if (this.currentLevel === 0) return 0;
    
    // Calculate effect value based on level
    switch (this.effect.type) {
      case 'damage':
        return this.effect.baseValue + (this.effect.perLevel * (this.currentLevel - 1));
      case 'heal':
        return this.effect.baseValue + (this.effect.perLevel * (this.currentLevel - 1));
      case 'chance':
        return this.effect.baseValue + (this.effect.perLevel * (this.currentLevel - 1));
      default:
        return this.effect.baseValue;
    }
  }

  // Get a description of the skill
  getDescription() {
    let description = this.effect.description;
    
    if (this.currentLevel > 0) {
      description += ` (Level ${this.currentLevel})`;
    }
    
    return description;
  }
}

export default Skill;