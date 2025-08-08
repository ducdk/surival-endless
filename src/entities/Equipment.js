// Equipment entity for the Endless Survival game
class Equipment {
  constructor(type, level = 1) {
    this.type = type;
    this.level = level;
    
    // Equipment properties based on type
    switch (type) {
      case 'sword':
        this.name = 'Sword';
        this.baseDamage = 5;
        this.damage = this.baseDamage * level;
        this.cost = 50 * level;
        this.icon = '⚔️';
        break;
      case 'shield':
        this.name = 'Shield';
        this.baseDefense = 2;
        this.defense = this.baseDefense * level;
        this.cost = 40 * level;
        this.icon = '🛡️';
        break;
      case 'boots':
        this.name = 'Boots';
        this.baseSpeed = 1;
        this.speed = this.baseSpeed * level;
        this.cost = 30 * level;
        this.icon = '👢';
        break;
      case 'amulet':
        this.name = 'Amulet';
        this.baseHealth = 20;
        this.health = this.baseHealth * level;
        this.cost = 60 * level;
        this.icon = '📿';
        break;
      default:
        this.name = 'Basic Item';
        this.cost = 10;
        this.icon = '🔮';
    }
  }
  
  // Upgrade the equipment
  upgrade() {
    this.level++;
    
    // Recalculate properties based on new level
    switch (this.type) {
      case 'sword':
        this.damage = this.baseDamage * this.level;
        this.cost = 50 * this.level;
        break;
      case 'shield':
        this.defense = this.baseDefense * this.level;
        this.cost = 40 * this.level;
        break;
      case 'boots':
        this.speed = this.baseSpeed * this.level;
        this.cost = 30 * this.level;
        break;
      case 'amulet':
        this.health = this.baseHealth * this.level;
        this.cost = 60 * this.level;
        break;
    }
  }
  
  // Get upgrade cost
  getUpgradeCost() {
    // Upgrade cost is 75% of the next level's cost
    switch (this.type) {
      case 'sword':
        return Math.floor(50 * (this.level + 1) * 0.75);
      case 'shield':
        return Math.floor(40 * (this.level + 1) * 0.75);
      case 'boots':
        return Math.floor(30 * (this.level + 1) * 0.75);
      case 'amulet':
        return Math.floor(60 * (this.level + 1) * 0.75);
      default:
        return 10;
    }
  }
  
  // Get description of the equipment
  getDescription() {
    switch (this.type) {
      case 'sword':
        return `Damage: +${this.damage}`;
      case 'shield':
        return `Defense: +${this.defense}`;
      case 'boots':
        return `Speed: +${this.speed}`;
      case 'amulet':
        return `Health: +${this.health}`;
      default:
        return 'A mysterious item';
    }
  }
}

export default Equipment;