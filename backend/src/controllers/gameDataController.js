const User = require('../models/userModel');

// Get user game data
exports.getGameData = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        gameData: user.gameData
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update user game data
exports.updateGameData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameData } = req.body;
    
    if (!gameData) {
      return res.status(400).json({
        status: 'fail',
        message: 'No game data provided'
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { gameData },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        gameData: updatedUser.gameData
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
