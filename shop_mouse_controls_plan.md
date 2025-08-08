# Shop Mouse Controls Implementation Plan

## Overview
This plan outlines the implementation of mouse-based controls for the shop system in the Endless Survival game. Currently, players must use keyboard keys (1-4 for equipment, 5-9 for skills) to purchase items in the shop. This update will allow players to click directly on items to purchase them.

## Current Implementation Analysis

### Shop Rendering (`renderShop` method)
The shop currently renders:
1. Equipment items in a horizontal row at the top
2. Skill items in a grid below the equipment
3. Each item has:
   - Background rectangle
   - Border
   - Icon and name
   - Description
   - Cost information
   - Purchase instructions (e.g., "Press 1 to buy")

### Purchase Handling (`keydown` event listener)
The current keyboard-based purchase system:
- Keys 1-4 map to equipment items (indices 0-3)
- Keys 5-9 map to skill items (indices 0-4, offset by 5)
- Calls `purchaseEquipment(index)` or `purchaseSkill(index)` methods

## Implementation Plan

### 1. Add Mouse Event Listeners
Add mouse click event listeners to detect when players click on shop items:
- Add `mousedown` or `click` event listener to the canvas
- Implement coordinate checking to determine which item was clicked

### 2. Modify Shop Rendering for Mouse Interaction
Update the shop rendering to:
- Store item position and dimensions for hit detection
- Add visual feedback for hover states (optional enhancement)
- Maintain existing visual design while enabling mouse interaction

### 3. Implement Click Detection Logic
Create functions to:
- Convert mouse coordinates to canvas coordinates
- Determine which equipment or skill item was clicked
- Call appropriate purchase methods based on click location

### 4. Update UI Instructions
Modify the shop UI to:
- Remove or update "Press number key to purchase item" instruction
- Add "Click items to purchase" instruction
- Optionally add visual indicators on items (e.g., highlight on hover)

## Detailed Implementation Steps

### Step 1: Add Mouse Event Listener
```javascript
// In setupEventListeners method
this.canvas.addEventListener('click', (e) => {
  if (this.state === 'shop') {
    this.handleShopClick(e);
  }
});
```

### Step 2: Implement Coordinate Conversion
```javascript
// Convert mouse event coordinates to canvas coordinates
getCanvasCoordinates(e) {
  const rect = this.canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
  return { x, y };
}
```

### Step 3: Implement Click Handling
```javascript
handleShopClick(e) {
  const { x, y } = this.getCanvasCoordinates(e);
  
  // Check equipment items
  const equipmentResult = this.checkEquipmentClick(x, y);
  if (equipmentResult !== null) {
    this.purchaseEquipment(equipmentResult);
    return;
  }
  
  // Check skill items
  const skillResult = this.checkSkillClick(x, y);
  if (skillResult !== null) {
    this.purchaseSkill(skillResult);
    return;
  }
}
```

### Step 4: Implement Hit Detection
```javascript
checkEquipmentClick(x, y) {
  // Equipment items are rendered at:
  // startX + i * (itemWidth + itemSpacing), startY
  // Width: itemWidth, Height: itemHeight
  
  const equipmentTypes = ['sword', 'shield', 'boots', 'amulet'];
  const itemWidth = 150;
  const itemHeight = 100;
  const itemSpacing = 20;
  const startX = (this.width - (equipmentTypes.length * itemWidth + (equipmentTypes.length - 1) * itemSpacing)) / 2;
  const startY = 180;
  
  for (let i = 0; i < equipmentTypes.length; i++) {
    const itemX = startX + i * (itemWidth + itemSpacing);
    const itemY = startY;
    
    if (x >= itemX && x <= itemX + itemWidth && 
        y >= itemY && y <= itemY + itemHeight) {
      return i;
    }
  }
  
  return null;
}

checkSkillClick(x, y) {
  // Skill items are rendered at:
  // skillStartX + (i % 3) * (skillWidth + skillSpacing), 
  // skillStartY + Math.floor(i / 3) * (skillHeight + skillSpacing)
  
  const availableSkills = this.character.getAvailableSkills();
  const skillWidth = 200;
  const skillHeight = 80;
  const skillSpacing = 15;
  const skillStartX = (this.width - (Math.min(3, availableSkills.length) * skillWidth + (Math.min(3, availableSkills.length) - 1) * skillSpacing)) / 2;
  const skillStartY = 180 + 100 + 50; // startY + itemHeight + 50
  
  for (let i = 0; i < availableSkills.length; i++) {
    const itemX = skillStartX + (i % 3) * (skillWidth + skillSpacing);
    const itemY = skillStartY + Math.floor(i / 3) * (skillHeight + skillSpacing);
    
    if (x >= itemX && x <= itemX + skillWidth && 
        y >= itemY && y <= itemY + skillHeight) {
      return i;
    }
  }
  
  return null;
}
```

### Step 5: Update UI Instructions
Modify the instructions at the bottom of the shop:
```javascript
// In renderShop method, replace:
// this.ctx.fillText('Press number key to purchase item', this.width / 2, this.height - 30);
// With:
this.ctx.fillText('Click items to purchase', this.width / 2, this.height - 30);
```

## Testing Plan

### Test Cases
1. Click on equipment items to purchase/upgrade them
2. Click on skill items to purchase/upgrade them
3. Click outside of items (should do nothing)
4. Click on items with insufficient gold (should do nothing)
5. Click on max-level skills (should do nothing)

### Expected Behavior
- Items should be purchased when clicked with sufficient gold
- Visual feedback should show when items are successfully purchased
- No action should occur when clicking on items with insufficient gold
- No action should occur when clicking outside of item boundaries

## Backward Compatibility
The keyboard controls will remain functional to ensure backward compatibility. Players can continue to use either keyboard keys or mouse clicks to purchase items.

## Performance Considerations
- Hit detection should be efficient with O(n) complexity where n is the number of items
- No additional rendering overhead is expected
- Mouse event handling should be lightweight

## Future Enhancements
- Add hover effects to items to indicate they are clickable
- Add tooltips with more detailed item information
- Add visual feedback for when purchases are successful or fail