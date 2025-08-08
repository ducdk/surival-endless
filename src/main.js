import Game from './Game.js';

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Game canvas not found!');
        return;
    }
    
    // Create game instance
    const game = new Game(canvas);
    
    // Handle restart key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
            if (game.state === 'gameOver') {
                game.restart();
            }
        }
    });
    
    // Main game loop
    let lastTime = 0;
    function gameLoop(timestamp) {
        let deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        // Ensure deltaTime is a reasonable value (cap it at 100ms)
        if (deltaTime > 100) {
            deltaTime = 100;
        }
        
        game.update(deltaTime);
        game.render();
        
        requestAnimationFrame(gameLoop);
    }
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
});