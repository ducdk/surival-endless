import Character from './entities/Character.js';
import Monster from './entities/Monster.js';
import Resource from './entities/Resource.js';
import Equipment from './entities/Equipment.js';
import ImageCache from './entities/ImageCache.js';
import SoundManager from './SoundManager.js';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    // Set canvas size to match window size
    this.resizeCanvas();
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Map size (much larger than viewport)
    this.mapWidth = 5000;
    this.mapHeight = 5000;
    
    // Camera position (top-left corner of the viewport)
    this.camera = {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height
    };
    
    // User data
    this.username = localStorage.getItem('endlessSurvivalUsername') || '';
    
    // Game state
    this.state = this.username ? 'welcome' : 'username'; // 'username', 'welcome', 'playing', 'gameOver', 'shop', 'reward', 'profile'
    this.previousState = null; // Track the state we came from when entering shop
    this.score = 0;
    this.gameTime = 0;
    
    // Shop UI state
    this.shopTab = 'equipment'; // Default tab
    this.shopScrollOffset = 0;  // Default scroll position
    
    // Log information board statistics
    this.monstersDestroyed = 0;
    this.totalDamageCaused = 0;
    this.damageReceived = 0;
    this.totalHealthRecovered = 0;
    this.combatLog = []; // Array to store recent combat events
    
    // Reward screen properties
    this.chests = []; // Array to store chest data
    this.selectedChest = null; // Track which chest was selected
    this.chestRewards = null; // Store rewards from selected chest
    
    // Entities
    this.character = new Character(this.mapWidth / 2, this.mapHeight / 2, this);
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
    
    // Reward screen properties
    this.chests = []; // Array to store chest data
    this.selectedChest = null; // Track which chest was selected
    this.chestRewards = null; // Store rewards from selected chest
    
    // Image cache to prevent continuous requests for missing images
    this.imageCache = new Map();
    
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

  // Clear the image cache
  clearImageCache() {
    this.imageCache.clear();
  }
  
  setupEventListeners() {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      
      // Handle username screen
      if (this.state === 'username' && e.key === 'Enter') {
        this.handleUsernameSubmit();
        return;
      }
      
      // Handle welcome screen
      if (this.state === 'welcome') {
        // Handle shop key
        if (e.key === 'p' || e.key === 'P') {
          this.previousState = this.state;
          this.state = 'shop';
          // Ẩn header khi vào shop
          this.toggleHeader(false);
        }
        // Handle profile key
        if (e.key === 'o' || e.key === 'O') {
          this.state = 'profile';
          // Ẩn header khi vào profile
          this.toggleHeader(false);
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
        if (this.state === 'playing') {
          this.previousState = 'playing';
          this.state = 'shop';
        } else if (this.state === 'welcome') {
          this.previousState = 'welcome';
          this.state = 'shop';
        } else if (this.state === 'shop') {
          // Return to the previous state
          if (this.character.health <= 0) {
            this.state = 'gameOver';
          } else if (this.previousState === 'playing') {
            this.state = 'playing';
          } else {
            this.state = 'welcome';
            // Show header when returning to welcome screen
            this.toggleHeader(true);
          }
        }
      } else if (this.state === 'shop') {
        // Handle shop tab switching
        if (e.key === '1') {
          this.shopTab = 'equipment';
        } else if (e.key === '2') {
          this.shopTab = 'skills';
        }
      } else if (this.state === 'playing') {
        // Handle skill activation (keys Q, E, R, F)
        switch(e.key) {
          case 'q':
          case 'Q':
            this.activateCharacterSkill('Whirlwind');
            break;
          case 'e':
          case 'E':
            this.activateCharacterSkill('Power Attack');
            break;
          case 'r':
          case 'R':
            this.activateCharacterSkill('Second Wind');
            break;
          }
        }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
    
    // Add event listener for username screen
    const submitUsernameButton = document.getElementById('submitUsername');
    if (submitUsernameButton) {
      submitUsernameButton.addEventListener('click', () => {
        this.handleUsernameSubmit();
      });
    }
    
    // Add event listeners for welcome screen buttons
    const startButton = document.getElementById('startButton');
    if (startButton) {
      startButton.addEventListener('click', () => {
        this.startGame();
        // Ẩn header khi bắt đầu game
        this.toggleHeader(false);
      });
    }
    
    const shopButton = document.getElementById('shopButton');
    if (shopButton) {
      shopButton.addEventListener('click', () => {
        this.previousState = 'welcome';
        this.state = 'shop';
        // Ẩn header khi vào shop
        this.toggleHeader(false);
      });
    }
    
    const profileButton = document.getElementById('profileButton');
    if (profileButton) {
      profileButton.addEventListener('click', () => {
        this.state = 'profile';
        // Ẩn header khi vào profile
        this.toggleHeader(false);
      });
    }
      
    // Mouse input for shop, game over screen, reward screen, and profile screen
    this.canvas.addEventListener('click', (e) => {
      if (this.state === 'shop') {
        this.handleShopClick(e);
      } else if (this.state === 'gameOver') {
        this.handleGameOverClick(e);
      } else if (this.state === 'reward') {
        this.handleRewardClick(e);
      } else if (this.state === 'profile') {
        this.handleProfileClick(e);
      }
    });
      
    // Add mouse wheel support for shop scrolling
    this.canvas.addEventListener('wheel', (e) => {
      if (this.state === 'shop') {
        e.preventDefault();
        const scrollAmount = e.deltaY > 0 ? 30 : -30;
        
        // Calculate content height
        const contentHeight = this.shopTab === 'skills' ? 
          Math.ceil(this.character.getAvailableSkills().length / 2) * 120 : 
          Math.ceil(4 / 2) * 120; // Height of items with spacing
        
        const contentAreaHeight = this.height - 180 - 120; // Top margin + bottom margin
        const maxScroll = Math.max(0, contentHeight - contentAreaHeight);
        
        this.shopScrollOffset = Math.max(0, Math.min(maxScroll, this.shopScrollOffset + scrollAmount));
      }
    }, { passive: false });
  }
  
  // Get count of shop items for current tab for scrolling calculation
  getShopItemsCount() {
    if (this.shopTab === 'equipment') {
      return 4; // Number of equipment types
    } else if (this.shopTab === 'skills') {
      return this.character.getAvailableSkills().length;
    }
    return 0;
  }
  
  // Handle shop clicks
  handleShopClick(e) {
    const { x, y } = this.getCanvasCoordinates(e);
    
    // Define tab constants at the beginning
    const tabWidth = 150;
    const tabHeight = 40;
    const tabY = 120;
    const equipmentTabX = (this.width / 2) - tabWidth - 10;
    const skillsTabX = (this.width / 2) + 10;
    
    // Check if back button was clicked
    const buttonWidth = 150;
    const buttonHeight = 40;
    const buttonX = this.width / 2 - buttonWidth / 2;
    const buttonY = this.height - 70;
    
    if (x >= buttonX && x <= buttonX + buttonWidth &&
        y >= buttonY && y <= buttonY + buttonHeight) {
      // Return to the previous state
      if (this.character.health <= 0) {
        this.state = 'gameOver';
      } 
      // If coming from the playing state, return to playing
      else if (this.previousState === 'playing') {
        this.state = 'playing';
      } 
      // If coming from the welcome state, return to welcome
      else {
        this.state = 'welcome';
        // Show header when returning to welcome screen
        this.toggleHeader(true);
      }
      return;
    }
    
    // Equipment tab
    if (x >= equipmentTabX && x <= equipmentTabX + tabWidth && 
        y >= tabY && y <= tabY + tabHeight) {
      this.shopTab = 'equipment';
      this.shopScrollOffset = 0; // Reset scroll position on tab change
      return;
    }
    
    // Skills tab
    if (x >= skillsTabX && x <= skillsTabX + tabWidth && 
        y >= tabY && y <= tabY + tabHeight) {
      this.shopTab = 'skills';
      this.shopScrollOffset = 0; // Reset scroll position on tab change
      return;
    }
    
    // Account for scroll offset in content area
    const contentAreaY = tabY + tabHeight + 20;
    
    // Check if we clicked in the clipped content area
    if (y >= contentAreaY && y <= this.height - 120) {
      const adjustedY = y + this.shopScrollOffset;
      
      if (this.shopTab === 'equipment') {
        this.handleShopEquipmentClick(x, adjustedY, contentAreaY);
      } else if (this.shopTab === 'skills') {
        this.handleShopSkillsClick(x, adjustedY, contentAreaY);
      }
    }
  }
  
  // Handle clicks on equipment items in shop
  handleShopEquipmentClick(x, y, startY) {
    const equipmentTypes = ['sword', 'shield', 'boots', 'amulet'];
    const itemWidth = 350;
    const itemHeight = 100;
    const itemSpacing = 20;
    const columns = 2;
    const columnWidth = itemWidth + itemSpacing;
    const startX = (this.width - (columns * columnWidth - itemSpacing)) / 2;
    
    for (let i = 0; i < equipmentTypes.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const itemX = startX + col * columnWidth;
      const itemY = startY + row * (itemHeight + itemSpacing);
      
      // Check if click is within item bounds
      if (x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + itemHeight) {
        // Check if player has this equipment
        const existingEquipment = this.character.inventory.find(item => item.type === equipmentTypes[i]);
        
        // Button coordinates
        const buttonWidth = 80;
        const buttonHeight = 28;
        const buttonX = itemX + itemWidth - buttonWidth - 10;
        const buttonY = itemY + itemHeight - buttonHeight - 10;
        
        // Check if button was clicked
        if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
          if (existingEquipment) {
            // Upgrade existing equipment if not max level
            if (existingEquipment.level < 10) {
              const upgradeCost = existingEquipment.getUpgradeCost();
              if (this.character.gold >= upgradeCost) {
                this.character.gold -= upgradeCost;
                existingEquipment.upgrade();
                
                // Apply upgrade bonus
                this.character.applyEquipmentBonus(existingEquipment);
                
                console.log(`Upgraded ${existingEquipment.name} to level ${existingEquipment.level}`);
                // Play purchase sound
                this.soundManager.playSound('purchase');
                
                // Update welcome screen info
                if (this.state === 'welcome' || this.state === 'shop') {
                  this.updateWelcomeScreenInfo();
                }
              }
            }
          } else {
            // Buy new equipment
            const equipment = new Equipment(equipmentTypes[i], 1);
            if (this.character.gold >= equipment.cost) {
              this.character.gold -= equipment.cost;
              this.character.addEquipment(equipment);
              console.log(`Purchased ${equipment.name}`);
              
              // Play purchase sound
              this.soundManager.playSound('purchase');
              
              // Update welcome screen info
              if (this.state === 'welcome' || this.state === 'shop') {
                this.updateWelcomeScreenInfo();
              }
            }
          }
        }
        return;
      }
    }
  }
  
  // Handle clicks on skill items in shop
  handleShopSkillsClick(x, y, startY) {
    const availableSkills = this.character.getAvailableSkills();
    const skillWidth = 350;
    const skillHeight = 100;
    const skillSpacing = 20;
    const columns = 2;
    const columnWidth = skillWidth + skillSpacing;
    const startX = (this.width - (columns * columnWidth - skillSpacing)) / 2;
    
    for (let i = 0; i < availableSkills.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const skillX = startX + col * columnWidth;
      const skillY = startY + row * (skillHeight + skillSpacing);
      
      const skill = availableSkills[i];
      
      // Check if click is within skill bounds
      if (x >= skillX && x <= skillX + skillWidth && y >= skillY && y <= skillY + skillHeight) {
        // Check if skill is unlocked by level
        if (this.character.level < skill.unlockLevel) {
          return; // Skip locked skills
        }
        
        // Button coordinates
        const buttonWidth = 80;
        const buttonHeight = 28;
        const buttonX = skillX + skillWidth - buttonWidth - 10;
        const buttonY = skillY + skillHeight - buttonHeight - 10;
        
        // Check if button was clicked
        if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
          if (skill.currentLevel > 0) {
            // Upgrade existing skill
            if (skill.canUpgrade()) {
              const upgradeCost = skill.getUpgradeCost();
              if (this.character.gold >= upgradeCost) {
                this.character.gold -= upgradeCost;
                skill.upgrade();
                console.log(`Upgraded ${skill.name} to level ${skill.currentLevel}`);
                
                // Play purchase sound
                this.soundManager.playSound('purchase');
                
                // Update welcome screen info
                if (this.state === 'welcome' || this.state === 'shop') {
                  this.updateWelcomeScreenInfo();
                }
              }
            }
          } else {
            // Buy new skill
            const purchaseCost = skill.costPerLevel;
            if (this.character.gold >= purchaseCost) {
              this.character.gold -= purchaseCost;
              skill.upgrade(); // First upgrade from 0 to 1
              console.log(`Purchased ${skill.name}`);
              
              // Play purchase sound
              this.soundManager.playSound('purchase');
              
              // Update welcome screen info
              if (this.state === 'welcome' || this.state === 'shop') {
                this.updateWelcomeScreenInfo();
              }
            }
          }
        }
        return;
      }
    }
  }
    
    // Handle profile screen clicks
    handleProfileClick(e) {
      const { x, y } = this.getCanvasCoordinates(e);
      
      // Back button dimensions (same as in renderProfileScreen)
      const buttonWidth = 150;
      const buttonHeight = 40;
      const buttonX = this.width / 2 - buttonWidth / 2;
      const buttonY = this.height - 100;
      
      // Check if back button was clicked
      if (x >= buttonX && x <= buttonX + buttonWidth &&
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.state = 'welcome';
        // Hiển thị header khi trở về welcome screen
        this.toggleHeader(true);
        return;
      }
    }

    // Handle reward screen clicks
    handleRewardClick(e) {
      const { x, y } = this.getCanvasCoordinates(e);
      
      // If a chest has already been selected, handle button clicks
      if (this.selectedChest !== null) {
        // Calculate button position to match renderRewardScreen
        const centerY = this.height / 2 - 50;
        const buttonWidth = 150;
        const buttonHeight = 40;
        const buttonY = centerY + 120;
        const restartButtonX = this.width / 2 - buttonWidth - 10;
        const startNewButtonX = this.width / 2 + 10;
        
        // Check if Restart button was clicked
        if (x >= restartButtonX && x <= restartButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
          this.restart();
          return;
        }
        
        // Check if Start New button was clicked
        if (x >= startNewButtonX && x <= startNewButtonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
          this.state = 'welcome';
          this.updateWelcomeScreenInfo();
          // Hiển thị header khi trở về welcome screen
          this.toggleHeader(true);
          return;
        }
      } else {
        // Handle chest selection
        for (const chest of this.chests) {
          if (x >= chest.x && x <= chest.x + chest.width &&
              y >= chest.y && y <= chest.y + chest.height) {
            this.selectChest(chest.id);
            return;
          }
        }
      }
    }
    
    // Handle game over screen clicks
    handleGameOverClick(e) {
      const { x, y } = this.getCanvasCoordinates(e);
      
      // Button dimensions (same as in renderGameOverScreen)
      const buttonWidth = 200;
      const buttonHeight = 40;
      const buttonY = this.height / 2;
      const startButtonX = this.width / 2 - buttonWidth - 10;
      const returnButtonX = this.width / 2 + 10;
      
      // Check if Start New Game button was clicked
      if (x >= startButtonX && x <= startButtonX + buttonWidth &&
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.restart();
        return;
      }
      
      // Check if Return to Welcome button was clicked
      if (x >= returnButtonX && x <= returnButtonX + buttonWidth &&
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.state = 'welcome';
        this.updateWelcomeScreenInfo();
        // Hiển thị header khi trở về welcome screen
        this.toggleHeader(true);
        return;
      }
    }
    
    // Convert mouse event coordinates to canvas coordinates
    getCanvasCoordinates(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      return { x, y };
    }
    
    // The duplicate handleShopClick method has been removed
  
  
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
        
        // Generate reward screen with chests
        this.generateChests();
        this.state = 'reward';
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
    
    // Move the character (this also updates animation direction)
    this.character.move(dx, dy);
    
    // Keep character within MAP bounds (not just screen bounds)
    this.character.x = Math.max(0, Math.min(this.mapWidth - this.character.width, this.character.x));
    this.character.y = Math.max(0, Math.min(this.mapHeight - this.character.height, this.character.y));
    
    // Update character
    this.character.update(deltaTime);
    
    // Update camera to follow the character
    this.updateCamera();
  }
  
  // Update the camera to follow the character
  updateCamera() {
    // Center the camera on the character
    this.camera.x = this.character.x - this.width / 2 + this.character.width / 2;
    this.camera.y = this.character.y - this.height / 2 + this.character.height / 2;
    
    // Keep the camera within map bounds
    this.camera.x = Math.max(0, Math.min(this.mapWidth - this.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.mapHeight - this.height, this.camera.y));
  }
  
  // Convert world coordinates to screen coordinates
  worldToScreen(x, y) {
    return {
      x: x - this.camera.x,
      y: y - this.camera.y
    };
  }
  
  updateMonsters(deltaTime) {
    // Limit the number of monsters for performance
    const maxMonsters = 75;
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
      
      // Determine spawn position (outside the viewport but within the map)
      let side = Math.floor(Math.random() * 4);
      let x, y;
      const buffer = 50; // Buffer distance from viewport edge
      
      switch (side) {
        case 0: // top
          x = this.camera.x + Math.random() * this.width;
          y = this.camera.y - buffer - Math.random() * 200; // Spawn above viewport
          break;
        case 1: // right
          x = this.camera.x + this.width + buffer + Math.random() * 200; // Spawn to right of viewport
          y = this.camera.y + Math.random() * this.height;
          break;
        case 2: // bottom
          x = this.camera.x + Math.random() * this.width;
          y = this.camera.y + this.height + buffer + Math.random() * 200; // Spawn below viewport
          break;
        case 3: // left
          x = this.camera.x - buffer - Math.random() * 200; // Spawn to left of viewport
          y = this.camera.y + Math.random() * this.height;
          break;
      }
      
      // Ensure spawn position is within map bounds
      x = Math.max(0, Math.min(this.mapWidth - 30, x));
      y = Math.max(0, Math.min(this.mapHeight - 30, y));
      
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
      
      const monster = new Monster(x, y, type, monsterDifficulty);
      monster.game = this; // Set game reference
      this.monsters.push(monster);
      
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
    
    // Chance to drop blood
    if (Math.random() < 0.3) {
      this.resources.push(new Resource(x - 20, y, 'blood'));
    }
    
    // Chance to drop health (lower chance)
    if (Math.random() < 0.2) {
      this.resources.push(new Resource(x, y + 20, 'health'));
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
      
      // If bullet didn't hit anything and is off the map (not just viewport), remove it
      if (!hit && (
        bullet.x < -100 || bullet.x > this.mapWidth + 100 || 
        bullet.y < -100 || bullet.y > this.mapHeight + 100
      )) {
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
          case 'blood':
            // For now, we'll add blood to gold since there's no separate blood resource system
            this.character.gold += collected.value;
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
    // Calculate center points
    const entityCenterX = entity.x + entity.width / 2;
    const entityCenterY = entity.y + entity.height / 2;
    const bulletCenterX = bullet.x; // Bullet positions are already centered
    const bulletCenterY = bullet.y;
    
    // Calculate distance between centers
    const dx = entityCenterX - bulletCenterX;
    const dy = entityCenterY - bulletCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate collision radius (average of entity and bullet dimensions)
    const collisionRadius = (entity.width + entity.height + bullet.width + bullet.height) / 4;
    
    // Return true if distance is less than collision radius (with a slight adjustment factor)
    return distance < collisionRadius * 0.5;
  }
  
  // Check if an entity is within the viewport
  isInView(entity) {
    const buffer = 100; // Render entities slightly outside viewport
    return entity.x + entity.width > this.camera.x - buffer &&
           entity.x < this.camera.x + this.width + buffer &&
           entity.y + entity.height > this.camera.y - buffer &&
           entity.y < this.camera.y + this.height + buffer;
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw background grid
    this.renderBackground();
    
    // Save context before applying camera translation
    this.ctx.save();
    
    // Render resources (only those within viewport)
    for (const resource of this.resources) {
      if (this.isInView(resource)) {
        const screenPos = this.worldToScreen(resource.x, resource.y);
        resource.render(this.ctx, screenPos.x, screenPos.y);
      }
    }
    
    // Render monsters (only those within viewport)
    for (const monster of this.monsters) {
      if (this.isInView(monster)) {
        const screenPos = this.worldToScreen(monster.x, monster.y);
        monster.render(this.ctx, screenPos.x, screenPos.y);
      }
    }
    
    // Render character (adjusted for camera)
    const characterScreenPos = this.worldToScreen(this.character.x, this.character.y);
    this.character.render(this.ctx, characterScreenPos.x, characterScreenPos.y);
    
    // Restore context after world rendering
    this.ctx.restore();
    
    // Render effects
    this.renderAttackEffects();
    this.renderDeathEffects();
    this.renderCollectionEffects();
    this.renderLevelUpEffects();
    this.renderHealingEffects();
    
    // Render minimap
    this.renderMinimap();
    
    // Render UI
    this.renderUI();
  }
  
  // Add a method to render background grid
  renderBackground() {
    const gridSize = 100;
    const gridColor = 'rgba(80, 80, 80, 0.1)';
    
    // Calculate the visible grid cells
    const startX = Math.floor(this.camera.x / gridSize) * gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize;
    const endX = startX + this.width + gridSize;
    const endY = startY + this.height + gridSize;
    
    // Draw vertical lines
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;
    for (let x = startX; x <= endX; x += gridSize) {
      const screenX = x - this.camera.x;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.height);
      this.ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      const screenY = y - this.camera.y;
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.width, screenY);
      this.ctx.stroke();
    }
  }
  
  // Render minimap in the bottom right corner
  renderMinimap() {
    const minimapSize = 150; // Size of the minimap
    const minimapX = this.width - minimapSize - 10; // Position X (bottom right)
    const minimapY = this.height - minimapSize - 10; // Position Y (bottom right)
    const scale = minimapSize / this.mapWidth; // Scale factor for the minimap
    
    // Draw minimap background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    
    // Draw minimap border
    this.ctx.strokeStyle = '#555';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
    
    // Draw character on minimap (white dot)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(
      minimapX + this.character.x * scale,
      minimapY + this.character.y * scale,
      3, // Size of character dot
      0, Math.PI * 2
    );
    this.ctx.fill();
    
    // Draw monsters on minimap (red dots)
    this.ctx.fillStyle = '#e74c3c';
    for (const monster of this.monsters) {
      this.ctx.beginPath();
      this.ctx.arc(
        minimapX + monster.x * scale,
        minimapY + monster.y * scale,
        2, // Size of monster dots (smaller than character)
        0, Math.PI * 2
      );
      this.ctx.fill();
    }
    
    // Draw viewport rectangle
    this.ctx.strokeStyle = '#2ecc71';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      minimapX + this.camera.x * scale,
      minimapY + this.camera.y * scale,
      this.width * scale,
      this.height * scale
    );
  }
  
  renderUI() {
    // Username screen
    if (this.state === 'username') {
      // Hide canvas and welcome screen, show username screen
      document.getElementById('gameCanvas').style.display = 'none';
      document.getElementById('welcomeScreen').style.display = 'none';
      document.getElementById('usernameScreen').style.display = 'block';
      return;
    }
    
    // Welcome screen
    if (this.state === 'welcome') {
      // Hide canvas and username screen, show welcome screen
      document.getElementById('gameCanvas').style.display = 'none';
      document.getElementById('usernameScreen').style.display = 'none';
      document.getElementById('welcomeScreen').style.display = 'block';
      
      // Update character info
      this.updateWelcomeScreenInfo();
      return;
    } else {
      // Show canvas and hide other screens
      document.getElementById('gameCanvas').style.display = 'block';
      document.getElementById('welcomeScreen').style.display = 'none';
      document.getElementById('usernameScreen').style.display = 'none';
    }
    
    // Profile screen
    if (this.state === 'profile') {
      this.renderProfileScreen();
      return;
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
      this.ctx.fillText('Game Over', this.width / 2, this.height / 2 - 80);
      this.ctx.font = '20px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 - 40);
      
      // Draw buttons
      const buttonWidth = 200;
      const buttonHeight = 40;
      const buttonY = this.height / 2;
      const startButtonX = this.width / 2 - buttonWidth - 10;
      const returnButtonX = this.width / 2 + 10;
      
      // Start New Game button
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillRect(startButtonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(startButtonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.font = '16px Arial';
      this.ctx.fillText('Start New Game', this.width / 2 - buttonWidth/2 - 10, buttonY + buttonHeight/2 + 5);
      
      // Return to Welcome button
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillRect(returnButtonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(returnButtonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.font = '16px Arial';
      this.ctx.fillText('Return to Welcome', this.width / 2 + buttonWidth/2 + 10, buttonY + buttonHeight/2 + 5);
      
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
    
    // Reward screen
    if (this.state === 'reward') {
      this.renderRewardScreen();
    }
  }
  
  // Handle username submission
  handleUsernameSubmit() {
    const usernameInput = document.getElementById('usernameInput');
    const errorElement = document.getElementById('usernameError');
    
    if (usernameInput && errorElement) {
      const username = usernameInput.value;
      
      // Validate username
      if (!username || username.trim().length === 0) {
        errorElement.textContent = 'Please enter a name for your warrior';
        return;
      }
      
      if (username.trim().length < 3) {
        errorElement.textContent = 'Name must be at least 3 characters';
        return;
      }
      
      // Save username and change to welcome screen
      localStorage.setItem('endlessSurvivalUsername', username.trim());
      this.username = username.trim();
      this.state = 'welcome';
      
      // Update welcome screen with username
      this.updateWelcomeScreenInfo();
      
      // Hiển thị header khi chuyển đến welcome screen
      this.toggleHeader(true);
    }
  }
  
  // Thêm phương thức mới để ẩn/hiện header
  toggleHeader(show) {
    const header = document.querySelector('header');
    if (header) {
      header.style.display = show ? 'flex' : 'none';
    }
  }
  
  renderProfileScreen() {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Title
    this.ctx.fillStyle = 'white';
    this.ctx.font = '40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Character Profile', this.width / 2, 60);
    
    // Player name and level
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`${this.username} - Level ${this.character.level} Warrior`, this.width / 2, 100);
    
    // Define column positions
    const leftColumnX = 100;
    const rightColumnX = this.width / 2 + 50;
    const sectionSpacing = 30;
    
    // Character information (left column)
    const characterY = 150;
    
    // Draw character image
    const cacheKey = 'character';
    
    // Check if we have a cached result for this image
    if (this.imageCache.has(cacheKey)) {
      const cachedImage = this.imageCache.get(cacheKey);
      // If image was successfully loaded, draw it
      if (cachedImage && cachedImage.complete && cachedImage.naturalWidth !== 0) {
        this.ctx.drawImage(cachedImage, leftColumnX, characterY, 64, 64);
      } else {
        // Draw a default box if image failed to load
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(leftColumnX, characterY, 64, 64);
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(leftColumnX, characterY, 64, 64);
      }
    } else {
      // Try to load and draw character image
      const characterImage = new Image();
      characterImage.src = 'assets/character.png';
      
      // When image loads successfully, cache it and draw it
      characterImage.onload = () => {
        this.imageCache.set(cacheKey, characterImage);
        // Redraw the profile screen to show the loaded image
        if (this.state === 'profile') {
          this.renderProfileScreen();
        }
      };
      
      // When image fails to load, cache the failure
      characterImage.onerror = () => {
        this.imageCache.set(cacheKey, null);
        // Draw a default box if image failed to load
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(leftColumnX, characterY, 64, 64);
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(leftColumnX, characterY, 64, 64);
      };
      
      // If image is already loaded (from cache), draw it immediately
      if (characterImage.complete && characterImage.naturalWidth !== 0) {
        this.ctx.drawImage(characterImage, leftColumnX, characterY, 64, 64);
        this.imageCache.set(cacheKey, characterImage);
      } else {
        // Draw a default box while loading
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(leftColumnX, characterY, 64, 64);
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(leftColumnX, characterY, 64, 64);
      }
    }
    
    // Character stats next to the image
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Health: ${Math.floor(this.character.health)}/${this.character.maxHealth}`, leftColumnX + 80, characterY + 20);
    this.ctx.fillText(`Damage: ${this.character.damage}`, leftColumnX + 80, characterY + 50);
    this.ctx.fillText(`Speed: ${this.character.speed.toFixed(2)}`, leftColumnX + 80, characterY + 80);
    
    // Gold and Experience
    this.ctx.fillText(`Gold: ${this.character.gold}`, leftColumnX, characterY + 120);
    this.ctx.fillText(`Experience: ${this.character.experience}/${this.character.experienceToNextLevel}`, leftColumnX, characterY + 150);
    
    // Equipment section (right column)
    const equipmentY = 150;
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Equipment:', rightColumnX, equipmentY);
    
    // List equipment with images
    this.ctx.font = '16px Arial';
    if (this.character.inventory.length === 0) {
      this.ctx.fillText('No equipment purchased yet', rightColumnX, equipmentY + 30);
    } else {
      let equipmentYOffset = equipmentY + 30;
      for (const item of this.character.inventory) {
        // Draw a default box for equipment
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(rightColumnX, equipmentYOffset - 16, 32, 32);
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(rightColumnX, equipmentYOffset - 16, 32, 32);
        
        // Create a cache key for this equipment image
        const cacheKey = `equipment_${item.type}`;
        
        // Check if we have a cached result for this image
        if (this.imageCache.has(cacheKey)) {
          const cachedImage = this.imageCache.get(cacheKey);
          // If image was successfully loaded, draw it
          if (cachedImage && cachedImage.complete && cachedImage.naturalWidth !== 0) {
            this.ctx.drawImage(cachedImage, rightColumnX, equipmentYOffset - 16, 32, 32);
          }
          // If image failed to load, the default box remains visible
        } else {
          // Try to load and draw equipment image
          const equipmentImage = new Image();
          equipmentImage.src = `assets/equipment/${item.type}.png`;
          
          // When image loads successfully, cache it and draw it
          equipmentImage.onload = () => {
            this.imageCache.set(cacheKey, equipmentImage);
            // Redraw the profile screen to show the loaded image
            if (this.state === 'profile') {
              this.renderProfileScreen();
            }
          };
          
          // When image fails to load, cache the failure
          equipmentImage.onerror = () => {
            this.imageCache.set(cacheKey, null);
          };
          
          // If image is already loaded (from cache), draw it immediately
          if (equipmentImage.complete && equipmentImage.naturalWidth !== 0) {
            this.ctx.drawImage(equipmentImage, rightColumnX, equipmentYOffset - 16, 32, 32);
            this.imageCache.set(cacheKey, equipmentImage);
          }
        }
        
        // Draw equipment info next to the image
        this.ctx.fillText(`${item.icon} ${item.name} (Level ${item.level})`, rightColumnX + 40, equipmentYOffset);
        this.ctx.fillText(item.getDescription(), rightColumnX + 40, equipmentYOffset + 15);
        equipmentYOffset += 35;
      }
    }
    
    // Skills section (right column, below equipment)
    const skillsY = equipmentY + 200;
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Skills:', rightColumnX, skillsY);
    
    // List skills with images
    this.ctx.font = '16px Arial';
    const unlockedSkills = this.character.getUnlockedSkills();
    if (unlockedSkills.length === 0) {
      this.ctx.fillText('No skills unlocked yet', rightColumnX, skillsY + 30);
    } else {
      let skillsYOffset = skillsY + 30;
      for (const skill of unlockedSkills) {
        // Draw a default box for skill
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(rightColumnX, skillsYOffset - 16, 32, 32);
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(rightColumnX, skillsYOffset - 16, 32, 32);
        
        // Create a cache key for this skill image
        const cacheKey = `skill_${skill.name.toLowerCase().replace(' ', '_')}`;
        
        // Check if we have a cached result for this image
        if (this.imageCache.has(cacheKey)) {
          const cachedImage = this.imageCache.get(cacheKey);
          // If image was successfully loaded, draw it
          if (cachedImage && cachedImage.complete && cachedImage.naturalWidth !== 0) {
            this.ctx.drawImage(cachedImage, rightColumnX, skillsYOffset - 16, 32, 32);
          }
          // If image failed to load, the default box remains visible
        } else {
          // Try to load and draw skill image
          const skillImage = new Image();
          skillImage.src = `assets/skills/${skill.name.toLowerCase().replace(' ', '_')}.png`;
          
          // When image loads successfully, cache it and draw it
          skillImage.onload = () => {
            this.imageCache.set(cacheKey, skillImage);
            // Redraw the profile screen to show the loaded image
            if (this.state === 'profile') {
              this.renderProfileScreen();
            }
          };
          
          // When image fails to load, cache the failure
          skillImage.onerror = () => {
            this.imageCache.set(cacheKey, null);
          };
          
          // If image is already loaded (from cache), draw it immediately
          if (skillImage.complete && skillImage.naturalWidth !== 0) {
            this.ctx.drawImage(skillImage, rightColumnX, skillsYOffset - 16, 32, 32);
            this.imageCache.set(cacheKey, skillImage);
          }
        }
        
        // Draw skill info next to the image
        this.ctx.fillText(`${skill.name} (Level ${skill.currentLevel}/${skill.levels})`, rightColumnX + 40, skillsYOffset);
        this.ctx.fillText(skill.getDescription(), rightColumnX + 40, skillsYOffset + 15);
        skillsYOffset += 35;
      }
    }
    
    // Back button
    const buttonWidth = 150;
    const buttonHeight = 40;
    const buttonX = this.width / 2 - buttonWidth / 2;
    const buttonY = this.height - 100;
    
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Back', this.width / 2, buttonY + buttonHeight / 2 + 6);
    
    this.ctx.textAlign = 'left';
  }

  renderRewardScreen() {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Title
    this.ctx.fillStyle = 'white';
    this.ctx.font = '40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Level Complete!', this.width / 2, this.height / 4);
    
    // Show rewards received if a chest has been selected
    if (this.selectedChest !== null && this.chestRewards !== null) {
      // Center the rewards display vertically
      const centerY = this.height / 2 - 50;
      
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Rewards Received:', this.width / 2, centerY);
      
      // Display gold reward
      this.ctx.font = '20px Arial';
      this.ctx.fillStyle = '#f1c40f'; // Gold color
      this.ctx.fillText(`Gold: +${this.chestRewards.gold}`, this.width / 2, centerY + 40);
      
      // Display experience reward
      this.ctx.fillStyle = '#9b59b6'; // Purple color for experience
      this.ctx.fillText(`Experience: +${this.chestRewards.exp}`, this.width / 2, centerY + 70);
      
      // Draw buttons in the center
      const buttonWidth = 150;
      const buttonHeight = 40;
      const buttonY = centerY + 120;
      const restartButtonX = this.width / 2 - buttonWidth - 10;
      const startNewButtonX = this.width / 2 + 10;
      
      // Restart button
      this.ctx.fillStyle = '#2ecc71'; // Green color
      this.ctx.fillRect(restartButtonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(restartButtonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.fillStyle = 'white';
      this.ctx.font = '16px Arial';
      this.ctx.fillText('Restart', restartButtonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
      
      // Start New button
      this.ctx.fillStyle = '#3498db'; // Blue color
      this.ctx.fillRect(startNewButtonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(startNewButtonX, buttonY, buttonWidth, buttonHeight);
      this.ctx.fillStyle = 'white';
      this.ctx.font = '16px Arial';
      this.ctx.fillText('Back', startNewButtonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    } else {
      // Show chest selection prompt
      this.ctx.font = '24px Arial';
      this.ctx.fillStyle = 'white';
      this.ctx.fillText('Choose a chest to claim your rewards!', this.width / 2, this.height / 3);
      
      // Draw chests in the center of the screen
      const chestWidth = 100;
      const chestHeight = 80;
      const chestSpacing = 50;
      const totalWidth = 3 * chestWidth + 2 * chestSpacing;
      const startX = (this.width - totalWidth) / 2;
      const startY = this.height / 2 - 50;
      
      for (let i = 0; i < this.chests.length; i++) {
        const chestX = startX + i * (chestWidth + chestSpacing);
        
        // Update chest position
        this.chests[i].x = chestX;
        this.chests[i].y = startY;
        this.chests[i].width = chestWidth;
        this.chests[i].height = chestHeight;
        
        // Chest body
        this.ctx.fillStyle = '#8B4513'; // Brown color for chest
        this.ctx.fillRect(chestX, startY, chestWidth, chestHeight);
        
        // Chest lid
        this.ctx.fillStyle = '#A0522D'; // Darker brown for lid
        this.ctx.fillRect(chestX - 5, startY, chestWidth + 10, 15);
        
        // Chest handle
        this.ctx.fillStyle = '#D2691E'; // Bronze color for handle
        this.ctx.fillRect(chestX + chestWidth / 2 - 10, startY - 10, 20, 10);
        
        // Chest label with ID
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Chest ${i + 1}`, chestX + chestWidth / 2, startY + chestHeight / 2 + 5);
      }
    }
    
    this.ctx.textAlign = 'left';
  }
  
  // Activate a character skill
  activateCharacterSkill(skillName) {
    // Check if the game is in playing state
    if (this.state !== 'playing') return;
    
    // Whirlwind is a passive skill, so don't activate it
    if (skillName === 'Whirlwind') return;
    
    // Try to activate the skill through the character
    const activatedSkill = this.character.activateSkill(skillName);
    
    // If skill was successfully activated, add visual effect
    if (activatedSkill) {
      this.addSkillEffect(
        this.character.x + this.character.width/2,
        this.character.y + this.character.height/2,
        skillName
      );
    }
    
    return activatedSkill;
  }
  
  renderAttackEffects() {
    for (const effect of this.attackEffects) {
      if (effect.startX !== undefined && effect.endX !== undefined) {
        // Line effect (attack) - convert to screen coordinates
        const startPos = this.worldToScreen(effect.startX, effect.startY);
        const endPos = this.worldToScreen(effect.endX, effect.endY);
        
        const alpha = effect.life / effect.maxLife;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startPos.x, startPos.y);
        this.ctx.lineTo(endPos.x, endPos.y);
        this.ctx.stroke();
      } else {
        // Circle effect (hit) - convert to screen coordinates
        const screenPos = this.worldToScreen(effect.x, effect.y);
        
        const alpha = effect.life / effect.maxLife;
        this.ctx.fillStyle = `${effect.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, effect.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
  
  renderDeathEffects() {
    for (const effect of this.deathEffects) {
      // Convert to screen coordinates
      const screenPos = this.worldToScreen(effect.x, effect.y);
      
      const alpha = effect.life / effect.maxLife;
      this.ctx.fillStyle = `rgba(${parseInt(effect.color.slice(1, 3), 16)}, ${parseInt(effect.color.slice(3, 5), 16)}, ${parseInt(effect.color.slice(5, 7), 16)}, ${alpha * 0.7})`;
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, effect.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  renderCollectionEffects() {
    for (const effect of this.collectionEffects) {
      // Convert to screen coordinates
      const screenPos = this.worldToScreen(effect.x, effect.y);
      
      this.ctx.fillStyle = `${effect.color}${Math.floor(effect.alpha * 255).toString(16).padStart(2, '0')}`;
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, effect.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  renderLevelUpEffects() {
    for (const effect of this.levelUpEffects) {
      // Convert to screen coordinates
      const screenPos = this.worldToScreen(effect.x, effect.y);
      
      this.ctx.fillStyle = `rgba(241, 196, 15, ${effect.alpha})`; // Gold color with alpha
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, effect.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add star shape for level up effect
      this.ctx.fillStyle = `rgba(255, 255, 255, ${effect.alpha * 0.8})`;
      this.drawStar(screenPos.x, screenPos.y, 5, effect.size * 0.8, effect.size * 0.4);
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
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SHOP', this.width / 2, 60);
    
    // Player gold
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.fillText(`Gold: ${this.character.gold}`, this.width / 2, 100);
    
    // Shop tabs
    const tabWidth = 150;
    const tabHeight = 40;
    const tabY = 120;
    const equipmentTabX = (this.width / 2) - tabWidth - 10;
    const skillsTabX = (this.width / 2) + 10;
    
    // Equipment tab
    this.ctx.fillStyle = this.shopTab === 'equipment' ? '#3498db' : '#2c3e50';
    this.ctx.fillRect(equipmentTabX, tabY, tabWidth, tabHeight);
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(equipmentTabX, tabY, tabWidth, tabHeight);
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('Equipment', equipmentTabX + tabWidth / 2, tabY + tabHeight / 2 + 7);
    
    // Skills tab
    this.ctx.fillStyle = this.shopTab === 'skills' ? '#9b59b6' : '#2c3e50';
    this.ctx.fillRect(skillsTabX, tabY, tabWidth, tabHeight);
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(skillsTabX, tabY, tabWidth, tabHeight);
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('Skills', skillsTabX + tabWidth / 2, tabY + tabHeight / 2 + 7);
    
    // Content area with scroll support
    const contentAreaY = tabY + tabHeight + 20;
    const contentAreaHeight = this.height - contentAreaY - 120; // Leave space for back button
    
    // Set clipping region for scrollable content
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(20, contentAreaY, this.width - 40, contentAreaHeight);
    this.ctx.clip();
    
    // Apply scroll offset
    const scrollOffset = this.shopScrollOffset || 0;
    this.ctx.translate(0, -scrollOffset);
    
    // Render appropriate content based on selected tab
    if (this.shopTab === 'skills') {
      this.renderShopSkills(contentAreaY, contentAreaHeight);
    } else {
      this.renderShopEquipment(contentAreaY, contentAreaHeight);
    }
    
    // Restore context (remove clipping and translation)
    this.ctx.restore();
    
    // Scrollbar (if needed)
    const contentHeight = this.shopTab === 'skills' ? 
      Math.ceil(this.character.getAvailableSkills().length / 2) * 120 : 
      Math.ceil(4 / 2) * 120; // Height of items with spacing
    
    if (contentHeight > contentAreaHeight) {
      const scrollbarHeight = (contentAreaHeight / contentHeight) * contentAreaHeight;
      const scrollbarY = contentAreaY + (scrollOffset / contentHeight) * contentAreaHeight;
      
      // Draw scrollbar track
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.fillRect(this.width - 15, contentAreaY, 10, contentAreaHeight);
      
      // Draw scrollbar thumb
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillRect(this.width - 15, scrollbarY, 10, scrollbarHeight);
    }
    
    // Back button
    const buttonWidth = 150;
    const buttonHeight = 40;
    const buttonX = this.width / 2 - buttonWidth / 2;
    const buttonY = this.height - 70;
    
    // Draw back button
    this.ctx.fillStyle = '#f1c40f'; // Yellow color for back button
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    this.ctx.fillStyle = '#2c3e50'; // Dark color for text
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Back', this.width / 2, buttonY + buttonHeight / 2 + 6);
    
    // Bottom instructions
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('Use mouse wheel to scroll', this.width / 2, this.height - 20);
    this.ctx.fillText('Press 1 for Equipment, 2 for Skills', this.width / 2, this.height - 40);
  }
  
  // New method to render equipment items
  renderShopEquipment(startY, maxHeight) {
    const equipmentTypes = ['sword', 'shield', 'boots', 'amulet'];
    const itemWidth = 350;
    const itemHeight = 100;
    const itemSpacing = 20;
    const columns = 2;
    const columnWidth = itemWidth + itemSpacing;
    const startX = (this.width - (columns * columnWidth - itemSpacing)) / 2;
    
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    
    for (let i = 0; i < equipmentTypes.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = startX + col * columnWidth;
      const y = startY + row * (itemHeight + itemSpacing);
      
      // Item background
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(x, y, itemWidth, itemHeight);
      
      // Item border
      this.ctx.strokeStyle = '#34495e';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, itemWidth, itemHeight);
      
      // Check if player already has this type of equipment
      const existingEquipment = this.character.inventory.find(item => item.type === equipmentTypes[i]);
      
      // Left side: equipment icon
      try {
        const equipIcon = ImageCache.getImage(`assets/equipment/${equipmentTypes[i]}.png`);
        if (equipIcon && equipIcon.complete && equipIcon.naturalWidth !== 0) {
          this.ctx.drawImage(equipIcon, x + 10, y + 10, 50, 50);
        } else {
          // Fallback icon
          this.ctx.fillStyle = '#3498db';
          this.ctx.fillRect(x + 10, y + 10, 50, 50);
        }
      } catch (e) {
        // Fallback icon
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(x + 10, y + 10, 50, 50);
      }
      
      // Right side: equipment details
      if (existingEquipment) {
        // Equipment name and level
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`${existingEquipment.name} (Lvl ${existingEquipment.level})`, x + 70, y + 25);
        
        // Equipment description
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.fillText(existingEquipment.getDescription(), x + 70, y + 50);
        
        // Upgrade button or MAX level indicator
        if (existingEquipment.level < 10) { // Assuming max level is 10
          // Upgrade cost
          const upgradeCost = existingEquipment.getUpgradeCost();
          this.ctx.fillStyle = '#bdc3c7';
          this.ctx.fillText(`Upgrade: ${upgradeCost} gold`, x + 70, y + 75);
          
          // Upgrade button
          const buttonWidth = 80;
          const buttonHeight = 28;
          const buttonX = x + itemWidth - buttonWidth - 10;
          const buttonY = y + itemHeight - buttonHeight - 10;
          
          // Draw button background
          if (this.character.gold >= upgradeCost) {
            this.ctx.fillStyle = '#27ae60'; // Green if can afford
          } else {
            this.ctx.fillStyle = '#7f8c8d'; // Gray if cannot afford
          }
          
          this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
          
          // Button text
          this.ctx.fillStyle = 'white';
          this.ctx.font = 'bold 14px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('UPGRADE', buttonX + buttonWidth/2, buttonY + buttonHeight/2 + 5);
          this.ctx.textAlign = 'left';
        } else {
          // MAX level indicator
          this.ctx.fillStyle = '#f39c12';
          this.ctx.font = 'bold 16px Arial';
          this.ctx.fillText('MAX LEVEL', x + itemWidth - 100, y + 75);
        }
      } else {
        // Show purchase info for new equipment
        const equipment = new Equipment(equipmentTypes[i], 1);
        
        // Equipment name
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(equipment.name, x + 70, y + 25);
        
        // Equipment description
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.fillText(equipment.getDescription(), x + 70, y + 50);
        
        // Purchase cost
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.fillText(`Cost: ${equipment.cost} gold`, x + 70, y + 75);
        
        // Buy button
        const buttonWidth = 80;
        const buttonHeight = 28;
        const buttonX = x + itemWidth - buttonWidth - 10;
        const buttonY = y + itemHeight - buttonHeight - 10;
        
        // Draw button background
        if (this.character.gold >= equipment.cost) {
          this.ctx.fillStyle = '#27ae60'; // Green if can afford
        } else {
          this.ctx.fillStyle = '#7f8c8d'; // Gray if cannot afford
        }
        
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BUY', buttonX + buttonWidth/2, buttonY + buttonHeight/2 + 5);
        this.ctx.textAlign = 'left';
      }
    }
  }

  // New method to render skill items
  renderShopSkills(startY, maxHeight) {
    const availableSkills = this.character.getAvailableSkills();
    const skillWidth = 350;
    const skillHeight = 100;
    const skillSpacing = 20;
    const columns = 2;
    const columnWidth = skillWidth + skillSpacing;
    const startX = (this.width - (columns * columnWidth - skillSpacing)) / 2;
    
    this.ctx.textAlign = 'left';
    
    for (let i = 0; i < availableSkills.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = startX + col * columnWidth;
      const y = startY + row * (skillHeight + skillSpacing);
      
      const skill = availableSkills[i];
      
      // Skill background
      this.ctx.fillStyle = '#2c3e50';
      this.ctx.fillRect(x, y, skillWidth, skillHeight);
      
      // Skill border
      this.ctx.strokeStyle = '#34495e';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, skillWidth, skillHeight);
      
      // Left side: Skill icon
      const cacheKey = `skill_${skill.name.toLowerCase().replace(' ', '_')}`;
      try {
        // Try to get image from cache or load it
        let skillImage;
        if (this.imageCache && this.imageCache.has(cacheKey)) {
          skillImage = this.imageCache.get(cacheKey);
        } else {
          skillImage = ImageCache.getImage(`assets/skills/${skill.name.toLowerCase().replace(' ', '_')}.png`);
        }
        
        if (skillImage && skillImage.complete && skillImage.naturalWidth !== 0) {
          this.ctx.drawImage(skillImage, x + 10, y + 10, 50, 50);
        } else {
          // Fallback icon
          this.ctx.fillStyle = '#9b59b6';
          this.ctx.fillRect(x + 10, y + 10, 50, 50);
        }
      } catch (e) {
        // Fallback icon
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.fillRect(x + 10, y + 10, 50, 50);
      }
      
      // Right side: Skill details
      // Skill name and level
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.fillText(`${skill.name} (Lvl ${skill.currentLevel}/${skill.levels})`, x + 70, y + 25);
      
      // Skill description
      this.ctx.font = '14px Arial';
      this.ctx.fillStyle = '#bdc3c7';
      this.ctx.fillText(skill.getDescription(), x + 70, y + 50);
      
      // Check if player level meets requirement
      if (this.character.level < skill.unlockLevel) {
        // Locked skill
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`Unlocks at Level ${skill.unlockLevel}`, x + 70, y + 75);
        
        // Add lock icon overlay
        this.ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
        this.ctx.fillRect(x, y, skillWidth, skillHeight);
        
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LOCKED', x + skillWidth/2, y + skillHeight/2 + 8);
        this.ctx.textAlign = 'left';
      } 
      // Can upgrade or max level
      else if (skill.currentLevel > 0) {
        if (skill.canUpgrade()) {
          // Upgrade cost
          const upgradeCost = skill.getUpgradeCost();
          this.ctx.fillStyle = '#bdc3c7';
          this.ctx.fillText(`Upgrade: ${upgradeCost} gold`, x + 70, y + 75);
          
          // Upgrade button
          const buttonWidth = 80;
          const buttonHeight = 28;
          const buttonX = x + skillWidth - buttonWidth - 10;
          const buttonY = y + skillHeight - buttonHeight - 10;
          
          // Draw button background
          if (this.character.gold >= upgradeCost) {
            this.ctx.fillStyle = '#27ae60'; // Green if can afford
          } else {
            this.ctx.fillStyle = '#7f8c8d'; // Gray if cannot afford
          }
          
          this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
          
          // Button text
          this.ctx.fillStyle = 'white';
          this.ctx.font = 'bold 14px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('UPGRADE', buttonX + buttonWidth/2, buttonY + buttonHeight/2 + 5);
          this.ctx.textAlign = 'left';
        } else {
          // MAX level indicator
          this.ctx.fillStyle = '#f39c12';
          this.ctx.font = 'bold 16px Arial';
          this.ctx.fillText('MAX LEVEL', x + skillWidth - 100, y + 75);
        }
      } 
      // Can purchase for the first time
      else {
        // Purchase cost
        const purchaseCost = skill.costPerLevel;
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.fillText(`Cost: ${purchaseCost} gold`, x + 70, y + 75);
        
        // Buy button
        const buttonWidth = 80;
        const buttonHeight = 28;
        const buttonX = x + skillWidth - buttonWidth - 10;
        const buttonY = y + skillHeight - buttonHeight - 10;
        
        // Draw button background
        if (this.character.gold >= purchaseCost) {
          this.ctx.fillStyle = '#27ae60'; // Green if can afford
        } else {
          this.ctx.fillStyle = '#7f8c8d'; // Gray if cannot afford
        }
        
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button text
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BUY', buttonX + buttonWidth/2, buttonY + buttonHeight/2 + 5);
        this.ctx.textAlign = 'left';
      }
    }
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
    // Restart the game with current character equipment and stats
    this.state = 'playing';
    this.score = 0;
    this.gameTime = 0;
    // Reset log information board statistics
    this.monstersDestroyed = 0;
    this.totalDamageCaused = 0;
    this.damageReceived = 0;
    this.totalHealthRecovered = 0;
    this.combatLog = []; // Reset combat log
    // Reset character position and health
    this.character.x = this.width / 2;
    this.character.y = this.height / 2;
    this.character.health = this.character.maxHealth;
    // Clear monsters and resources
    this.monsters = [];
    this.resources = [];
    this.attackEffects = [];
    this.deathEffects = [];
    this.collectionEffects = [];
    this.levelUpEffects = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1000;
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
  
  generateChests() {
    // Reset chest selection
    this.selectedChest = null;
    this.chestRewards = null;
    
    // Generate 3 chests with random rewards
    this.chests = [];
    for (let i = 0; i < 3; i++) {
      // Generate random gold reward (10-50 gold)
      const goldReward = Math.floor(Math.random() * 41) + 10;
      
      // Generate random experience reward (20-100 exp)
      const expReward = Math.floor(Math.random() * 81) + 20;
      
      this.chests.push({
        id: i,
        gold: goldReward,
        exp: expReward,
        x: this.width / 2 - 150 + i * 150, // Position chests horizontally
        y: this.height / 2 - 50,
        width: 100,
        height: 80,
        opened: false
      });
    }
  }
  
  selectChest(chestId) {
    // If a chest is already selected, do nothing
    if (this.selectedChest !== null) return;
    
    // Find the selected chest
    const chest = this.chests.find(c => c.id === chestId);
    if (!chest) return;
    
    // Mark chest as selected and opened
    this.selectedChest = chestId;
    chest.opened = true;
    
    // Apply rewards to character
    this.character.gold += chest.gold;
    this.character.addExperience(chest.exp);
    
    // Store rewards for display
    this.chestRewards = {
      gold: chest.gold,
      exp: chest.exp
    };
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
      
      // Create a cache key for this skill image
      const cacheKey = `skill_${skill.name.toLowerCase().replace(' ', '_')}`;
      
      // Check if we have a cached result for this image
      if (this.imageCache.has(cacheKey)) {
        const cachedImage = this.imageCache.get(cacheKey);
        // If image was successfully loaded, draw it
        if (cachedImage && cachedImage.complete && cachedImage.naturalWidth !== 0) {
          this.ctx.drawImage(cachedImage, boxX, boxY, skillBoxSize, skillBoxSize);
        }
        // If image failed to load, draw text as fallback
      } else {
        // Try to load and draw skill image
        const skillImage = new Image();
        skillImage.src = `assets/skills/${skill.name.toLowerCase().replace(' ', '_')}.png`;
        
        // When image loads successfully, cache it and draw it
        skillImage.onload = () => {
          this.imageCache.set(cacheKey, skillImage);
          // Redraw the UI to show the loaded image
          if (this.state === 'playing') {
            // We'll trigger a redraw by updating a dummy property
            // This is a simple way to trigger a redraw without complex logic
          }
        };
        
        // When image fails to load, cache the failure
        skillImage.onerror = () => {
          this.imageCache.set(cacheKey, null);
        };
        
        // If image is already loaded (from cache), draw it immediately
        if (skillImage.complete && skillImage.naturalWidth !== 0) {
          this.ctx.drawImage(skillImage, boxX, boxY, skillBoxSize, skillBoxSize);
          this.imageCache.set(cacheKey, skillImage);
        }
      }
      
      // Draw skill name (abbreviated) - only if image failed to load
      if (!this.imageCache.has(cacheKey) || !this.imageCache.get(cacheKey) ||
          !this.imageCache.get(cacheKey).complete || this.imageCache.get(cacheKey).naturalWidth === 0) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        let skillName = skill.name;
        if (skillName.length > 8) {
          skillName = skillName.substring(0, 8) + '...';
        }
        this.ctx.fillText(skillName, boxX + 5, boxY + 15);
        
        // Draw skill level
        this.ctx.fillText(`Lvl: ${skill.currentLevel}`, boxX + 5, boxY + 30);
      }
      
      // Draw cooldown timer if skill is on cooldown
      if (skill.cooldown > 0) {
        // Dark overlay to indicate cooldown
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(boxX, boxY, skillBoxSize, skillBoxSize);
        
        // Cooldown time in seconds (rounded up to show full seconds)
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
    // Add username to welcome screen title if available
    const gameTitle = document.querySelector('.game-title');
    if (gameTitle && this.username) {
      gameTitle.textContent = `ENDLESS SURVIVAL - ${this.username}`;
    }
    
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
  

}

export default Game;