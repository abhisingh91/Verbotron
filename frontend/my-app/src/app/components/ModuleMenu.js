"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import VocabHit from "./VocabHit";
import MissingWord from "./MissingWord";
import WordForge from "./WordForge";
import WordVerse from "./WordVerse";

const ModuleMenu = ({
  selectedMode,
  difficulty,
  style,
  category,
  thread,
  handleDifficultyChange,
  handleStyleChange,
  handleCategoryChange,
  handleThreadChange,
  handleGoBack,
  direction,
}) => {
  const variants = {
    hidden: (isBack) => ({ opacity: 0, x: isBack ? -50 : 50 }),
    visible: { opacity: 1, x: 0 },
    exit: (isBack) => ({ opacity: 0, x: isBack ? 50 : -50 }),
  };

  const modeStyles = {
    vocabHit: {
      header: "Strike the Right Vocab",
      subtext: "Lock a category and take your shot",
      instruction: "Enter the precise word that corresponds to the provided definition.",
      gradient: "bg-gradient-to-r from-amber-500/10 to-gray-900/50",
      border: "border-[1px] border-amber-600",
      text: "text-amber-300",
      directiveColor: "text-amber-400",
      scanline: "bg-amber-700",
    },
    missingWord: {
      header: "Unveil the Missing Word",
      subtext: "Select a challenge level to decode the mystery",
      instruction: "Uncover the missing word to complete the sentence using the context.",
      gradient: "bg-gradient-to-r from-cyan-500/10 to-gray-900/50",
      border: "border-[1px] border-cyan-600",
      text: "text-cyan-300",
      directiveColor: "text-cyan-400",
      scanline: "bg-cyan-700",
    },
    wordForge: {
      header: "Forge Your Word Mastery",
      subtext: "Pick a style and ignite your wordcraft",
      instruction: "Craft a sentence using the given word that fits the story context.",
      gradient: "bg-gradient-to-r from-pink-500/10 to-gray-900/50",
      border: "border-[1px] border-pink-600",
      text: "text-pink-300",
      directiveColor: "text-pink-400",
      scanline: "bg-pink-700",
    },
    wordVerse: {
      header: "Traverse the Word Verse",
      subtext: "Form allies or pit rivals — choose wisely",
      instruction: "Summon a synonym or antonym that aligns with the given word and context.",
      gradient: "bg-gradient-to-r from-green-500/10 to-gray-900/50",
      border: "border-[1px] border-green-600",
      text: "text-green-300",
      directiveColor: "text-green-400",
      scanline: "bg-green-700",
    },
  };

  const vectorData = {
    missingWord: [
      { key: "easy", name: "Easy", description: "simple words, clear hints", border: "border-green-600", text: "text-green-300", shadow: "shadow-[0_0_5px_rgba(34,197,94,0.3)]" },
      { key: "medium", name: "Medium", description: "tricky words, subtle clues", border: "border-yellow-600", text: "text-yellow-300", shadow: "shadow-[0_0_5px_rgba(234,179,8,0.3)]" },
      { key: "hard", name: "Hard", description: "complex terms, vague context", border: "border-red-600", text: "text-red-300", shadow: "shadow-[0_0_5px_rgba(239,68,68,0.3)]" },
    ],
    wordForge: [
      { key: "literal", name: "Core", description: "use the word in its standard, literal meaning", border: "border-emerald-600", text: "text-emerald-300", shadow: "shadow-[0_0_5px_rgba(34,211,238,0.3)]" },
      { key: "figurative", name: "Flux", description: "twist the word into metaphors, idioms, or abstract ideas", border: "border-sky-600", text: "text-sky-300", shadow: "shadow-[0_0_5px_rgba(147,51,234,0.3)]" },
    ],
    vocabHit: [
      { key: "emotion", name: "Aether", description: "terms representing emotional states and feelings", border: "border-purple-600", text: "text-purple-300", shadow: "shadow-[0_0_5px_rgba(147,51,234,0.3)]" },
      { key: "action", name: "Surge", description: "verbs indicating physical or active processes", border: "border-emerald-600", text: "text-emerald-300", shadow: "shadow-[0_0_5px_rgba(16,185,129,0.3)]" },
      { key: "general", name: "Nexus", description: "diverse terms excluding emotion and action", border: "border-cyan-600", text: "text-cyan-300", shadow: "shadow-[0_0_5px_rgba(34,211,238,0.3)]" },
    ],
    wordVerse: [
      { key: "ally", name: "Ally", description: "connect words by similarity or synonyms", border: "border-blue-600", text: "text-blue-300", shadow: "shadow-[0_0_5px_rgba(34,97,194,0.3)]" },
      { key: "rival", name: "Rival", description: "contrast words with opposites or differences", border: "border-rose-600", text: "text-rose-300", shadow: "shadow-[0_0_5px_rgba(200,48,68,0.3)]" },
    ],
  };

  const getVectorHandler = (mode, key) => {
    switch (mode) {
      case "vocabHit": return () => handleCategoryChange(key);
      case "missingWord": return () => handleDifficultyChange(key);
      case "wordForge": return () => handleStyleChange(key);
      case "wordVerse": return () => handleThreadChange(key);
      default: return null;
    }
  };

  const TypingText = ({ text, color }) => {
    const staticPrefix = "@verbotron: ";
    const [displayText, setDisplayText] = useState("");
    const [index, setIndex] = useState(0);
    const [blink, setBlink] = useState(true);

    useEffect(() => {
      if (index < text.length) {
        const typingTimeout = setTimeout(() => {
          setDisplayText((prev) => prev + text[index]);
          setIndex(index + 1);
        }, 30);
        return () => clearTimeout(typingTimeout);
      } else {
        const resetTimeout = setTimeout(() => {
          setDisplayText("");
          setIndex(0);
        }, Math.random() * 2000 + 10000); // 10-12s
        return () => clearTimeout(resetTimeout);
      }
    }, [index, text]);

    useEffect(() => {
      const blinkInterval = setInterval(() => {
        setBlink((prev) => !prev);
      }, 500); // Blink every 500ms
      return () => clearInterval(blinkInterval);
    }, []);

    return (
      <p className={`absolute bottom-[4px] left-2 text-[12px] md:text-[14px] lg:text-[16px] font-roboto-mono ${color}`}>
        <span className="text-gray-200 font-medium block sm:inline">{staticPrefix}</span>
        <span className="block sm:inline">
          {displayText}
          <span className={blink ? "opacity-100" : "opacity-0"}>_</span>
        </span>
      </p>
    );
  };

  return (
    <div className="relative flex flex-col justify-center items-center py-6 min-h-[450px] text-white overflow-hidden">
      <motion.div
        key={
          selectedMode
            ? (category && selectedMode === "vocabHit") ||
              (difficulty && selectedMode === "missingWord") ||
              (style && selectedMode === "wordForge") ||
              (thread && selectedMode === "wordVerse")
              ? "game"
              : selectedMode
            : "mode"
        }
        initial="hidden"
        animate="visible"
        exit="exit"
        custom={direction === -1}
        variants={variants}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center justify-center w-full"
      >
        {(selectedMode && !category && selectedMode === "vocabHit") ||
        (!difficulty && selectedMode === "missingWord") ||
        (!style && selectedMode === "wordForge") ||
        (!thread && selectedMode === "wordVerse") ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`flex flex-col md:flex-row justify-between items-center w-[80%] max-w-3xl ${modeStyles[selectedMode].gradient} ${modeStyles[selectedMode].border} rounded-sm mode-${selectedMode}`}
            >
              <div className="w-full md:w-1/3 p-4 flex justify-center items-center border-b md:border-b-0 md:border-r border-opacity-50 border-inherit h-full">
                <h2 className={`text-lg font-orbitron font-semibold text-center md:text-center ${modeStyles[selectedMode].text}`}>
                  {modeStyles[selectedMode].header}
                </h2>
              </div>
              <div className="w-full md:w-2/3 p-4 md:pl-4 text-center md:text-left">
                <p className={`text-sm lg:text-lg font-orbitron ${modeStyles[selectedMode].directiveColor} mb-1`}>Protocol</p>
                <p className="text-[14px] text-gray-300 font-roboto-mono">{modeStyles[selectedMode].instruction}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`relative w-[80%] max-w-3xl h-auto min-h-[300px] pb-14 md:pb-16 pt-8 md:pt-10 border border-t-0 border-gray-700 rounded-sm flex flex-col items-center justify-center gap-6`}
            >
              <TypingText text={modeStyles[selectedMode].subtext} color={modeStyles[selectedMode].text} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 justify-items-center gap-y-4 w-[90%]"
              >
                {vectorData[selectedMode].map(({ key, name, description, border, text, shadow }, index) => (
                  <div
                    key={key}
                    className={`w-[80%] max-w-[300px] ${index === 2 ? "col-span-full justify-self-center" : "justify-self-center"}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, letterSpacing: "10px" }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                      className={`vector-button w-full h-[50px] md:h-[60px] bg-gray-900 bg-opacity-70 border-2 rounded-sm cursor-pointer ${border} ${shadow}`}
                      onClick={getVectorHandler(selectedMode, key)}
                    >
                      <p className={`text-lg md:text-xl font-orbitron font-semibold text-center h-full flex items-center justify-center ${text}`}>
                        {name}
                      </p>
                    </motion.div>
                    <div className={`w-full bg-gray-900 bg-opacity-50 border-l border-r border-b border-gray-500 border-opacity-10 rounded-b-md px-3 py-1`}>
                      <p className="text-[11px] md:text-[13px] text-gray-400 font-roboto-mono text-center">{description}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </>
        ) : selectedMode === "vocabHit" ? (
          <VocabHit category={category} />
        ) : selectedMode === "missingWord" ? (
          <MissingWord difficulty={difficulty} />
        ) : selectedMode === "wordForge" ? (
          <WordForge style={style} />
        ) : (
          <WordVerse thread={thread} />
        )}
      </motion.div>
    </div>
  );
};

export default ModuleMenu;