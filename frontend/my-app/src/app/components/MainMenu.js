"use client";
import { useState } from "react";
import { motion } from "framer-motion";

import VocabHit from "./VocabHit";
import MissingWord from "./MissingWord";
import Starfield3D from "./StarField3D";
import WordForge from "./WordForge";
import WordVerse from "./WordVerse";

const MainMenu = () => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null); // For MissingWord, WordVerse
  const [style, setStyle] = useState(null); // For WordForge
  const [category, setCategory] = useState(null); // For VocabHit
  const [wordVerseGameType, setWordVerseGameType] = useState(null);
  const [direction, setDirection] = useState(1);

  const handleModeChange = (mode) => {
    setDirection(1);
    setSelectedMode(mode);
  };

  const handleDifficultyChange = (level) => {
    setDirection(1);
    setDifficulty(level);
  };

  const handleStyleChange = (styleOption) => {
    setDirection(1);
    setStyle(styleOption);
  };

  const handleCategoryChange = (cat) => {
    setDirection(1);
    setCategory(cat);
  };

  const handleGameTypeChange = (type) => {
    setDirection(1);
    setWordVerseGameType(type);
  };

  const handleGoBack = () => {
    setDirection(-1);
    if (wordVerseGameType && selectedMode === "wordVerse") setWordVerseGameType(null);
    else if (category && selectedMode === "vocabHit") setCategory(null);
    else if (style && selectedMode === "wordForge") setStyle(null);
    else if (difficulty && (selectedMode === "missingWord" || selectedMode === "wordVerse")) setDifficulty(null);
    else if (selectedMode) setSelectedMode(null);
  };

  const variants = {
    hidden: (isBack) => ({ opacity: 0, x: isBack ? -50 : 50 }),
    visible: { opacity: 1, x: 0 },
    exit: (isBack) => ({ opacity: 0, x: isBack ? 50 : -50 }),
  };

  const modeStyles = {
    vocabHit: {
      header: "Strike the Vocab Hit",
      headerGradient: "bg-amber-300",
      subtext: "Lock in a category to take down",
      instructionBox: "border-2 border-opacity-60 border-amber-600 text-center bg-amber-900 bg-opacity-20 shadow-amber-500/20",
      instruction: ["Enter the precise word that corresponds to the provided rephrased definition within the selected category."],
    },
    missingWord: {
      header: "Unveil the Missing Word",
      headerGradient: "bg-cyan-300",
      subtext: "Select a challenge level to decode the mystery",
      instructionBox: "border-2 border-opacity-60 border-cyan-600 text-center bg-cyan-900 bg-opacity-20 shadow-cyan-500/20",
      instruction: ["Uncover the missing word to complete the sentence using the context."],
    },
    wordForge: {
      header: "Forge Your Word Mastery",
      headerGradient: "bg-pink-300",
      subtext: "Pick a style and ignite your wordcraft",
      instructionBox: "border-2 border-opacity-60 border-pink-600 text-center bg-purple-900 bg-opacity-20 shadow-pink-500/20",
      instruction: ["Craft a sentence using the given word that fits the story context - either literally or figuratively."],
    },
    wordVerse: {
      header: "Traverse the WordVerse",
      headerGradient: "bg-green-300",
      subtext: "Choose a level to explore word realms",
      instructionBox: "border-2 border-opacity-60 border-green-600 text-center bg-green-900 bg-opacity-20 shadow-green-500/20",
      instruction: ["Master synonyms and antonyms across difficulty levels."],
      instructionAfterDifficulty: ["Type a synonym or antonym as prompted.", "Pick the correct synonym or antonym from options."],
    },
  };

  const difficultyDescriptions = {
    missingWord: [
      { level: "easy", description: "simple words, clear hints" },
      { level: "medium", description: "tricky words, subtle clues" },
      { level: "hard", description: "complex terms, vague context" },
    ],
    wordVerse: [
      { level: "easy", description: "common words, basic pairs" },
      { level: "medium", description: "nuanced terms, mixed sets" },
      { level: "hard", description: "advanced vocab, tough links" },
    ],
  };

  const styleDescriptions = {
    wordForge: [
      { style: "literal", name: "Core", description: "use the word in its standard, literal meaning", color: "cyan" },
      { style: "figurative", name: "Flux", description: " twist the word into metaphors, idioms, or abstract ideas", color: "purple" },
    ],
  };

  return (
    <div className="flex flex-col justify-center items-center py-6 min-h-[450px] text-white overflow-hidden bg-gradient-to-b from-gray-950/10 via-violet-950/20 to-gray-950/10">
      <Starfield3D />
      {(selectedMode || difficulty || style || category) && (
        <button
          onClick={handleGoBack}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleGoBack();
          }}
          className={`fixed left-3 md:left-5 top-5 md:top-5 lg:top-6 z-20 w-8 h-8 justify-center md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full border border-gray-600 flex items-center bg-gray-800/60 hover:scale-105 transition-all ${
            selectedMode === "vocabHit"
              ? "text-amber-400 hover:bg-amber-500/30 hover:text-gray-200"
              : selectedMode === "missingWord"
              ? "text-cyan-400 hover:bg-cyan-500/30 hover:text-gray-200"
              : selectedMode === "wordForge"
              ? "text-pink-400 hover:bg-pink-500/30 hover:text-gray-200"
              : "text-green-400 hover:bg-green-500/30 hover:text-gray-200"
          }`}
        >
          <span className="font-orbitron">&lt;&lt;</span>
        </button>
      )}
      <motion.div
        key={
          selectedMode
            ? (category && selectedMode === "vocabHit") ||
              (difficulty && (selectedMode === "missingWord" || selectedMode === "wordVerse")) ||
              (style && selectedMode === "wordForge")
              ? wordVerseGameType && selectedMode === "wordVerse"
                ? "game"
                : "gameType"
              : selectedMode === "vocabHit"
              ? "category"
              : selectedMode === "wordForge"
              ? "style"
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
        {!selectedMode && !difficulty && !style && !category ? (
          <div className="flex flex-col items-center justify-around w-full min-h-[70vh] px-4 sm:px-6 md:px-20">
            {/* First Row: Game Modes */}
            <div className="flex flex-col items-center w-[80%] max-w-[500px] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[760px] transition-all duration-300">
              <h2 className="text-lg md:text-xl mb-3 font-semibold text-center font-orbitron text-gray-300 tracking-wide drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]">
                Game Modes
              </h2>
              <div className="flex flex-col items-center w-full space-y-3 text-lg md:text-[20px] font-semibold font-orbitron">
                <button
                  onClick={() => handleModeChange("vocabHit")}
                  className="p-2.5 sm:p-3 md:p-4 lg:p-4 border-2 w-full max-w-[480px] md:max-w-[550px] lg:max-w-[600px] bg-gray-800 bg-opacity-60 border-amber-500/70 text-amber-400 font-semibold rounded-md shadow-[0_0_4px_rgba(249,115,22,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(249,115,22,0.4)] transition-all duration-200 group"
                >
                  Vocab Hit
                </button>
                <button
                  onClick={() => handleModeChange("wordForge")}
                  className="p-2.5 sm:p-3 md:p-4 lg:p-4 border-2 w-full max-w-[480px] md:max-w-[550px] lg:max-w-[600px] bg-gray-800 bg-opacity-60 border-pink-500/70 text-pink-400 font-semibold rounded-md shadow-[0_0_4px_rgba(236,72,153,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(236,72,153,0.4)] transition-all duration-200 group"
                >
                  Word Forge
                </button>
                <button
                  onClick={() => handleModeChange("missingWord")}
                  className="p-2.5 sm:p-3 md:p-4 lg:p-4 border-2 w-full max-w-[480px] md:max-w-[550px] lg:max-w-[600px] bg-gray-800 bg-opacity-60 border-cyan-500/70 text-cyan-400 font-semibold rounded-md shadow-[0_0_4px_rgba(34,211,238,0.2)] hover:scale-105 hover:bg-opacity-80 hover:shadow-[0_0_6px_rgba(34,211,238,0.4)] transition-all duration-200 group"
                >
                  Missing Word
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
              <div className="w-[80%] max-w-[360px] min-h-[220px] bg-gray-900 bg-opacity-60 border-[1px] border-blue-700/60 rounded-sm shadow-[0_0_4px_rgba(234,179,8,0.2)] p-4 text-center transition-all duration-300">
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
              <div
                className="w-[80%] max-w-[360px] h-[220px] bg-gray-900 bg-opacity-60 border-[1px] border-blue-700/60 rounded-sm shadow-[0_0_4px_rgba(234,179,8,0.2)] p-4 text-center overflow-y-auto transition-all duration-300"
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
        ) : selectedMode === "missingWord" && !difficulty ? (
          <>
            <h2
              className={`text-xl md:text-2xl font-orbitron mb-6 font-semibold text-center ${modeStyles[selectedMode].headerGradient} text-transparent bg-clip-text drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]`}
            >
              {modeStyles[selectedMode].header}
            </h2>
            <p className="w-[80%] text-[16px] md:text-lg text-center mb-6 text-gray-300 font-roboto-mono">
              {modeStyles[selectedMode].subtext}
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 w-full max-w-[900px] px-4">
              {difficultyDescriptions[selectedMode].map(({ level, description }) => (
                <div key={level} className="w-2/3 md:w-[200px] lg:w-1/3 max-w-[300px]">
                  <div
                    className={`w-full h-[65px] bg-gray-900 bg-opacity-70 border-2 rounded-sm cursor-pointer transition-all duration-200 hover:scale-105 ${
                      level === "easy"
                        ? "border-green-600 shadow-[0_0_5px_rgba(34,197,94,0.3)]"
                        : level === "medium"
                        ? "border-yellow-600 shadow-[0_0_5px_rgba(234,179,8,0.3)]"
                        : "border-red-600 shadow-[0_0_5px_rgba(239,68,68,0.3)]"
                    }`}
                    onClick={() => handleDifficultyChange(level)}
                  >
                    <p
                      className={`text-lg md:text-xl font-orbitron font-semibold text-center h-full flex items-center justify-center ${
                        level === "easy"
                          ? "text-green-300"
                          : level === "medium"
                          ? "text-yellow-300"
                          : "text-red-300"
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </p>
                  </div>
                  <div
                    className={`w-full bg-gray-900 bg-opacity-50 border-l border-r border-b border-gray-500 border-opacity-10 rounded-b-md px-3 py-2 ${
                      level === "easy"
                        ? "shadow-[0_0_4px_rgba(34,197,94,0.2)]"
                        : level === "medium"
                        ? "shadow-[0_0_4px_rgba(234,179,8,0.2)]"
                        : "shadow-[0_0_4px_rgba(239,68,68,0.2)]"
                    }`}
                  >
                    <p className="text-[12px] md:text-[14px] text-gray-400 font-roboto-mono text-center">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`w-[70%] md:w-1/2 lg:w-2/5 min-w-[200px] max-w-[650px] mt-10 p-4 rounded-md ${modeStyles[selectedMode].instructionBox}`}>
              <p className="text-lg font-semibold font-orbitron text-center mb-2 text-cyan-400">
                Directives
              </p>
              <div className="space-y-4 text-[14px] md:text-[16px] text-gray-300 font-roboto-mono">
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
        ) : selectedMode === "wordForge" && !style ? (
          <>
            <h2
              className={`text-xl md:text-2xl font-orbitron mb-6 font-semibold text-center ${modeStyles[selectedMode].headerGradient} text-transparent bg-clip-text drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]`}
            >
              {modeStyles[selectedMode].header}
            </h2>
            <p className="w-[80%] text-[16px] md:text-lg text-center mb-6 text-gray-300 font-roboto-mono">
              {modeStyles[selectedMode].subtext}
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 w-full max-w-[900px] px-4">
              {styleDescriptions[selectedMode].map(({ style, name, description, color }) => (
                <div key={style} className="w-2/3 md:w-[200px] lg:w-1/3 max-w-[300px]">
                  <div
                    className={`w-full h-[65px] bg-gray-900 bg-opacity-70 border-2 rounded-sm cursor-pointer transition-all duration-200 hover:scale-105 ${
                      style === "literal"
                        ? "border-emerald-600 shadow-[0_0_5px_rgba(34,211,238,0.3)]"
                        : "border-sky-600 shadow-[0_0_5px_rgba(147,51,234,0.3)]"
                    }`}
                    onClick={() => handleStyleChange(style)}
                  >
                    <p
                      className={`text-lg md:text-xl font-orbitron font-semibold text-center h-full flex items-center justify-center ${
                        style === "literal" ? "text-emerald-300" : "text-sky-300"
                      }`}
                    >
                      {name}
                    </p>
                  </div>
                  <div
                    className={`w-full bg-gray-900 bg-opacity-50 border-l border-r border-b border-gray-500 border-opacity-10 rounded-b-md px-3 py-2 ${
                      style === "literal"
                        ? "shadow-[0_0_4px_rgba(34,211,238,0.2)]"
                        : "shadow-[0_0_4px_rgba(147,51,234,0.2)]"
                    }`}
                  >
                    <p className="text-[12px] md:text-[14px] text-gray-400 font-roboto-mono text-center">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`w-[70%] md:w-1/2 lg:w-2/5 min-w-[200px] max-w-[650px] mt-10 p-4 rounded-md ${modeStyles[selectedMode].instructionBox}`}>
              <p className="text-lg font-semibold font-orbitron text-center mb-2 text-pink-400">
                Directives
              </p>
              <div className="space-y-4 text-[14px] md:text-[16px] text-gray-300 font-roboto-mono">
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
        ) : selectedMode === "vocabHit" && !category ? (
          <>
            <h2
              className={`text-xl md:text-2xl font-orbitron mb-6 font-semibold text-center ${modeStyles[selectedMode].headerGradient} text-transparent bg-clip-text drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]`}
            >
              {modeStyles[selectedMode].header}
            </h2>
            <p className="w-[80%] text-[16px] md:text-lg text-center mb-6 text-gray-300 font-roboto-mono">
              {modeStyles[selectedMode].subtext}
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 w-full max-w-[900px] px-4">
              {[
                { category: "emotion", color: "purple", text: "Emotions", description: "terms representing emotional states and feelings" },
                { category: "action", color: "emerald", text: "Actions", description: "verbs indicating physical or active processes" },
                { category: "general", color: "cyan", text: "General", description: "diverse terms excluding emotion and action" },
              ].map(({ category, text, description }) => (
                <div key={category} className="w-2/3 md:w-[200px] lg:w-1/3 max-w-[300px]">
                  <div
                    className={`w-full h-[65px] bg-gray-900 bg-opacity-70 border-2 rounded-sm cursor-pointer transition-all duration-200 hover:scale-105 ${
                      category === "emotion"
                        ? "border-purple-600 shadow-[0_0_5px_rgba(147,51,234,0.3)]"
                        : category === "action"
                        ? "border-emerald-600 shadow-[0_0_5px_rgba(16,185,129,0.3)]"
                        : "border-cyan-600 shadow-[0_0_5px_rgba(34,211,238,0.3)]"
                    }`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    <p
                      className={`text-lg md:text-xl font-orbitron font-semibold text-center h-full flex items-center justify-center ${
                        category === "emotion"
                          ? "text-purple-300"
                          : category === "action"
                          ? "text-emerald-300"
                          : "text-cyan-300"
                      }`}
                    >
                      {text}
                    </p>
                  </div>
                  <div
                    className={`w-full bg-gray-900 bg-opacity-50 border-l border-r border-b border-gray-500 border-opacity-10 rounded-b-md px-3 py-2 ${
                      category === "emotion"
                        ? "shadow-[0_0_4px_rgba(147,51,234,0.2)]"
                        : category === "action"
                        ? "shadow-[0_0_4px_rgba(16,185,129,0.2)]"
                        : "shadow-[0_0_4px_rgba(34,211,238,0.2)]"
                    }`}
                  >
                    <p className="text-[12px] md:text-[14px] text-gray-400 font-roboto-mono text-center">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`w-[70%] md:w-1/2 lg:w-2/5 min-w-[200px] max-w-[650px] mt-10 p-4 rounded-md ${modeStyles[selectedMode].instructionBox}`}>
              <p className="text-lg font-semibold font-orbitron text-center mb-2 text-amber-400">
                Directives
              </p>
              <div className="space-y-4 text-[14px] md:text-[16px] text-gray-300 font-roboto-mono">
                <p>{modeStyles[selectedMode].instruction[0]}</p>
              </div>
            </div>
          </>
        ) : selectedMode === "wordVerse" && !difficulty ? (
          <>
            <h2
              className={`text-xl md:text-2xl font-orbitron mb-6 font-semibold text-center ${modeStyles[selectedMode].headerGradient} text-transparent bg-clip-text drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]`}
            >
              {modeStyles[selectedMode].header}
            </h2>
            <p className="w-[80%] text-[16px] md:text-lg text-center mb-6 text-gray-300 font-roboto-mono">
              {modeStyles[selectedMode].subtext}
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 w-full max-w-[900px] px-4">
              {difficultyDescriptions[selectedMode].map(({ level, description }) => (
                <div key={level} className="w-2/3 md:w-[200px] lg:w-1/3 max-w-[300px]">
                  <div
                    className={`w-full h-[65px] bg-gray-900 bg-opacity-70 border-2 rounded-sm cursor-pointer transition-all duration-200 hover:scale-105 ${
                      level === "easy"
                        ? "border-green-600 shadow-[0_0_5px_rgba(34,197,94,0.3)]"
                        : level === "medium"
                        ? "border-yellow-600 shadow-[0_0_5px_rgba(234,179,8,0.3)]"
                        : "border-red-600 shadow-[0_0_5px_rgba(239,68,68,0.3)]"
                    }`}
                    onClick={() => handleDifficultyChange(level)}
                  >
                    <p
                      className={`text-lg md:text-xl font-orbitron font-semibold text-center h-full flex items-center justify-center ${
                        level === "easy"
                          ? "text-green-300"
                          : level === "medium"
                          ? "text-yellow-300"
                          : "text-red-300"
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </p>
                  </div>
                  <div
                    className={`w-full bg-gray-900 bg-opacity-50 border-l border-r border-b border-gray-500 border-opacity-10 rounded-b-md px-3 py-2 ${
                      level === "easy"
                        ? "shadow-[0_0_4px_rgba(34,197,94,0.2)]"
                        : level === "medium"
                        ? "shadow-[0_0_4px_rgba(234,179,8,0.2)]"
                        : "shadow-[0_0_4px_rgba(239,68,68,0.2)]"
                    }`}
                  >
                    <p className="text-[12px] md:text-[14px] text-gray-400 font-roboto-mono text-center">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`w-[70%] md:w-1/2 lg:w-2/5 min-w-[200px] max-w-[650px] mt-10 p-4 rounded-md ${modeStyles[selectedMode].instructionBox}`}>
              <p className="text-lg font-semibold font-orbitron text-center mb-2 text-green-400">
                Directives
              </p>
              <div className="space-y-4 text-[14px] md:text-[16px] text-gray-300 font-roboto-mono">
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
              className={`text-xl md:text-2xl font-orbitron mb-6 font-semibold text-center ${modeStyles[selectedMode].headerGradient} text-transparent bg-clip-text drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]`}
            >
              {modeStyles[selectedMode].header}
            </h2>
            <p className="text-[16px] md:text-lg text-center mb-6 text-gray-300 font-roboto-mono">
              Select play style
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 w-full max-w-[900px] px-4">
              {[
                { type: "input", text: "Input", description: "type synonym or antonym" },
                { type: "options", text: "Options", description: "choose from four choices" },
              ].map(({ type, text, description }) => (
                <div key={type} className="w-2/3 md:w-[200px] lg:w-1/3 max-w-[300px]">
                  <div
                    className={`w-full h-[65px] bg-gray-900 bg-opacity-70 border-2 border-green-600 shadow-[0_0_5px_rgba(34,197,94,0.3)] rounded-sm cursor-pointer transition-all duration-200 hover:scale-105`}
                    onClick={() => handleGameTypeChange(type)}
                  >
                    <p className="text-lg md:text-xl font-orbitron font-semibold text-center h-full flex items-center justify-center text-green-300">
                      {text}
                    </p>
                  </div>
                  <div
                    className="w-full bg-gray-900 bg-opacity-50 border-l border-r border-b border-gray-500 border-opacity-10 rounded-b-md px-3 py-2 shadow-[0_0_4px_rgba(34,197,94,0.2)]"
                  >
                    <p className="text-[12px] md:text-[14px] text-gray-400 font-roboto-mono text-center">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`w-[70%] md:w-1/2 lg:w-2/5 min-w-[200px] max-w-[650px] mt-10 p-4 rounded-md ${modeStyles[selectedMode].instructionBox}`}>
              <p className="text-lg font-semibold font-orbitron text-center mb-2 text-green-400">
                Directives
              </p>
              <div className="space-y-4 text-[14px] md:text-[16px] text-gray-300 font-roboto-mono">
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
        ) : selectedMode === "vocabHit" ? (
          <VocabHit category={category} />
        ) : selectedMode === "missingWord" ? (
          <MissingWord difficulty={difficulty} />
        ) : selectedMode === "wordForge" ? (
          <WordForge style={style} />
        ) : (
          <WordVerse difficulty={difficulty} gameType={wordVerseGameType} />
        )}
      </motion.div>
    </div>
  );
};

export default MainMenu;