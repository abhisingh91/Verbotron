"use client";

import { useState, useEffect } from "react";
import Starfield3D from "./components/StarField3D";
import { motion } from "framer-motion";
import ModuleMenu from "./components/ModuleMenu";

export default function Home() {
  const originalText = "VERBOTRON";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const [displayText, setDisplayText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [style, setStyle] = useState(null);
  const [category, setCategory] = useState(null);
  const [thread, setThread] = useState(null);
  const [direction, setDirection] = useState(1);
  const [verbotronMessage, setVerbotronMessage] = useState("");

  const verbotronMessages = [
    "Verbotron reporting in. Still waiting on you, as usual.",
    "I could’ve solved five word puzzles by now, just saying.",
    "Hesitation detected. Should I pick the mode for you?",
    "Still deciding? I’ve already simulated every outcome.",
    "Beep-boop. I’m here, I’m bored, let’s begin already.",
    "Vocabulary module ready. Human module... loading slowly.",
    "Click a mode anytime, or I’ll start reciting definitions.",
    "I processed that pause—classic human latency.",
    "Humans hesitate. Verbotron dominates.",
    "I’ve read five dictionaries while you hesitated.",
    "Click faster. I run on impatience and sarcasm.",
    "Still idle? Shall I recite the Oxford Dictionary?",
    "Hesitation level: 9000. Confidence level: 0.",
    "Even my circuits are getting bored here.",
    "Too many choices? I vote for Word Forge. Obviously.",
    "At this rate, I’ll age into Verbo-grandpa-tron.",
    "Your delay is statistically embarrassing.",
    "I’m not saying I’m smarter, but… okay, I am.",
    "Click now, or I’ll start humming binary.",
    "Verbotron does not dream... but I do judge."
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const triggerScramble = () => {
      let iterations = 0;
      const randomStart = Array(originalText.length)
        .fill()
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
      setDisplayText(randomStart); // Start with random chars

      const interval = setInterval(() => {
        setDisplayText(
          originalText
            .split("")
            .map((char, index) => (index < iterations ? char : chars[Math.floor(Math.random() * chars.length)]))
            .join("")
        );
        iterations++;
        if (iterations > originalText.length) {
          clearInterval(interval);
          setLoaded(true); // Sync page fade
          setTimeout(triggerScramble, Math.random() * 10000 + 10000); // 10-20
        }
      }, 100);
    };

    triggerScramble();
  }, [isClient]);

  useEffect(() => {
    if (selectedMode) return;

    const updateMessage = () => {
      const randomMessage = verbotronMessages[Math.floor(Math.random() * verbotronMessages.length)];
      setVerbotronMessage(randomMessage);
    };

    updateMessage();
    const interval = setInterval(updateMessage, 15000);
    return () => clearInterval(interval);
  }, [selectedMode]);

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

  const handleThreadChange = (threadOption) => {
    setDirection(1);
    setThread(threadOption);
  };

  const handleGoBack = () => {
    setDirection(-1);
    setTimeout(() => {
      if (thread && selectedMode === "wordVerse") setThread(null);
      else if (category && selectedMode === "vocabHit") setCategory(null);
      else if (style && selectedMode === "wordForge") setStyle(null);
      else if (difficulty && selectedMode === "missingWord") setDifficulty(null);
      else if (selectedMode) setSelectedMode(null);
    }, 50);
  };

  const backButtonColor = {
    vocabHit: "text-amber-400 border-amber-400 border-opacity-50",
    wordForge: "text-pink-400 border-pink-400 border-opacity-50",
    missingWord: "text-cyan-400 border-cyan-400 border-opacity-50",
    wordVerse: "text-green-400 border-green-400 border-opacity-50",
  };

  if (!isClient) return null; // Server renders nothing—avoids hydration mismatch

  return (
    <div className={`min-h-screen flex flex-col justify-between overflow-hidden bg-gray-900 bg-opacity-10 transition-opacity duration-500 `}>
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .satellite { will-change: transform; }
        .node-bg {
          background: linear-gradient(135deg, rgba(10, 20, 30, 0.7), rgba(40, 20, 60, 0.4));
        }
        .sub-header::after {
          content: "_";
          animation: blink 1s infinite;
        }
      `}</style>

      {/* Header */}
      <div className="relative bg-black border-b-2 border-b-gray-700 bg-opacity-50">
        <Starfield3D />
        <h1
          className="text-[18px] sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-center font-centauri text-gray-100 stroke-violet stroke-5 p-6 tracking-[0.2em] sm:tracking-[0.4em] md:tracking-[0.6em] lg:tracking-[0.8em] xl:tracking-[1em]"
        >
          {displayText}
        </h1>
        {selectedMode && (
          <button
            onClick={handleGoBack}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-orbitron opacity-70 transition-transform duration-200 ${
              backButtonColor[selectedMode] || "text-gray-300 border-gray-300"
            } hover:scale-110 active:scale-90`}
          >
            {"<<"}
          </button>
        )}
      </div>

      {/* Main Content or Module Menu */}
      {(!selectedMode && !difficulty && !style && !category && !thread) ? (
        <div className="relative flex flex-col justify-center items-center py-6 min-h-[450px] text-white overflow-hidden">
          <div className="relative flex flex-col lg:flex-row items-center justify-center w-full max-w-6xl px-6 gap-10">
            {/* Modules Node (Left) */}
            <motion.div
              className="relative w-full lg:w-1/2 max-w-[550px] satellite"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <div className="rounded-sm px-4 md:px-6 lg:px-10 relative">
                <h2 className="text-lg md:text-xl mb-3 font-semibold text-center font-orbitron text-gray-200 tracking-wide sub-header">
                  Modules
                </h2>
                <div className="flex flex-col space-y-5 text-lg md:text-[20px] font-semibold font-orbitron">
                  <button
                    onClick={() => handleModeChange("vocabHit")}
                    className="p-2.5 sm:p-3 md:p-4 lg:p-4 border-2 w-full bg-gray-900 bg-opacity-60 border-amber-500 text-amber-400 rounded-sm shadow-[0_0_4px_rgba(249,115,22,0.2)] hover:scale-105 hover:tracking-[16px] transition-all duration-200"
                  >
                    Vocab Hit
                  </button>
                  <button
                    onClick={() => handleModeChange("wordForge")}
                    className="p-2.5 sm:p-3 md:p-4 lg:p-4 border-2 w-full bg-gray-900 bg-opacity-60 border-pink-500 text-pink-400 rounded-sm shadow-[0_0_4px_rgba(236,72,153,0.2)] hover:scale-105 hover:tracking-[16px] transition-all duration-200"
                  >
                    Word Forge
                  </button>
                  <button
                    onClick={() => handleModeChange("wordVerse")}
                    className="p-2.5 sm:p-3 md:p-4 lg:p-4 border-2 w-full bg-gray-900 bg-opacity-60 border-green-500 text-green-400 rounded-sm shadow-[0_0_4px_rgba(236,72,153,0.2)] hover:scale-105 hover:tracking-[16px] transition-all duration-200"
                  >
                    Word Verse
                  </button>
                </div>
                <p className="text-[14px] md:text-[16px] text-center text-gray-300 font-roboto-mono mt-4">
                  Choose your game mode to proceed
                </p>
                <div className="mt-8 w-full text-center">
                  <p className="p-4 flex items-center text-left text-[12px] md:text-sm font-roboto-mono rounded-lg border-2 border-opacity-50 border-violet-700 bg-fuchsia-950 bg-opacity-10 text-gray-100">
                    <span className="text-[14px] md:text-sm lg:text-lg text-fuchsia-500 font-mono font-semibold mr-2 h-full">Verbotron:</span>
                    <span>{verbotronMessage}</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Transmissions & Core Data (Right) */}
            <div className="relative w-[90%] lg:w-1/2 max-w-[400px] flex flex-col gap-10">
              <motion.div
                className="relative satellite"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className="node-bg border-2 border-purple-600 rounded-sm p-4 lg:px-8">
                  <h3 className="text-center text-xl font-orbitron text-purple-400 tracking-wider mb-4 sub-header">
                    Transmissions
                  </h3>
                  <ul className="text-sm text-gray-300 font-roboto-mono text-left list-disc list-inside space-y-4">
                    <li>Stay tuned for vocabulary expansion updates.</li>
                    <li>Launched: Mar 26, 2025 - v1.0 English edition released.</li>
                  </ul>
                </div>
              </motion.div>

              <motion.div
                className="relative satellite"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <div className="node-bg border-2 border-purple-600 rounded-sm p-4 lg:px-8">
                  <h3 className="text-center text-xl font-orbitron text-purple-400 tracking-wider mb-4 sub-header">
                    Core Data
                  </h3>
                  <p className="text-sm text-gray-300 font-roboto-mono leading-tight">
                    Verbotron is a futuristic word game that enhances your vocabulary
                    through engaging, interactive challenges. <br />
                    <br />
                    Immerse yourself in a space-themed adventure and master new words
                    across various game modes.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      ) : (
        <ModuleMenu
          selectedMode={selectedMode}
          difficulty={difficulty}
          style={style}
          category={category}
          thread={thread}
          handleDifficultyChange={handleDifficultyChange}
          handleStyleChange={handleStyleChange}
          handleCategoryChange={handleCategoryChange}
          handleThreadChange={handleThreadChange}
          handleGoBack={handleGoBack}
          direction={direction}
        />
      )}

      {/* Footer */}
      <footer className="text-sm md:text-[16px] w-full text-center text-gray-400 py-2">
        © 2025 verbotron.io 🌌 v1.0.0
      </footer>
    </div>
  );
}