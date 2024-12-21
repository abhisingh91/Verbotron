'use client';

import { useState } from 'react';
import SentenceGame from './SentenceGame';

const MainMenu = () => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  const handleModeChange = (mode) => {
    setSelectedMode(mode); // Set the selected game mode
  };

  const handleDifficultyChange = (level) => {
    setDifficulty(level); // Set the selected difficulty
  };

  const handleGoBack = () => {
    if (difficulty) {
      setDifficulty(null); // Go back to difficulty selection
    } else if (selectedMode) {
      setSelectedMode(null); // Go back to game mode selection
    }
  };

  return (
    <div className="flex flex-col justify-start items-center pt-5 h-screen bg-gray-800 text-white">

      {/* Only show the "Go Back" button if a mode or difficulty is selected */}
      {(selectedMode || difficulty) && (
        <button
          onClick={handleGoBack}
          className="p-2 bg-gray-600 text-white rounded-md mx-10 mb-6 self-end"
        >
          Go Back
        </button>
      )}

      {/* Game Mode Selection */}
      {!selectedMode && !difficulty ? (
        <>
          <h2 className="text-2xl my-6">Select Game Mode</h2>
          <div className="flex mb-6">
            <button
              onClick={() => handleModeChange('sentenceGame')}
              className="p-4 bg-blue-300 text-white rounded-md mx-2"
            >
              Sentence Game
            </button>
          </div>
          <p className="text-lg">Choose your game mode to proceed</p>
        </>
      ) : null}

      {/* Difficulty Selection */}
      {selectedMode && !difficulty ? (
        <>
          <h2 className="text-2xl mb-4">Select Difficulty</h2>
          <div className="flex mb-6">
            <button
              onClick={() => handleDifficultyChange('easy')}
              className="p-4 bg-blue-300 text-white rounded-md mx-2"
            >
              Easy
            </button>
            <button
              onClick={() => handleDifficultyChange('medium')}
              className="p-4 bg-yellow-300 text-white rounded-md mx-2"
            >
              Medium
            </button>
            <button
              onClick={() => handleDifficultyChange('hard')}
              className="p-4 bg-red-300 text-white rounded-md mx-2"
            >
              Hard
            </button>
          </div>
          <p className="text-lg">Choose your difficulty to start the game</p>
        </>
      ) : null}

      {/* Game screen */}
      {difficulty ? (
        <SentenceGame difficulty={difficulty} />
      ) : null}
    </div>
  );
};

export default MainMenu;
