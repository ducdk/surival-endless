# Character Skills System Plan

## Overview
This document outlines the implementation of a character skills system for the Endless Survival game. The skills system will add depth to gameplay by providing players with special abilities that can be unlocked and upgraded as they progress.

## Skill Categories
1. **Combat Skills** - Enhance damage output and combat effectiveness
2. **Survival Skills** - Improve health, defense, and resource management
3. **Movement Skills** - Enhance mobility and positioning
4. **Utility Skills** - Special abilities that provide unique advantages

## Detailed Skill Descriptions

### Combat Skills

#### 1. Critical Strike
- **Type**: Passive
- **Effect**: Chance to deal increased damage on attacks
- **Levels**: 5 levels (5% to 25% chance, 2x to 3x damage multiplier)
- **Unlock**: Level 3
- **Upgrade Cost**: 100 gold per level

#### 2. Whirlwind
- **Type**: Active (Cooldown: 15 seconds)
- **Effect**: Spin around dealing damage to nearby enemies
- **Levels**: 5 levels (50% to 150% weapon damage, 1s to 3s duration)
- **Unlock**: Level 5
- **Upgrade Cost**: 150 gold per level

#### 3. Power Attack
- **Type**: Active (Cooldown: 10 seconds)
- **Effect**: Next attack deals increased damage
- **Levels**: 5 levels (150% to 300% weapon damage)
- **Unlock**: Level 7
- **Upgrade Cost**: 120 gold per level

### Survival Skills

#### 4. Health Regeneration
- **Type**: Passive
- **Effect**: Regenerate health over time
- **Levels**: 5 levels (1% to 5% max health per second)
- **Unlock**: Level 4
- **Upgrade Cost**: 100 gold per level

#### 5. Damage Reduction
- **Type**: Passive
- **Effect**: Reduce incoming damage
- **Levels**: 5 levels (2% to 10% damage reduction)
- **Unlock**: Level 6
- **Upgrade Cost**: 150 gold per level

#### 6. Second Wind
- **Type**: Active (Cooldown: 60 seconds)
- **Effect**: Instantly heal when health drops below 20%
- **Levels**: 3 levels (30% to 50% health restored)
- **Unlock**: Level 8
- **Upgrade Cost**: 200 gold per level

### Movement Skills

#### 7. Dash
- **Type**: Active (Cooldown: 8 seconds)
- **Effect**: Quickly move in a direction
- **Levels**: 3 levels (2x to 4x speed boost)
- **Unlock**: Level 5
- **Upgrade Cost**: 120 gold per level

#### 8. Evasion
- **Type**: Passive
- **Effect**: Chance to avoid incoming attacks
- **Levels**: 5 levels (5% to 25% dodge chance)
- **Unlock**: Level 7
- **Upgrade Cost**: 150 gold per level

### Utility Skills

#### 9. Gold Finder
- **Type**: Passive
- **Effect**: Increase gold dropped by enemies
- **Levels**: 5 levels (5% to 25% increased gold)
- **Unlock**: Level 4
- **Upgrade Cost**: 100 gold per level

#### 10. Experience Boost
- **Type**: Passive
- **Effect**: Increase experience gained from enemies
- **Levels**: 5 levels (10% to 50% increased experience)
- **Unlock**: Level 6
- **Upgrade Cost**: 120 gold per level

#### 11. Resource Magnet
- **Type**: Passive
- **Effect**: Increase pickup range for resources
- **Levels**: 3 levels (20% to 60% increased pickup range)
- **Unlock**: Level 9
- **Upgrade Cost**: 180 gold per level

## Implementation Plan

### 1. Data Structure
- Create a Skill class to represent individual skills
- Add a skills array to the Character class
- Implement skill levels and progression system

### 2. UI Integration
- Add a skills screen accessible from the shop
- Display available skills with descriptions and costs
- Show skill levels and upgrade options

### 3. Game Logic
- Implement skill activation for active skills
- Add skill effects to combat and resource collection systems
- Handle cooldown management for active skills

### 4. Balancing
- Test skill effectiveness and adjust values as needed
- Ensure skills provide meaningful choices without being overpowered
- Balance gold costs to match progression pace

## Technical Considerations

### Skill Storage
Skills will be stored in the character's data structure and saved to localStorage along with other character data.

### Skill Activation
Active skills will be activated through key presses (similar to how the shop is accessed with 'P').

### Visual Feedback
- Add visual effects for skill activation
- Display cooldown indicators on UI
- Show skill effects in-game (e.g., whirlwind animation)

## Progression Integration
Skills will be unlocked as the character levels up, providing additional choices for character development beyond basic attribute increases.