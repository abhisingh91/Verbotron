"use client";
import { useState } from "react";
import { motion } from "framer-motion";

import MissingWord from "./MissingWord";
import Starfield3D from "./StarField3D";
import WordForge from "./WordForge";
import WordVerse from "./WordVerse";

const MainMenu = () => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [wordVerseGameType, setWordVerseGameType] = useState(null);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  const handleModeChange = (mode) => {
    setDirection(1); // Forward
    setSelectedMode(mode);
  };

  const handleDifficultyChange = (level) => {
    setDirection(1); // Forward
    setDifficulty(level);
  };

  const handleGameTypeChange = (type) => {
    setDirection(1); // Forward
    setWordVerseGameType(type);
  };

  const handleGoBack = () => {
    setDirection(-1); // Backward
    if (wordVerseGameType && selectedMode === "wordVerse") setWordVerseGameType(null);
    else if (difficulty) setDifficulty(null);
    else if (selectedMode) setSelectedMode(null);
  };

  const variants = {
    hidden: (isBack) => ({ opacity: 0, x: isBack ? -50 : 50 }),
    visible: { opacity: 1, x: 0 },
    exit: (isBack) => ({ opacity: 0, x: isBack ? 50 : -50 }),
  };

  const modeStyles = {
    missingWord: {
      header: "Unveil the Missing Word",
      headerGradient: "bg-cyan-300",
      subtext: "Select a challenge level to decode the mystery",
      bgClass: "bg-cyan-900 bg-opacity-20 border-2 border-cyan-600 border-opacity-60",
      instructionBox: "border-2 border-opacity-60 border-cyan-600 text-center bg-cyan-900 bg-opacity-20 shadow-cyan-500/20",
      instruction: [
        "Uncover the missing word and complete the sentence using the context clue",
      ],
    },
    wordForge: {
      header: "Forge Your Word Mastery",
      headerGradient: "bg-pink-300",
      subtext: "Pick a difficulty and ignite your wordcraft",
      bgClass: "bg-purple-900 bg-opacity-20 border-2 border-pink-600 border-opacity-60",
      instructionBox: "border-2 border-opacity-60 border-pink-600 text-center bg-purple-900 bg-opacity-20 shadow-pink-500/20",
      instruction: [
        "Craft a sentence using the word to complete the short story. It must fit the context and follow real-world logic.",
      ],
    },
    wordVerse: {
      header: "Traverse the WordVerse",
      headerGradient: "bg-green-300",
      subtext: "Choose a level to explore word realms",
      bgClass: "bg-green-900 bg-opacity-20 border-2 border-green-600 border-opacity-60",
      instructionBox: "border-2 border-opacity-60 border-green-600 text-center bg-green-900 bg-opacity-20 shadow-green-500/20",
      instruction: ["Master synonyms and antonyms across realms of words."],
      instructionAfterDifficulty: [
        "Input: Type a synonym or antonym as prompted.",
        "Options: Pick the correct synonym or antonym from four choices.",
      ],
    },
  };

  return (
    <div className="flex flex-col justify-center items-center py-6 min-h-[450px] text-white overflow-hidden bg-gradient-to-b from-gray-950/20 via-violet-950/20 to-gray-950/20">
      <Starfield3D />
      {(selectedMode || difficulty) && (
        <button
          onClick={handleGoBack}
          className={`fixed left-3 md:left-5 top-6 sm:top-6 md:top-5 z-20 w-8 h-8 justify-center md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full border border-gray-600 flex items-center bg-gray-800/60 hover:scale-105 transition-all ${
            selectedMode === "missingWord"
              ? "text-cyan-400 hover:bg-cyan-500/30 hover:text-gray-200"
              : selectedMode === "wordForge"
              ? "text-pink-400 hover:bg-pink-500/30 hover:text-gray-200"
              : "text-green-400 hover:bg-green-500/30 hover:text-gray-200"
          }`}
        >
          ←
        </button>
      )}
      <motion.div
        key={
          selectedMode
            ? difficulty
              ? wordVerseGameType && selectedMode === "wordVerse"
                ? "game"
                : "gameType"
              : "difficulty"
            : "mode"
        }
        initial="hidden"
        animate="visible"
        exit="exit"
        custom={direction === -1}
        variants={variants}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center w-full"
      >
        {!selectedMode && !difficulty ? (
          <div className="flex flex-col items-center justify-around w-full min-h-[70vh] px-4 sm:px-6 md:px-20">
            {/* First Row: Game Modes */}
            <div className="flex flex-col items-center w-[80%] max-w-[500px] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[760px] transition-all duration-300">
              <h2 className="text-lg md:text-xl mb-3 font-semibold text-center font-orbitron text-gray-300 tracking-wide drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]">
                Game Modes
              </h2>
              <div className="flex flex-col items-center w-full space-y-3 text-lg md:text-[20px] font-semibold font-orbitron">
                <button
                  onClick={() => handleModeChange("missingWord")}
                  className="p-2.5 sm:p-3 md:p-4 lg:p-4 border-2 w-full max-w-[480px] md:max-w-[550px] lg:max-w-[600px] bg-gray-800 bg-opacity-60 border-cyan-500/70 text-cyan-400 font-semibold rounded-md shadow-[0_0_4px_rgba(34,211,238,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(34,211,238,0.4)] transition-all duration-200 group"
                >
                  Missing Word
                </button>
                <button
                  onClick={() => handleModeChange("wordForge")}
                  className="p-2.5 sm:p-3 md:p-4 lg:p-4 border-2 w-full max-w-[480px] md:max-w-[550px] lg:max-w-[600px] bg-gray-800 bg-opacity-60 border-pink-500/70 text-pink-400 font-semibold rounded-md shadow-[0_0_4px_rgba(236,72,153,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(236,72,153,0.4)] transition-all duration-200 group"
                >
                  Word Forge
                </button>
                <button
                  onClick={() => handleModeChange("wordVerse")}
                  className="p-2.5 sm:p-3 md:p-4 lg:p-4 border-2 w-full max-w-[480px] md:max-w-[550px] lg:max-w-[600px] bg-gray-800 bg-opacity-60 border-green-500/70 text-green-400 font-semibold rounded-md shadow-[0_0_4px_rgba(34,197,94,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(34,197,94,0.4)] transition-all duration-200 group"
                >
                  Word Verse
                </button>
              </div>
              <p className="text-[16px] md:text-lg text-center text-gray-300 font-roboto-mono mt-2">
                Choose your game mode to proceed
              </p>
            </div>
          
            {/* Second Row: About & News */}
            <div className="flex flex-col items-center lg:flex-row lg:justify-center w-full max-w-[500px] sm:max-w-[600px] md:max-w-[640px] transition-all duration-300 gap-8 mt-8">
              {/* About Section */}
              <div className="w-[80%] max-w-[360px] min-h-[220px] bg-gray-900 bg-opacity-60 border-[1px] border-blue-700/60 rounded-md shadow-[0_0_4px_rgba(234,179,8,0.2)] p-4 text-center transition-all duration-300">
                <h3 className="text-xl font-orbitron text-blue-400 tracking-wider mb-4">
                  About
                </h3>
                <p className="text-sm text-gray-300 font-roboto-mono leading-tight">
                  Verbotron is a futuristic word game that enhances your vocabulary
                  through engaging, interactive challenges. <br />
                  <br />
                  Immerse yourself in a space-themed adventure and master new words
                  across various game modes.
                </p>
              </div>
          
              {/* News Section */}
              <div
                className="w-[80%] max-w-[360px] h-[220px] bg-gray-900 bg-opacity-60 border-[1px] border-blue-700/60 rounded-md shadow-[0_0_4px_rgba(234,179,8,0.2)] p-4 text-center overflow-y-auto transition-all duration-300"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#b070ff90 transparent",
                }}
              >
                <h3 className="text-xl font-orbitron text-blue-400 tracking-wider mb-4">
                  News
                </h3>
                <ul className="text-sm text-gray-300 font-roboto-mono text-left list-disc list-inside space-y-4">
                  <li>Stay tuned for vocabulary expansion updates.</li>
                  <li>Launched: Mar 26, 2025 - v1.0 English edition released.</li>
                </ul>
              </div>
            </div>
          </div>
        
        ) : selectedMode && !difficulty ? (
          <>
            <h2
              className={`text-xl md:text-2xl font-orbitron mb-6 font-semibold text-center ${modeStyles[selectedMode].headerGradient} text-transparent bg-clip-text drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]`}
            >
              {modeStyles[selectedMode].header}
            </h2>
            <div className={`w-[90%] md:w-3/4 lg:w-2/3 max-w-[800px] p-4 px-2 md:px-4 rounded-lg border ${modeStyles[selectedMode].bgClass}`}>
              <p className="text-[16px] md:text-lg text-center mb-6 text-gray-300 font-roboto-mono">
                {modeStyles[selectedMode].subtext}
              </p>
              <div className="flex mb-4 w-full justify-evenly text-[16px] md:text-xl font-semibold font-orbitron">
                <button
                  onClick={() => handleDifficultyChange("easy")}
                  className="w-[25vw] md:w-[220px] p-2 sm:p-3 md:p-4 border-2 bg-gray-800 bg-opacity-60 text-center border-green-500/70 text-green-400 font-medium rounded-md mx-2 shadow-[0_0_4px_rgba(34,197,94,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(34,197,94,0.4)] transition-all duration-200 group"
                >
                  Easy
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 rounded-md transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-80"></span>
                </button>
                <button
                  onClick={() => handleDifficultyChange("medium")}
                  className="w-[25vw] md:w-[220px] p-2 sm:p-3 md:p-4 border-2 bg-gray-800 bg-opacity-60 text-center border-yellow-500/70 text-yellow-400 font-medium rounded-md mx-2 shadow-[0_0_4px_rgba(234,179,8,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(234,179,8,0.4)] transition-all duration-200 group"
                >
                  Medium
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500 rounded-md transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-80"></span>
                </button>
                <button
                  onClick={() => handleDifficultyChange("hard")}
                  className="w-[25vw] md:w-[220px] p-2 sm:p-3 md:p-4 border-2 bg-gray-800 bg-opacity-60 text-center border-red-500/70 text-red-400 font-medium rounded-md mx-2 shadow-[0_0_4px_rgba(239,68,68,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(239,68,68,0.4)] transition-all duration-200 group"
                >
                  Hard
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 rounded-md transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-80"></span>
                </button>
              </div>
            </div>
            <div className={`w-[70%] md:w-1/2 lg:w-2/5 min-w-[200px] sm:min-w-[200px] max-w-[650px] mt-10 p-4 rounded-md ${modeStyles[selectedMode].instructionBox}`}>
              <p
                className={`text-lg font-semibold font-orbitron text-center mb-2 ${
                  selectedMode === "missingWord"
                    ? "text-cyan-400"
                    : selectedMode === "wordForge"
                    ? "text-pink-400"
                    : "text-green-400"
                }`}
              >
                Directives
              </p>
              <div className="space-y-4 text-[16px] md:text-lg text-gray-300 font-roboto-mono">
                {modeStyles[selectedMode].instruction.map((item, index) => (
                  <div key={index} className="relative">
                    <p>{item}</p>
                    {index < modeStyles[selectedMode].instruction.length - 1 && (
                      <hr className="mt-2 border-t border-gray-600 opacity-50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : selectedMode === "wordVerse" && difficulty && !wordVerseGameType ? (
          <>
            <h2
              className={`text-xl md:text-2xl pt-10 font-orbitron mb-6 font-semibold text-center ${modeStyles[selectedMode].headerGradient} text-transparent bg-clip-text drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]`}
            >
              {modeStyles[selectedMode].header}
            </h2>
            <div className={`w-[90%] md:w-3/4 lg:w-2/3 max-w-[700px] p-4 mb-6 rounded-lg border ${modeStyles[selectedMode].bgClass}`}>
              <p className="text-[16px] md:text-lg text-center mb-4 text-gray-300 font-roboto-mono">Select play style</p>
              <div className="flex mb-2 md:mb-4 w-full justify-center space-x-4 text-[16px] md:text-xl font-semibold font-orbitron">
                <button
                  onClick={() => handleGameTypeChange("input")}
                  className="w-[40vw] max-w-[240px] p-2 sm:p-3 md:p-4 border-2 bg-gray-800 bg-opacity-60 border-green-500/70 text-emerald-400 font-medium rounded-md shadow-[0_0_4px_rgba(34,197,94,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(34,197,94,0.4)] transition-all duration-200 group"
                >
                  Input
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 rounded-md transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-80"></span>
                </button>
                <button
                  onClick={() => handleGameTypeChange("options")}
                  className="w-[40vw] max-w-[240px] p-2 sm:p-3 md:p-4 border-2 bg-gray-800 bg-opacity-60 border-green-500/70 text-emerald-400 font-medium rounded-md shadow-[0_0_4px_rgba(34,197,94,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(34,197,94,0.4)] transition-all duration-200 group"
                >
                  Options
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-green-500 rounded-md transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-80"></span>
                </button>
              </div>
            </div>
            <div className={`w-[70%] md:w-1/2 lg:w-2/5 min-w-[200px] sm:min-w-[200px] max-w-[600px] mt-6 p-4 rounded-md ${modeStyles[selectedMode].instructionBox}`}>
              <p className="text-lg font-semibold font-orbitron text-center mb-2 text-green-400">Directives</p>
              <div className="space-y-3 text-[16px] md:text-lg text-gray-300 font-roboto-mono">
                {modeStyles[selectedMode].instructionAfterDifficulty.map((item, index) => (
                  <div key={index} className="relative">
                    <p>{item}</p>
                    {index < modeStyles[selectedMode].instructionAfterDifficulty.length - 1 && (
                      <hr className="mt-2 border-t border-gray-600 opacity-50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          selectedMode === "missingWord" ? (
            <MissingWord difficulty={difficulty} />
          ) : selectedMode === "wordForge" ? (
            <WordForge difficulty={difficulty} />
          ) : (
            <WordVerse difficulty={difficulty} gameType={wordVerseGameType} />
          )
        )}
      </motion.div>
    </div>
  );
};

export default MainMenu;