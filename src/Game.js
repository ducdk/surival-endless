import Character from './entities/Character.js';
import Monster from './entities/Monster.js';
import Resource from './entities/Resource.js';
import Equipment from './entities/Equipment.js';
import SoundManager from './SoundManager.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    // Set canvas size to match window size
    this.resizeCanvas();
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Game state
    this.state = 'welcome'; // 'welcome', 'playing', 'gameOver', 'shop'
    this.score = 0;
    this.gameTime = 0;
    
    // Log information board statistics
    this.monstersDestroyed = 0;
    this.totalDamageCaused = 0;
    this.damageReceived = 0;
    this.totalHealthRecovered = 0;
    this.combatLog = []; // Array to store recent combat events
    
    // Entities
    this.character = new Character(this.width / 2, this.height / 2, this);
    this.monsters = [];
    this.resources = [];
    this.attackEffects = [];
    this.deathEffects = [];
    this.collectionEffects = [];
    this.levelUpEffects = [];
    this.healingEffects = []; // For Health Regeneration display
    
    // Input handling
    this.keys = {};
    
    // Monster spawning
    this.spawnTimer = 0;
    this.spawnInterval = 1000; // milliseconds
    
    // Initialize game
    this.setupEventListeners();
    this.levelUpChoice = null; // 'health', 'damage', or 'speed'
    
    // Initialize sound manager
    this.soundManager = new SoundManager();
    
    // Load user data from localStorage
    this.loadUserData();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }
  
  setupEventListeners() {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      
      // Handle welcome screen
      if (this.state === 'welcome') {
        // Handle shop key
        if (e.key === 'p' || e.key === 'P') {
          this.state = 'shop';
        }
        return;
      }
      
      // Handle level up choices
      if (this.character.levelUpNotification) {
        switch(e.key) {
          case '1':
            this.levelUpChoice = 'health';
            break;
          case '2':
            this.levelUpChoice = 'damage';
            break;
          case '3':
            this.levelUpChoice = 'speed';
            break;
        }
        
        if (this.levelUpChoice) {
          this.applyLevelUpChoice();
        }
      }
      
      // Handle save/load
      if (e.key === 'F5') {
        this.saveGame();
      } else if (e.key === 'F9') {
        this.loadGame();
      }
      
      // Handle restart
      if ((e.key === 'r' || e.key === 'R') && this.state === 'gameOver') {
        this.restart();
      }
      
      // Handle shop
      if (e.key === 'p' || e.key === 'P') {
        if (this.state === 'playing' || this.state === 'welcome') {
          this.state = 'shop';
        } else if (this.state === 'shop') {
          // Return to the previous state
          if (this.character.health <= 0) {
            this.state = 'gameOver';
          } else if (this.character.health > 0) {
            this.state = 'playing';
          } else {
            this.state = 'welcome';
          }
        }
      } else if (this.state === 'shop') {
        // Handle shop purchases
        if (e.key === 'Escape') {
          // Return to the previous state
          if (this.character.health <= 0) {
            this.state = 'gameOver';
          } else if (this.character.health > 0) {
            this.state = 'playing';
          } else {
            this.state = 'welcome';
          }
        } else if (e.key >= '1' && e.key <= '4') {
          this.purchaseEquipment(parseInt(e.key) - 1);
        } else if (e.key >= '5' && e.key <= '9') {
          this.purchaseSkill(parseInt(e.key) - 5);
        }
      } else if (this.state === 'playing') {
        // Handle skill activation (keys Q, E, R, F)
        switch(e.key) {
          case 'q':
          case 'Q':
            this.activateCharacterSkill('Whirlwind');
            break;
        }
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
    
    // Add event listeners for welcome screen buttons
    const startButton = document.getElementById('startButton');
    if (startButton) {
      startButton.addEventListener('click', () => {
        this.startGame();
      });
    }
    
    const shopButton = document.getElementById('shopButton');
    if (shopButton) {
      shopButton.addEventListener('click', () => {
        this.state = 'shop';
      });
    }
      
      // Mouse input for shop
      this.canvas.addEventListener('click', (e) => {
        if (this.state === 'shop') {
          this.handleShopClick(e);
        }
      });
    }
    
    // Convert mouse event coordinates to canvas coordinates
    getCanvasCoordinates(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      return { x, y };
    }
    
    // Handle shop clicks
    handleShopClick(e) {
      const { x, y } = this.getCanvasCoordinates(e);
      
      // Check equipment items
      const equipmentClicked = this.checkEquipmentClick(x, y);
      if (equipmentClicked !== -1) {
        this.purchaseEquipment(equipmentClicked);
        return;
      }
      
      // Check skill items
      const skillClicked = this.checkSkillClick(x, y);
      if (skillClicked !== -1) {
        this.purchaseSkill(skillClicked);
        return;
      }
    }
    
    // Check if an equipment item was clicked
    checkEquipmentClick(x, y) {
      const equipmentTypes = ['sword', 'shield', 'boots', 'amulet'];
      const itemWidth = 150;
      const itemHeight = 100;
      const itemSpacing = 20;
      const startX = (this.width - (equipmentTypes.length * itemWidth + (equipmentTypes.length - 1) * itemSpacing)) / 2;
      const startY = 180;
      
      for (let i = 0; i < equipmentTypes.length; i++) {
        const itemX = startX + i * (itemWidth + itemSpacing);
        const itemY = startY;
        
        // Check if click is within item bounds
        if (x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + itemHeight) {
          return i;
        }
      }
      
      return -1; // No equipment item clicked
    }
    
    // Check if a skill item was clicked
    checkSkillClick(x, y) {
      const availableSkills = this.character.getAvailableSkills();
      const skillWidth = 200;
      const skillHeight = 80;
      const skillSpacing = 15;
      const skillStartX = (this.width - (Math.min(3, availableSkills.length) * skillWidth + (Math.min(3, availableSkills.length) - 1) * skillSpacing)) / 2;
      const skillStartY = 180 + 100 + 50; // Equipment items height + spacing
      
      for (let i = 0; i < availableSkills.length; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const skillX = skillStartX + col * (skillWidth + skillSpacing);
        const skillY = skillStartY + row * (skillHeight + skillSpacing);
        
        // Check if click is within skill bounds
        if (x >= skillX && x <= skillX + skillWidth && y >= skillY && y <= skillY + skillHeight) {
          return i;
        }
      }
      
      return -1; // No skill item clicked
    }
  
  applyLevelUpChoice() {
    switch(this.levelUpChoice) {
      case 'health':
        this.character.maxHealth += 30;
        this.character.health = this.character.maxHealth; // Heal to full
        break;
      case 'damage':
        this.character.damage += 8;
        break;
      case 'speed':
        this.character.speed += 1;
        break;
    }
    
    // Add level up effect
    this.addLevelUpEffect(this.character.x + this.character.width/2, this.character.y + this.character.height/2);
    
    // Play level up sound
    this.soundManager.playSound('levelUp');
    
    // Reset level up notification
    this.character.levelUpNotification = false;
    this.levelUpChoice = null;
  }
  
  update(deltaTime) {
    if (this.state !== 'playing' && this.state !== 'shop') return;

    // Only update game time and game entities when actually playing (not in shop from menu)
    if (this.state === 'playing') {
      this.gameTime += deltaTime;
      
      // Update character
      this.updateCharacter(deltaTime);
      
      // Update monsters
      this.updateMonsters(deltaTime);
      
      // Update resources
      this.updateResources();
      
      // Spawn monsters
      this.spawnMonsters(deltaTime);
      
      // Check collisions
      this.checkCollisions();
      
      // Check game over
      if (this.character.health <= 0) {
        this.state = 'gameOver';
        // Play game over sound
        this.soundManager.playSound('gameOver');
        
        // Save user data
        this.saveUserData();
        
        // Automatically return to welcome screen after 5 seconds
        setTimeout(() => {
          if (this.state === 'gameOver') {
            this.state = 'welcome';
          }
        }, 5000);
      }
    }
    
    // Always update effects (they should continue running even in shop)
    this.updateAttackEffects(deltaTime);
    this.updateDeathEffects(deltaTime);
    this.updateCollectionEffects(deltaTime);
    this.updateLevelUpEffects(deltaTime);
    this.updateHealingEffects(deltaTime);
  }
  
  updateCharacter(deltaTime) {
    // Handle movement
    let dx = 0;
    let dy = 0;
    
    if (this.keys['ArrowUp'] || this.keys['w']) dy -= 1;
    if (this.keys['ArrowDown'] || this.keys['s']) dy += 1;
    if (this.keys['ArrowLeft'] || this.keys['a']) dx -= 1;
    if (this.keys['ArrowRight'] || this.keys['d']) dx += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071; // 1/sqrt(2)
      dy *= 0.7071;
    }
    
    this.character.move(dx, dy);
    
    // Keep character within bounds
    this.character.x = Math.max(0, Math.min(this.width - this.character.width, this.character.x));
    this.character.y = Math.max(0, Math.min(this.height - this.character.height, this.character.y));
    
    // Update character
    this.character.update(deltaTime);
  }
  
  updateMonsters(deltaTime) {
    // Limit the number of monsters for performance
    const maxMonsters = 100;
    if (this.monsters.length > maxMonsters) {
      // Remove excess monsters (oldest ones)
      this.monsters.splice(0, this.monsters.length - maxMonsters);
    }
    
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      monster.update(this.character.x + this.character.width/2, this.character.y + this.character.height/2, deltaTime);
      
      
      // Remove dead monsters
      if (monster.health <= 0) {
        // Add death effect
        this.addDeathEffect(monster.x + monster.width/2, monster.y + monster.height/2, monster.color);
        this.monsters.splice(i, 1);
        this.spawnResources(monster.x, monster.y, monster.type);
        this.score += 10;
        this.character.addExperience(10);
        
        // Update log statistics
        this.monstersDestroyed++;
        
        // Play death sound
        this.soundManager.playSound('monsterDeath');
      }
    }
  }
  
  updateResources() {
    // Limit the number of resources for performance
    const maxResources = 50;
    if (this.resources.length > maxResources) {
      // Remove excess resources (oldest ones)
      this.resources.splice(0, this.resources.length - maxResources);
    }
    
    for (let i = this.resources.length - 1; i >= 0; i--) {
      const resource = this.resources[i];
      resource.update();
      
      // Remove collected resources
      if (resource.collected) {
        this.resources.splice(i, 1);
      }
    }
  }
  
  updateAttackEffects(deltaTime) {
    // Limit the number of attack effects for performance
    const maxEffects = 30;
    if (this.attackEffects.length > maxEffects) {
      // Remove excess effects (oldest ones)
      this.attackEffects.splice(0, this.attackEffects.length - maxEffects);
    }
    
    for (let i = this.attackEffects.length - 1; i >= 0; i--) {
      const effect = this.attackEffects[i];
      effect.life -= deltaTime;
      
      // Update size for circle effects
      if (effect.expansionRate !== undefined) {
        effect.size += effect.expansionRate * deltaTime;
      }
      
      if (effect.life <= 0) {
        this.attackEffects.splice(i, 1);
      }
    }
  }
  
  updateDeathEffects(deltaTime) {
    // Limit the number of death effects for performance
    const maxEffects = 20;
    if (this.deathEffects.length > maxEffects) {
      // Remove excess effects (oldest ones)
      this.deathEffects.splice(0, this.deathEffects.length - maxEffects);
    }
    
    for (let i = this.deathEffects.length - 1; i >= 0; i--) {
      const effect = this.deathEffects[i];
      effect.life -= deltaTime;
      effect.size += effect.expansionRate * deltaTime;
      
      if (effect.life <= 0) {
        this.deathEffects.splice(i, 1);
      }
    }
  }
  
  updateCollectionEffects(deltaTime) {
    // Limit the number of collection effects for performance
    const maxEffects = 20;
    if (this.collectionEffects.length > maxEffects) {
      // Remove excess effects (oldest ones)
      this.collectionEffects.splice(0, this.collectionEffects.length - maxEffects);
    }
    
    for (let i = this.collectionEffects.length - 1; i >= 0; i--) {
      const effect = this.collectionEffects[i];
      effect.life -= deltaTime;
      effect.size += effect.expansionRate * deltaTime;
      effect.alpha = effect.life / effect.maxLife;
      
      if (effect.life <= 0) {
        this.collectionEffects.splice(i, 1);
      }
    }
  }
  
  updateLevelUpEffects(deltaTime) {
    // Limit the number of level up effects for performance
    const maxEffects = 10;
    if (this.levelUpEffects.length > maxEffects) {
      // Remove excess effects (oldest ones)
      this.levelUpEffects.splice(0, this.levelUpEffects.length - maxEffects);
    }
    
    for (let i = this.levelUpEffects.length - 1; i >= 0; i--) {
      const effect = this.levelUpEffects[i];
      effect.life -= deltaTime;
      effect.size += effect.expansionRate * deltaTime;
      effect.alpha = effect.life / effect.maxLife;
      
      if (effect.life <= 0) {
        this.levelUpEffects.splice(i, 1);
      }
    }
  }
  
  updateHealingEffects(deltaTime) {
    // Limit the number of healing effects for performance
    const maxEffects = 10;
    if (this.healingEffects.length > maxEffects) {
      // Remove excess effects (oldest ones)
      this.healingEffects.splice(0, this.healingEffects.length - maxEffects);
    }
    
    for (let i = this.healingEffects.length - 1; i >= 0; i--) {
      const effect = this.healingEffects[i];
      effect.life -= deltaTime;
      effect.y -= 0.5; // Move upward
      effect.alpha = effect.life / effect.maxLife;
      
      if (effect.life <= 0) {
        this.healingEffects.splice(i, 1);
      }
    }
  }
  
  spawnMonsters(deltaTime) {
    this.spawnTimer += deltaTime;
    
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      
      // Determine spawn position (outside the screen)
      let side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch (side) {
        case 0: // top
          x = Math.random() * this.width;
          y = -30;
          break;
        case 1: // right
          x = this.width + 30;
          y = Math.random() * this.height;
          break;
        case 2: // bottom
          x = Math.random() * this.width;
          y = this.height + 30;
          break;
        case 3: // left
          x = -30;
          y = Math.random() * this.height;
          break;
      }
      
      // Determine monster type based on game time and score
      let type = 'normal';
      const timeSeconds = this.gameTime / 1000;
      const monsterDifficulty = 1 + (this.score / 1000); // Increase difficulty based on score
      
      // Adjust monster spawn rates based on difficulty
      if (timeSeconds > 60 && Math.random() < 0.05 * monsterDifficulty) {
        type = 'boss';
      } else if (timeSeconds > 30 && Math.random() < 0.1 * monsterDifficulty) {
        type = 'elite';
      } else if (timeSeconds > 20 && Math.random() < 0.2 * monsterDifficulty) {
        type = 'ranged';
      } else if (timeSeconds > 10 && Math.random() < 0.3 * monsterDifficulty) {
        type = 'fast';
      } else if (timeSeconds > 5 && Math.random() < 0.2 * monsterDifficulty) {
        type = 'tanker';
      }
      
      this.monsters.push(new Monster(x, y, type, monsterDifficulty));
      
      // Decrease spawn interval as time passes (faster spawning)
      // Adjust spawn rate based on difficulty
      this.spawnInterval = Math.max(100, 1000 - Math.floor(timeSeconds * 10 * monsterDifficulty));
    }
  }
  
  spawnResources(x, y, monsterType) {
    // Always drop experience
    this.resources.push(new Resource(x, y, 'experience'));
    
    // Chance to drop gold
    if (Math.random() < 0.5) {
      this.resources.push(new Resource(x + 20, y, 'gold'));
    }
    
    // Chance to drop health (lower chance)
    if (Math.random() < 0.2) {
      this.resources.push(new Resource(x - 20, y, 'health'));
    }
  }
  
  checkCollisions() {
    // Character with monsters
    // Find the closest monster within attack range
    let closestMonster = null;
    let closestDistance = Infinity;
    
    for (const monster of this.monsters) {
      // Check if monster is close enough to attack
      const distance = Math.sqrt(
        Math.pow(this.character.x + this.character.width/2 - (monster.x + monster.width/2), 2) +
        Math.pow(this.character.y + this.character.height/2 - (monster.y + monster.height/2), 2)
      );
      
      // Attack range is slightly larger than character size
      const attackRange = 400;
      
      if (distance < attackRange && distance < closestDistance) {
        closestMonster = monster;
        closestDistance = distance;
      }
      
      // Monster damages player on contact
      if (this.isColliding(this.character, monster)) {
        const damage = monster.damage * 0.1;
        this.character.takeDamage(damage); // Small damage per frame
        this.damageReceived += damage;
        // Play hit sound
        this.soundManager.playSound('playerHit');
      }
      
      // Check collision with whirlwind balls
      const whirlwindSkill = this.character.getSkill('Whirlwind');
      if (whirlwindSkill && whirlwindSkill.currentLevel > 0) {
        for (const ball of this.character.whirlwindBalls) {
          const ballX = this.character.x + this.character.width/2 + ball.x;
          const ballY = this.character.y + this.character.height/2 + ball.y;
          
          // Check if ball collides with monster
          const monsterCenterX = monster.x + monster.width/2;
          const monsterCenterY = monster.y + monster.height/2;
          const distanceToBall = Math.sqrt(
            Math.pow(ballX - monsterCenterX, 2) +
            Math.pow(ballY - monsterCenterY, 2)
          );
          
          // Ball radius is 5, monster radius is half width
          if (distanceToBall < 5 + monster.width/2) {
            // Apply damage from whirlwind skill
            const damage = whirlwindSkill.getEffectValue();
            const previousHealth = monster.health;
            monster.takeDamage(damage);
            const actualDamage = previousHealth - monster.health;
            this.totalDamageCaused += actualDamage;
            
            // Add to combat log
            this.addToCombatLog(monster.type, actualDamage);
            
            // Add hit effect at monster location
            this.addHitEffect(
              monster.x + monster.width/2,
              monster.y + monster.height/2,
              '#3498db'
            );
            
            // Break after first hit to avoid multiple hits per frame
            break;
          }
        }
      }
    }
 
    // Check if Triple Eff skill is active
    const tripleEffSkill = this.character.getSkill('Triple Eff');
    const useTripleEff = tripleEffSkill && tripleEffSkill.currentLevel > 0 && tripleEffSkill.cooldown <= 0;
    
    if (useTripleEff && this.character.canAttack()) {
      // Find up to 3 closest monsters within attack range
      const monstersInRange = [];
      const attackRange = 400;
      
      for (const monster of this.monsters) {
        const distance = Math.sqrt(
          Math.pow(this.character.x + this.character.width/2 - (monster.x + monster.width/2), 2) +
          Math.pow(this.character.y + this.character.height/2 - (monster.y + monster.height/2), 2)
        );
        
        if (distance < attackRange) {
          monstersInRange.push({ monster, distance });
        }
      }
      
      // Sort by distance and take up to 3 closest
      monstersInRange.sort((a, b) => a.distance - b.distance);
      const targets = monstersInRange.slice(0, 3).map(item => item.monster);
      
      // Attack each target
      if (targets.length > 0) {
        // With the updated attack method, we now shoot multiple bullets
        // We'll attack the closest monster and let the spread hit others
        const attackSuccessful = this.character.attack(
          targets[0].x + targets[0].width/2,
          targets[0].y + targets[0].height/2
        );
        
        if (attackSuccessful) {
          console.log('Character successfully attacked monsters with Triple Eff');
          
          // Activate Triple Eff cooldown
          if (tripleEffSkill) {
            tripleEffSkill.cooldown = tripleEffSkill.maxCooldown;
          }
          
          // Play attack sound
          this.soundManager.playSound('attack');
        }
      }
    } else if (closestMonster && this.character.canAttack()) {
      // Original single target attack logic
      const attackSuccessful = this.character.attack(
        closestMonster.x + closestMonster.width/2,
        closestMonster.y + closestMonster.height/2
      );
      if (attackSuccessful) {
        console.log('Character successfully attacked monster');
        // Play attack sound
        this.soundManager.playSound('attack');
      }
    }
    
    // Check for character bullet collisions with monsters
    for (let i = this.character.bullets.length - 1; i >= 0; i--) {
      const bullet = this.character.bullets[i];
      let hit = false;
      
      for (let j = this.monsters.length - 1; j >= 0; j--) {
        const monster = this.monsters[j];
        if (this.isCollidingWithBullet(monster, bullet)) {
          // Character bullet hits monster
          const previousHealth = monster.health;
          monster.takeDamage(bullet.damage);
          const actualDamage = previousHealth - monster.health;
          this.totalDamageCaused += actualDamage;
          this.character.bullets.splice(i, 1);
          hit = true;
          
          // Add to combat log
          this.addToCombatLog(monster.type, actualDamage);
          
          // Add hit effect at monster location
          this.addHitEffect(
            monster.x + monster.width/2,
            monster.y + monster.height/2,
            '#ff0000'
          );
          
          // Play attack sound
          this.soundManager.playSound('attack');
          break;
        }
      }
      
      // If bullet didn't hit anything and is off-screen, remove it
      if (!hit && (bullet.x < -100 || bullet.x > this.width + 100 || bullet.y < -100 || bullet.y > this.height + 100)) {
        this.character.bullets.splice(i, 1);
      }
    }
    
    // Check for monster bullet collisions with character
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      if (monster.type === 'ranged' && monster.bullets) {
        for (let j = monster.bullets.length - 1; j >= 0; j--) {
          const bullet = monster.bullets[j];
          if (this.isCollidingWithBullet(this.character, bullet)) {
            // Check if character dodges the attack using Evasion skill
            const evasionSkill = this.character.getSkill('Evasion');
            let takesDamage = true;
            
            if (evasionSkill && evasionSkill.currentLevel > 0) {
              // Calculate dodge chance (5% base + 5% per level)
              const dodgeChance = evasionSkill.getEffectValue() / 100;
              if (Math.random() < dodgeChance) {
                takesDamage = false;
                console.log('Character dodged monster bullet!');
              }
            }
            
            // Monster bullet hits character
            if (takesDamage) {
              this.character.takeDamage(bullet.damage);
              this.damageReceived += bullet.damage;
            }
            
            monster.bullets.splice(j, 1);
            // Play hit sound only if character takes damage
            if (takesDamage) {
              this.soundManager.playSound('playerHit');
            }
          }
        }
      }
    }
    
    // Character with resources
    for (let i = this.resources.length - 1; i >= 0; i--) {
      const resource = this.resources[i];
      if (this.isColliding(this.character, resource)) {
        const collected = resource.collect();
        
        // Add collection effect
        this.addCollectionEffect(resource.x + resource.width/2, resource.y + resource.height/2, resource.color);
        
        // Play collection sound
        this.soundManager.playSound('collect');
        
        switch (collected.type) {
          case 'health':
            this.character.heal(collected.value);
            this.totalHealthRecovered += collected.value;
            break;
          case 'gold':
            this.character.gold += collected.value;
            break;
          case 'experience':
            this.character.addExperience(collected.value);
            break;
        }
      }
    }
  }
  
  isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  // Check if a bullet collides with an entity
  isCollidingWithBullet(entity, bullet) {
    return entity.x < bullet.x + bullet.width &&
           entity.x + entity.width > bullet.x &&
           entity.y < bullet.y + bullet.height &&
           entity.y + entity.height > bullet.y;
  }
  
  // Check if an entity is within the viewport
  isInView(entity) {
    const buffer = 100; // Render entities slightly outside viewport
    return entity.x + entity.width > -buffer &&
           entity.x < this.width + buffer &&
           entity.y + entity.height > -buffer &&
           entity.y < this.height + buffer;
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Render resources (only those within viewport)
    for (const resource of this.resources) {
      if (this.isInView(resource)) {
        resource.render(this.ctx);
      }
    }
    
    // Render monsters (only those within viewport)
    for (const monster of this.monsters) {
      if (this.isInView(monster)) {
        monster.render(this.ctx);
      }
    }
    
    // Render character
    this.character.render(this.ctx);
    
    // Render attack effects
    this.renderAttackEffects();
    
    // Render death effects
    this.renderDeathEffects();
    
    // Render collection effects
    this.renderCollectionEffects();
    
    // Render level-up effects
    this.renderLevelUpEffects();
    
    // Render healing effects
    this.renderHealingEffects();
    
    // Render UI
    this.renderUI();
  }
  
  renderUI() {
    // Welcome screen
    if (this.state === 'welcome') {
      // Hide canvas and show welcome screen
      document.getElementById('gameCanvas').style.display = 'none';
      document.getElementById('welcomeScreen').style.display = 'block';
      
      // Update character info
      this.updateWelcomeScreenInfo();
      return;
    } else {
      // Show canvas and hide welcome screen
      document.getElementById('gameCanvas').style.display = 'block';
      document.getElementById('welcomeScreen').style.display = 'none';
    }
    
    // Score
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    
    // Level
    this.ctx.fillText(`Level: ${this.character.level}`, 10, 40);
    
    // Gold
    this.ctx.fillText(`Gold: ${this.character.gold}`, 10, 60);
    
    // Experience
    this.ctx.fillText(`Exp: ${this.character.experience}/${this.character.experienceToNextLevel}`, 10, 80);
    
    // Attack
    this.ctx.fillText(`Attack: ${this.character.damage}`, 10, 100);
    
    // Speed
    this.ctx.fillText(`Speed: ${this.character.speed}`, 10, 120);
    
    // Health bar
    const healthBarWidth = 150;
    const healthBarHeight = 15;
    const healthBarX = 10;
    const healthBarY = 130;
    
    // Health bar background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Health bar fill
    const healthPercent = this.character.health / this.character.maxHealth;
    this.ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
    this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    
    // Health text
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(`Health: ${Math.floor(this.character.health)}/${this.character.maxHealth}`, healthBarX + 5, healthBarY + healthBarHeight - 3);
    
    // Render skill boxes at the bottom of the health bar
    this.renderSkillBoxes(healthBarX, healthBarY + healthBarHeight + 10);
    
    // Render log information board
    if (this.state === 'playing') {
      this.renderLogInfoBoard();
    }
    
    // Game time (repositioned to the middle of the top of the screen)
    const timeSeconds = Math.floor(this.gameTime / 1000);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Time: ${timeSeconds}s`, this.width / 2, 30);
    this.ctx.textAlign = 'left';
    this.ctx.font = '14px Arial';
    
    // Save/Load instructions
    // this.ctx.fillText('F5: Save Game', this.width - 120, 20);
    // this.ctx.fillText('F9: Load Game', this.width - 120, 40);
    
    // Shop instructions
    // this.ctx.fillText('P: Open Shop', this.width - 120, 60);
    
    // Shop screen
    if (this.state === 'shop') {
      this.renderShop();
      return;
    }
    
    // Game over screen
    if (this.state === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = '40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over', this.width / 2, this.height / 2 - 40);
      this.ctx.font = '20px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2);
      this.ctx.fillText('Press R to restart or P to shop', this.width / 2, this.height / 2 + 40);
      this.ctx.fillText('Returning to welcome screen in 5 seconds...', this.width / 2, this.height / 2 + 80);
      this.ctx.textAlign = 'left';
      
      // Update welcome screen info for when player returns
      this.updateWelcomeScreenInfo();
    }
    
    // Level up notification
    if (this.character.levelUpNotification) {
      this.ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('LEVEL UP!', this.width / 2, this.height / 2 - 100);
      this.ctx.font = '20px Arial';
      this.ctx.fillText('Choose an attribute to upgrade:', this.width / 2, this.height / 2 - 60);
      this.ctx.fillText('1 - Health (+30 max health)', this.width / 2, this.height / 2 - 20);
      this.ctx.fillText('2 - Damage (+8 damage)', this.width / 2, this.height / 2 + 20);
      this.ctx.fillText('3 - Speed (+1 speed)', this.width / 2, this.height / 2 + 60);
      this.ctx.textAlign = 'left';
      
      // Auto-hide notification after 10 seconds
      if (Date.now() - this.character.levelUpNotificationTime > 10000) {
        this.character.levelUpNotification = false;
      }
    }
  }
  
  // Activate a character skill
  activateCharacterSkill(skillName) {
    // Check if the game is in playing state
    if (this.state !== 'playing') return;
    
    // Whirlwind is a passive skill, so don't activate it
    if (skillName === 'Whirlwind') return;
    
    // Power Attack and Second Wind are passive skills, so don't activate them
    if (skillName === 'Power Attack' || skillName === 'Second Wind') return;
  }
  
  renderAttackEffects() {
    for (const effect of this.attackEffects) {
      if (effect.startX !== undefined && effect.endX !== undefined) {
        // Line effect (attack)
        const alpha = effect.life / effect.maxLife;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(effect.startX, effect.startY);
        this.ctx.lineTo(effect.endX, effect.endY);
        this.ctx.stroke();
      } else {
        // Circle effect (hit)
        const alpha = effect.life / effect.maxLife;
        this.ctx.fillStyle = `${effect.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
  
  renderDeathEffects() {
    for (const effect of this.deathEffects) {
      const alpha = effect.life / effect.maxLife;
      this.ctx.fillStyle = `rgba(${parseInt(effect.color.slice(1, 3), 16)}, ${parseInt(effect.color.slice(3, 5), 16)}, ${parseInt(effect.color.slice(5, 7), 16)}, ${alpha * 0.7})`;
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  renderCollectionEffects() {
    for (const effect of this.collectionEffects) {
      this.ctx.fillStyle = `${effect.color}${Math.floor(effect.alpha * 255).toString(16).padStart(2, '0')}`;
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  renderLevelUpEffects() {
    for (const effect of this.levelUpEffects) {
      this.ctx.fillStyle = `rgba(241, 196, 15, ${effect.alpha})`; // Gold color with alpha
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add star shape for level up effect
      this.ctx.fillStyle = `rgba(255, 255, 255, ${effect.alpha * 0.8})`;
      this.drawStar(effect.x, effect.y, 5, effect.size * 0.8, effect.size * 0.4);
    }
  }
  
  renderHealingEffects() {
    for (const effect of this.healingEffects) {
      this.ctx.fillStyle = `rgba(46, 204, 113, ${effect.alpha})`; // Green color with alpha
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`+${Math.floor(effect.amount)}`, effect.x, effect.y);
      this.ctx.textAlign = 'left';
    }
  }
  
  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.fill();
  }
  
  renderMenu() {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Title
    this.ctx.fillStyle = 'white';
    this.ctx.font = '60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ENDLESS SURVIVAL', this.width / 2, 100);
    
    // Subtitle
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Survive as long as possible against endless waves of monsters', this.width / 2, 150);
    
    // Menu options
    this.ctx.font = '30px Arial';
    this.ctx.fillText('Press SPACE to Start', this.width / 2, this.height / 2);
    
    // Instructions
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Controls:', this.width / 2, this.height / 2 + 60);
    this.ctx.fillText('Arrow Keys or WASD to move', this.width / 2, this.height / 2 + 90);
    this.ctx.fillText('P to open Shop', this.width / 2, this.height / 2 + 120);
    this.ctx.fillText('Press P from menu to access shop', this.width / 2, this.height / 2 + 150);
    this.ctx.fillText('F5 to Save, F9 to Load', this.width / 2, this.height / 2 + 150);
    
    this.ctx.textAlign = 'left';
  }
  
  renderShop() {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Shop title
    this.ctx.fillStyle = 'white';
    this.ctx.font = '40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SHOP', this.width / 2, 60);
    
    // Player gold
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Gold: ${this.character.gold}`, this.width / 2, 100);
    
    // Shop tabs
    const tabWidth = 150;
    const tabHeight = 40;
    const tabY = 120;
    const equipmentTabX = (this.width / 2) - tabWidth - 10;
    const skillsTabX = (this.width / 2) + 10;
    
    // Equipment tab
    this.ctx.fillStyle = '#3498db';
    this.ctx.fillRect(equipmentTabX, tabY, tabWidth, tabHeight);
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(equipmentTabX, tabY, tabWidth, tabHeight);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Equipment', equipmentTabX + tabWidth / 2, tabY + tabHeight / 2 + 7);
    
    // Skills tab
    this.ctx.fillStyle = '#9b59b6';
    this.ctx.fillRect(skillsTabX, tabY, tabWidth, tabHeight);
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(skillsTabX, tabY, tabWidth, tabHeight);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Skills', skillsTabX + tabWidth / 2, tabY + tabHeight / 2 + 7);
    
    // Available equipment
    const equipmentTypes = ['sword', 'shield', 'boots', 'amulet'];
    const itemWidth = 150;
    const itemHeight = 100;
    const itemSpacing = 20;
    const startX = (this.width - (equipmentTypes.length * itemWidth + (equipmentTypes.length - 1) * itemSpacing)) / 2;
    const startY = 180;
    
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    
    for (let i = 0; i < equipmentTypes.length; i++) {
      const x = startX + i * (itemWidth + itemSpacing);
      const y = startY;
      
      // Item background
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(x, y, itemWidth, itemHeight);
      
      // Item border
      this.ctx.strokeStyle = '#555';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, itemWidth, itemHeight);
      
      // Check if player already has this type of equipment
      const existingEquipment = this.character.inventory.find(item => item.type === equipmentTypes[i]);
      
      if (existingEquipment) {
        // Show upgrade info
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(existingEquipment.icon, x + 10, y + 30);
        this.ctx.fillText(`${existingEquipment.name} (Lvl ${existingEquipment.level})`, x + 40, y + 30);
        
        // Item description
        this.ctx.font = '14px Arial';
        this.ctx.fillText(existingEquipment.getDescription(), x + 10, y + 55);
        
        // Upgrade cost
        const upgradeCost = existingEquipment.getUpgradeCost();
        this.ctx.fillText(`Upgrade: ${upgradeCost} gold`, x + 10, y + 80);
        
        // Item index for purchase
        this.ctx.fillText(`Press ${i + 1} to upgrade`, x + 10, y + 95);
      } else {
        // Show purchase info
        const equipment = new Equipment(equipmentTypes[i], 1);
        
        // Item icon and name
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(equipment.icon, x + 10, y + 30);
        this.ctx.fillText(equipment.name, x + 40, y + 30);
        
        // Item description
        this.ctx.font = '14px Arial';
        this.ctx.fillText(equipment.getDescription(), x + 10, y + 55);
        
        // Item cost
        this.ctx.fillText(`Cost: ${equipment.cost} gold`, x + 10, y + 80);
        
        // Item index for purchase
        this.ctx.fillText(`Press ${i + 1} to buy`, x + 10, y + 95);
      }
      
      // Reset font for next item
      this.ctx.font = '16px Arial';
    }
    
    // Available skills
    const availableSkills = this.character.getAvailableSkills();
    const skillWidth = 200;
    const skillHeight = 80;
    const skillSpacing = 15;
    const skillStartX = (this.width - (Math.min(3, availableSkills.length) * skillWidth + (Math.min(3, availableSkills.length) - 1) * skillSpacing)) / 2;
    const skillStartY = startY + itemHeight + 50;
    
    this.ctx.font = '14px Arial';
    
    for (let i = 0; i < availableSkills.length; i++) {
      const x = skillStartX + (i % 3) * (skillWidth + skillSpacing);
      const y = skillStartY + Math.floor(i / 3) * (skillHeight + skillSpacing);
      
      const skill = availableSkills[i];
      
      // Skill background
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(x, y, skillWidth, skillHeight);
      
      // Skill border
      this.ctx.strokeStyle = '#555';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, skillWidth, skillHeight);
      
      // Skill name and level
      this.ctx.fillStyle = 'white';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`${skill.name} (Lvl ${skill.currentLevel}/${skill.levels})`, x + 10, y + 20);
      
      // Skill description
      this.ctx.font = '12px Arial';
      this.ctx.fillText(skill.getDescription(), x + 10, y + 40);
      
      // Skill cost or cooldown
      if (skill.canUpgrade()) {
        const upgradeCost = skill.getUpgradeCost();
        this.ctx.fillText(`Upgrade: ${upgradeCost} gold`, x + 10, y + 60);
        this.ctx.fillText(`Press ${i + 5} to upgrade`, x + 10, y + 75);
      } else if (skill.currentLevel > 0) {
        this.ctx.fillText('Max level reached', x + 10, y + 60);
      } else {
        this.ctx.fillText(`Unlock at level ${skill.unlockLevel}`, x + 10, y + 60);
      }
    }
    
    // Exit instructions
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Press ESC to exit shop', this.width / 2, this.height - 50);
    this.ctx.fillText('Click items to purchase', this.width / 2, this.height - 30);
  }
  
  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.gameTime = 0;
    // Reset log information board statistics
    this.monstersDestroyed = 0;
    this.totalDamageCaused = 0;
    this.damageReceived = 0;
    this.totalHealthRecovered = 0;
    this.combatLog = []; // Reset combat log
    // Keep the existing character with their equipment
    this.character.x = this.width / 2;
    this.character.y = this.height / 2;
    this.character.health = this.character.maxHealth;
    this.monsters = [];
    this.resources = [];
    this.attackEffects = [];
    this.deathEffects = [];
    this.collectionEffects = [];
    this.levelUpEffects = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1000;
    
    // Load user data
    this.loadUserData();
    
    // Resize canvas to match current window size
    this.resizeCanvas();
  }
  
  restart() {
    // Return to welcome screen
    this.state = 'welcome';
    // Create a new character to reset equipment
    this.character = new Character(this.width / 2, this.height / 2, this);
    // Load user data
    this.loadUserData();
    // Update welcome screen info
    this.updateWelcomeScreenInfo();
  }
  
  saveUserData() {
    const userData = {
      maxHealth: this.character.maxHealth,
      damage: this.character.damage,
      speed: this.character.speed,
      level: this.character.level,
      experience: this.character.experience,
      experienceToNextLevel: this.character.experienceToNextLevel,
      gold: this.character.gold,
      inventory: this.character.inventory.map(item => ({
        type: item.type,
        level: item.level
      })),
      skills: this.character.skills.map(skill => ({
        name: skill.name,
        currentLevel: skill.currentLevel
      }))
    };
    
    localStorage.setItem('endlessSurvivalUserData', JSON.stringify(userData));
  }
  
  saveGame() {
    const gameState = {
      score: this.score,
      gameTime: this.gameTime,
      character: {
        x: this.character.x,
        y: this.character.y,
        health: this.character.health,
        maxHealth: this.character.maxHealth,
        damage: this.character.damage,
        speed: this.character.speed,
        level: this.character.level,
        experience: this.character.experience,
        experienceToNextLevel: this.character.experienceToNextLevel,
        gold: this.character.gold
      }
    };
    
    localStorage.setItem('endlessSurvivalSave', JSON.stringify(gameState));
  }
  
  loadUserData() {
    const userData = localStorage.getItem('endlessSurvivalUserData');
    if (!userData) return false;
    
    try {
      const data = JSON.parse(userData);
      
      // Restore character state
      this.character.maxHealth = data.maxHealth || this.character.maxHealth;
      this.character.damage = data.damage || this.character.damage;
      this.character.speed = data.speed || this.character.speed;
      this.character.level = data.level || this.character.level;
      this.character.experience = data.experience || this.character.experience;
      this.character.experienceToNextLevel = data.experienceToNextLevel || this.character.experienceToNextLevel;
      this.character.gold = data.gold || this.character.gold;
      
      // Restore equipment
      if (data.inventory) {
        this.character.inventory = [];
        for (const itemData of data.inventory) {
          const equipment = new Equipment(itemData.type, itemData.level);
          this.character.addEquipment(equipment);
        }
      }
      
      // Restore skills
      if (data.skills) {
        for (const skillData of data.skills) {
          const skill = this.character.skills.find(s => s.name === skillData.name);
          if (skill) {
            skill.currentLevel = skillData.currentLevel;
          }
        }
      }
      
      // Update welcome screen info
      this.updateWelcomeScreenInfo();
      
      return true;
    } catch (e) {
      console.error('Failed to load user data:', e);
      return false;
    }
  }
  
  resizeCanvas() {
    // Set canvas dimensions to match window size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }
  
  loadGame() {
    const saveData = localStorage.getItem('endlessSurvivalSave');
    if (!saveData) return false;
    
    try {
      const gameState = JSON.parse(saveData);
      
      this.score = gameState.score;
      this.gameTime = gameState.gameTime;
      
      // Restore character state
      this.character.x = gameState.character.x;
      this.character.y = gameState.character.y;
      this.character.health = gameState.character.health;
      this.character.maxHealth = gameState.character.maxHealth;
      this.character.damage = gameState.character.damage;
      this.character.speed = gameState.character.speed;
      this.character.level = gameState.character.level;
      this.character.experience = gameState.character.experience;
      this.character.experienceToNextLevel = gameState.character.experienceToNextLevel;
      this.character.gold = gameState.character.gold;
      
      return true;
    } catch (e) {
      console.error('Failed to load game:', e);
      return false;
    }
  }
  
  addAttackEffect(startX, startY, endX, endY) {
    // Create a simple line effect from player to monster
    this.attackEffects.push({
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      life: 100, // milliseconds
      maxLife: 100
    });
  }
  
  addHitEffect(x, y, color) {
    // Create a hit effect at the impact point
    this.attackEffects.push({
      x: x,
      y: y,
      color: color,
      size: 5,
      maxLife: 200, // milliseconds
      life: 200,
      expansionRate: 0.5
    });
  }
  
  addDeathEffect(x, y, color) {
    // Create a simple explosion effect
    this.deathEffects.push({
      x: x,
      y: y,
      color: color,
      size: 5,
      maxLife: 300, // milliseconds
      life: 300,
      expansionRate: 0.2
    });
  }
  
  addToCombatLog(monsterType, damage) {
    // Add combat event to log
    const event = {
      monsterType: monsterType,
      damage: damage,
      timestamp: Date.now()
    };
    
    // Add to beginning of array (newest first)
    this.combatLog.unshift(event);
    
    // Keep only the last 5 events
    if (this.combatLog.length > 5) {
      this.combatLog.pop();
    }
  }
  
  addCollectionEffect(x, y, color) {
    // Create a simple collection effect
    this.collectionEffects.push({
      x: x,
      y: y,
      color: color,
      size: 5,
      maxLife: 500, // milliseconds
      life: 500,
      expansionRate: 0.1,
      alpha: 1
    });
  }
  
  addHealingEffect(x, y, amount) {
    // Create a healing display effect
    this.healingEffects.push({
      x: x,
      y: y,
      amount: amount,
      maxLife: 1000, // milliseconds (1 second)
      life: 1000,
      alpha: 1
    });
  }
  
  addLevelUpEffect(x, y) {
    // Create a simple level up effect
    this.levelUpEffects.push({
      x: x,
      y: y,
      color: '#f1c40f', // Gold color
      size: 10,
      maxLife: 1000, // milliseconds
      life: 1000,
      expansionRate: 0.2,
      alpha: 1
    });
  }
  
  addSkillEffect(x, y, skillName) {
    // Create a skill effect based on the skill type
    let color = '#9b59b6'; // Default purple color for skills
    let size = 15;
    let maxLife = 800;
    
    // Customize effect based on skill name
    switch(skillName) {
      case 'Whirlwind':
        color = '#3498db'; // Blue for whirlwind
        size = 20;
        maxLife = 1000;
        break;
      case 'Power Attack':
        color = '#e74c3c'; // Red for power attack
        size = 25;
        maxLife = 600;
        break;
      case 'Health Regeneration':
        color = '#2ecc71'; // Green for healing
        size = 15;
        maxLife = 1200;
        break;
      case 'Second Wind':
        color = '#2ecc71'; // Green for healing
        size = 30;
        maxLife = 1500;
    }
    
    // Create the effect
    this.levelUpEffects.push({
      x: x,
      y: y,
      color: color,
      size: size,
      maxLife: maxLife,
      life: maxLife,
      expansionRate: 0.3,
      alpha: 1
    });
  }
  
// Render log information board
  renderLogInfoBoard() {
    // Position the board in the upper right corner
    const boardX = this.width - 280;
    const boardY = 10;
    const boardWidth = 270;
    const boardHeight = 220;
    
    // Draw board background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(boardX, boardY, boardWidth, boardHeight);
    
    // Draw board border
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boardX, boardY, boardWidth, boardHeight);
    
    // Draw title
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Combat Log', boardX + 10, boardY + 20);
    
    // Draw statistics
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Monsters Destroyed: ${this.monstersDestroyed}`, boardX + 10, boardY + 40);
    this.ctx.fillText(`Total Damage: ${Math.floor(this.totalDamageCaused)}`, boardX + 10, boardY + 60);
    this.ctx.fillText(`Damage Received: ${Math.floor(this.damageReceived)}`, boardX + 10, boardY + 80);
    this.ctx.fillText(`Health Recovered: ${Math.floor(this.totalHealthRecovered)}`, boardX + 10, boardY + 100);
    
    // Draw recent combat events
    this.ctx.font = '12px Arial';
    this.ctx.fillText('Recent Kills:', boardX + 10, boardY + 120);
    
    // Draw up to 5 recent combat events
    for (let i = 0; i < Math.min(5, this.combatLog.length); i++) {
      const event = this.combatLog[i];
      const yPosition = boardY + 140 + (i * 15);
      
      // Format the event text
      let eventText = `${event.monsterType}: ${Math.floor(event.damage)} dmg`;
      
      // Truncate text if it's too long to fit in the panel
      const maxWidth = boardWidth - 30;
      let textWidth = this.ctx.measureText(eventText).width;
      
      // If text is too wide, truncate it
      if (textWidth > maxWidth) {
        let truncatedText = eventText;
        while (textWidth > maxWidth && truncatedText.length > 0) {
          truncatedText = truncatedText.substring(0, truncatedText.length - 1);
          textWidth = this.ctx.measureText(truncatedText + '...').width;
        }
        eventText = truncatedText + '...';
      }
      
      this.ctx.fillText(eventText, boardX + 20, yPosition);
    }
  }
  // Render skill boxes with cooldown times
  renderSkillBoxes(x, y) {
    const skillBoxSize = 50;
    const skillBoxSpacing = 10;
    const skills = this.character.getUnlockedSkills();
    
    // Show up to 4 skills per row
    for (let i = 0; i < skills.length; i++) {
      const skill = skills[i];
      const row = Math.floor(i / 4);
      const col = i % 4;
      const boxX = x + col * (skillBoxSize + skillBoxSpacing);
      const boxY = y + row * (skillBoxSize + skillBoxSpacing);
      
      // Draw skill box background
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(boxX, boxY, skillBoxSize, skillBoxSize);
      
      // Draw skill box border
      this.ctx.strokeStyle = '#555';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(boxX, boxY, skillBoxSize, skillBoxSize);
      
      // Draw skill name (abbreviated)
      this.ctx.fillStyle = 'white';
      this.ctx.font = '12px Arial';
      let skillName = skill.name;
      if (skillName.length > 8) {
        skillName = skillName.substring(0, 8) + '...';
      }
      this.ctx.fillText(skillName, boxX + 5, boxY + 15);
      
      // Draw skill level
      this.ctx.fillText(`Lvl: ${skill.currentLevel}`, boxX + 5, boxY + 30);
      
      // Draw cooldown timer if skill is on cooldown
      if (skill.cooldown > 0) {
        // Dark overlay to indicate cooldown
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(boxX, boxY, skillBoxSize, skillBoxSize);
        
        // Cooldown time in seconds
        const cooldownSeconds = Math.ceil(skill.cooldown / 1000);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${cooldownSeconds}`, boxX + skillBoxSize / 2, boxY + skillBoxSize / 2 + 8);
        this.ctx.textAlign = 'left';
        this.ctx.font = '12px Arial';
      }
    }
  }
  
  // Update character information on the welcome screen
  updateWelcomeScreenInfo() {
    // Update character stats
    const healthElement = document.getElementById('characterHealth');
    if (healthElement) {
      healthElement.textContent = this.character.maxHealth;
    }
    
    const damageElement = document.getElementById('characterDamage');
    if (damageElement) {
      // Include equipment bonus in damage display
      const equipmentBonus = this.character.getEquipmentBonus('damage');
      damageElement.textContent = `${this.character.damage} (+${equipmentBonus})`;
    }
    
    const speedElement = document.getElementById('characterSpeed');
    if (speedElement) {
      // Include equipment bonus in speed display
      const equipmentBonus = this.character.getEquipmentBonus('speed');
      speedElement.textContent = `${this.character.speed} (+${equipmentBonus})`;
    }
    
    const goldElement = document.getElementById('characterGold');
    if (goldElement) {
      goldElement.textContent = this.character.gold;
    }
    
    // Update equipment list
    const equipmentListElement = document.getElementById('equipmentList');
    if (equipmentListElement) {
      if (this.character.inventory.length === 0) {
        equipmentListElement.innerHTML = '<p>No equipment purchased yet</p>';
      } else {
        let equipmentHTML = '';
        for (const item of this.character.inventory) {
          equipmentHTML += `
            <div class="equipment-item">
              <strong>${item.icon} ${item.name}</strong> (Level ${item.level})
              <br>
              <small>${item.getDescription()}</small>
            </div>
          `;
        }
        equipmentListElement.innerHTML = equipmentHTML;
      }
    }
    
    // Update skills list
    const skillsListElement = document.getElementById('skillsList');
    if (skillsListElement) {
      const unlockedSkills = this.character.getUnlockedSkills();
      if (unlockedSkills.length === 0) {
        skillsListElement.innerHTML = '<p>No skills unlocked yet</p>';
      } else {
        let skillsHTML = '';
        for (const skill of unlockedSkills) {
          skillsHTML += `
            <div class="skill-item">
              <strong>${skill.name}</strong> (Level ${skill.currentLevel}/${skill.levels})
              <br>
              <small>${skill.getDescription()}</small>
            </div>
          `;
        }
        skillsListElement.innerHTML = skillsHTML;
      }
    }
  }
  
  purchaseEquipment(index) {
    const equipmentTypes = ['sword', 'shield', 'boots', 'amulet'];
    if (index < 0 || index >= equipmentTypes.length) return;
    
    const equipmentType = equipmentTypes[index];
    
    // Check if player already has this type of equipment
    const existingEquipment = this.character.inventory.find(item => item.type === equipmentType);
    
    if (existingEquipment) {
      // Upgrade existing equipment
      const upgradeCost = existingEquipment.getUpgradeCost();
      if (this.character.gold >= upgradeCost) {
        // Deduct gold
        this.character.gold -= upgradeCost;
        
        // Upgrade equipment
        existingEquipment.upgrade();
        
        // Apply upgrade bonus
        this.character.applyEquipmentBonus(existingEquipment);
        
        // Show purchase confirmation
        console.log(`Upgraded ${existingEquipment.name} for ${upgradeCost} gold`);
        // Play purchase sound
        this.soundManager.playSound('purchase');
        
        // Update welcome screen info
        if (this.state === 'welcome' || this.state === 'shop') {
          this.updateWelcomeScreenInfo();
        }
      }
    } else {
      // Purchase new equipment
      const equipment = new Equipment(equipmentType, 1);
      
      // Check if player has enough gold
      if (this.character.gold >= equipment.cost) {
        // Deduct gold
        this.character.gold -= equipment.cost;
        
        // Add equipment to inventory
        this.character.addEquipment(equipment);
        
        // Show purchase confirmation
        console.log(`Purchased ${equipment.name} for ${equipment.cost} gold`);
        // Play purchase sound
        this.soundManager.playSound('purchase');
        
        // Update welcome screen info
        if (this.state === 'welcome' || this.state === 'shop') {
          this.updateWelcomeScreenInfo();
        }
      }
    }
  }
  
  purchaseSkill(index) {
    // Get available skills
    const availableSkills = this.character.getAvailableSkills();
    
    if (index < 0 || index >= availableSkills.length) return;
    
    const skill = availableSkills[index];
    
    // Check if skill can be upgraded
    if (skill.canUpgrade() && this.character.gold >= skill.getUpgradeCost()) {
      // Deduct gold
      this.character.gold -= skill.getUpgradeCost();
      
      // Upgrade skill
      skill.upgrade();
      
      // Show purchase confirmation
      console.log(`Upgraded ${skill.name} for ${skill.getUpgradeCost()} gold`);
      // Play purchase sound
      this.soundManager.playSound('purchase');
      
      // Update welcome screen info
      if (this.state === 'welcome' || this.state === 'shop') {
        this.updateWelcomeScreenInfo();
      }
    }
  }
}

export default Game;