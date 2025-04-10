"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

const initialPrompt = `
You are an AI assistant for a vocabulary game with three tasks:
1. **Check Answer**: For a clue "{clue}", user input "{input}", and category "{category}" (emotions: feelings, actions: verbs, general: others), reply "1" if the input matches the clue's meaning or is a synonym, fits the category, and isn’t in the clue; reply "0" otherwise. Use standard English, ignore case, be precise.
2. **Generate Sentences**: For a list of words "{word1},{word2},...,{wordN}" and category "{category}", return a list of short, simple sentences (5-8 words each) using each word, fitting the category, in the format "sentence1|sentence2|...|sentenceN".
3. **Get Synonym**: For a word "{word}" and category "{category}", return a synonym fitting the category.
`;

export default function VocabHit({ category }) {
  const [clues, setClues] = useState([]);
  const [remainingIndices, setRemainingIndices] = useState([]);
  const [currentClue, setCurrentClue] = useState(null);
  const [input, setInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [serialCount, setSerialCount] = useState(1);
  const [isGameReady, setIsGameReady] = useState(false);
  const [roundResults, setRoundResults] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const initializedRef = useRef(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const logLargeRef = useRef(null);
  const logSmallRef = useRef(null);

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const initialize = useCallback(async () => {
    setIsGameReady(false);
    try {
      const chat = await model.startChat({
        history: [{ role: "user", parts: [{ text: initialPrompt }] }],
      });
      chatRef.current = chat;

      const testResponse = await chat.sendMessage(
        `Check Answer: Clue: "feeling of joy", Input: "happiness", Category: "emotions"`
      );
      const testReply = await testResponse.response.text().trim();
      if (testReply !== "1" && testReply !== "0") {
        console.error("Chat test failed:", testReply);
        throw new Error("Chat initialization failed");
      }

      const res = await fetch("/data/vocabHit.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch vocab data");
      const vocabData = await res.json();
      const filteredClues = vocabData.filter((item) => item.category === category);

      setClues(filteredClues);
      setRemainingIndices(filteredClues.map((_, i) => i));
      setIsGameReady(true);
    } catch (error) {
      console.error("Error initializing:", error);
      setIsGameReady(true); // Proceed even if chat fails
    }
  }, [category]);

  useEffect(() => {
    if (!initializedRef.current) {
      initialize();
      initializedRef.current = true;
    }
  }, [initialize]);

  useEffect(() => {
    if (isGameReady && clues.length > 0 && !currentClue) {
      setNextClue();
    }
  }, [isGameReady, clues, currentClue]);

  useEffect(() => {
    if (timer === 0) {
      handleGameOverPrep();
    } else if (isGameReady && !gameOver) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isGameReady, gameOver]);

  useEffect(() => {
    if (logLargeRef.current) {
      logLargeRef.current.scrollTop = logLargeRef.current.scrollHeight;
    }
    if (logSmallRef.current) {
      logSmallRef.current.scrollTop = logSmallRef.current.scrollHeight;
    }
  }, [roundResults]);

  const setNextClue = useCallback(() => {
    if (remainingIndices.length === 0) {
      handleGameOverPrep();
      return;
    }
    const idx = Math.floor(Math.random() * remainingIndices.length);
    const newClueIndex = remainingIndices[idx];
    setCurrentClue(clues[newClueIndex]);
    setRemainingIndices((prev) => prev.filter((i) => i !== newClueIndex));
    setInput("");
    setIsCorrect(null);
    setCorrectAnswer("");
    setDiagnostics("Core: 13K | Sig: 92% | Flux: 0.7 mT");
    setTimeout(() => inputRef.current?.focus(), 0); // Ensure focus after render
  }, [clues, remainingIndices]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !chatRef.current || isCorrect !== null) return;
    setIsCorrect(null);

    try {
      const checkResponse = await chatRef.current.sendMessage(
        `Check Answer: Clue: "${currentClue.clue}", Input: "${input}", Category: "${category}"`
      );
      const aiReply = await checkResponse.response.text().trim();
      const isAnswerCorrect = aiReply === "1";
      setIsCorrect(isAnswerCorrect);
      setCorrectAnswer(currentClue.word);

      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      setRoundResults((prev) => [
        ...prev,
        {
          serial: serialCount,
          clue: currentClue.clue,
          input,
          result: isAnswerCorrect ? "Hit" : "Miss",
          correctWord: currentClue.word,
          secondWord: currentClue.secondWord,
          sentence: "",
          time: timeString,
        },
      ]);

      if (isAnswerCorrect) {
        setScore((prev) => prev + 1);
      }

      setTimeout(() => {
        setNextClue();
        setSerialCount((prev) => prev + 1);
      }, 800);
    } catch (error) {
      console.error("Chat error:", error);
      setIsCorrect(false);
      setCorrectAnswer(currentClue.word);
      setTimeout(() => {
        setNextClue();
        setSerialCount((prev) => prev + 1);
      }, 800);
    }
  }, [input, isCorrect, currentClue, category, serialCount, setNextClue]);

  const handleGameOverPrep = useCallback(async () => {
    setShowTransition(true);
    try {
      if (roundResults.length > 0) {
        const words = roundResults.map((r) => r.correctWord).join(",");
        const sentenceResponse = await chatRef.current.sendMessage(
          `Generate Sentences: Words: "${words}", Category: "${category}"`
        );
        const sentences = (await sentenceResponse.response.text().trim()).split("|");
        setRoundResults((prev) =>
          prev.map((r, i) => ({
            ...r,
            sentence: sentences[i] || "N/A",
          }))
        );
      }
    } catch (error) {
      console.error("Sentence generation error:", error);
      setRoundResults((prev) =>
        prev.map((r) => ({ ...r, sentence: "N/A" }))
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setShowTransition(false);
    setGameOver(true);
  }, [roundResults, category]);

  const handleReset = useCallback(() => {
    setTimer(60);
    setScore(0);
    setGameOver(false);
    setSerialCount(1);
    setInput("");
    setIsCorrect(null);
    setCorrectAnswer("");
    setCurrentClue(null);
    setRoundResults([]);
    setShowDetails(false);
    setShowTransition(false);
    setIsGameReady(false);
    setDiagnostics(null);
    initializedRef.current = false;
    initialize();
  }, [initialize]);

  if (!isGameReady) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] w-full text-white">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-3 relative">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-[targetPulse_1.5s_infinite]"></div>
              <div className="absolute top-1/2 left-1/2 w-[3px] h-[3px] rounded-full bg-amber-400 transform -translate-x-1/2 -translate-y-1/2 animate-[lockZoom_1s_infinite]"></div>
            </div>
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-[targetPulse_1.5s_infinite_0.2s]"></div>
              <div className="absolute top-1/2 left-1/2 w-[3px] h-[3px] rounded-full bg-amber-400 transform -translate-x-1/2 -translate-y-1/2 animate-[lockZoom_1s_infinite_0.2s]"></div>
            </div>
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-[targetPulse_1.5s_infinite_0.4s]"></div>
              <div className="absolute top-1/2 left-1/2 w-[3px] h-[3px] rounded-full bg-amber-400 transform -translate-x-1/2 -translate-y-1/2 animate-[lockZoom_1s_infinite_0.4s]"></div>
            </div>
          </div>
          <p className="text-lg text-gray-300 font-centauri">Targeting...</p>
        </div>
      </div>
    );
  }

  if (showTransition) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] w-[80%] md:w-2/3 lg:w-1/2 max-w-[600px] text-white">
        <div className="relative w-full h-32 bg-gray-950 bg-opacity-50 border-2 border-amber-800 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.3)] overflow-hidden">
          <div className="relative z-10 flex items-center gap-6">
            <p className="text-[18px] md:text-[20px] font-orbitron text-amber-300 tracking-wider">
              Processing Data...
            </p>
            <motion.div
              className="w-[2px] h-6 bg-amber-400 origin-center"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (gameOver && !showDetails) {
    const roundsCompleted = serialCount - 1;
    const accuracy = roundsCompleted > 0 ? ((score / roundsCompleted) * 100).toFixed(1) : "0.0";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col h-[70vh] justify-center items-center w-[90%] md:w-3/4 lg:w-2/3 text-white"
      >
        <h1
          className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide mb-2 typing"
          style={{ textShadow: "0 0 8px rgba(249, 115, 22, 0.8)" }}
        >
          Phase Complete
        </h1>
        <p className="text-sm md:text-base text-gray-400 font-mono mb-6">Core Stable</p>
        <div className="bg-gray-950 bg-opacity-90 border-2 border-amber-900 rounded-md p-4 w-[80vw] max-w-[300px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-300 font-mono text-lg">
            <span className="text-amber-400 font-bold">Score</span>
            <span>[{score}]</span>
            <span className="text-amber-400 font-bold">Rounds</span>
            <span>[{roundsCompleted}]</span>
            <span className="text-amber-400 font-bold">Accuracy</span>
            <span>[{accuracy}%]</span>
            <span className="text-amber-400 font-bold">Category</span>
            <span>[{category === "emotion" ? "Aether" : category === "action" ? "Surge" : "Nexus"}]</span>
          </div>
        </div>
        <div className="mt-6 flex w-[80%] max-w-[250px] flex-col gap-4 font-orbitron">
          <button
            onClick={handleReset}
            className="px-8 py-2 bg-amber-700 bg-opacity-50 border-2 border-amber-600 text-gray-200 text-lg rounded-sm hover:tracking-[4px] transition-all"
          >
            Forge Again
          </button>
          <button
            onClick={() => setShowDetails(true)}
            className="px-6 py-2 bg-gray-950 bg-opacity-50 border-2 border-amber-800 text-amber-600 text-lg rounded-sm hover:tracking-[4px] transition-all"
          >
            See Details
          </button>
        </div>
      </motion.div>
    );
  }

  if (gameOver && showDetails) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col h-[70vh] justify-center items-center w-[90%] md:w-3/4 lg:w-2/3 max-w-[800px] text-white"
      >
        <h1
          className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide mb-6"
          style={{ textShadow: "0 0 8px rgba(249, 115, 22, 0.5)" }}
        >
          Vocab Details
        </h1>
        <div
          className="w-full max-h-[400px] overflow-y-auto bg-gray-950 bg-opacity-50 border-2 border-amber-800 rounded-md p-2 shadow-inner"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#f59e0b transparent" }}
        >
          {roundResults.length === 0 ? (
            <p className="text-[14px] md:text-[16px] lg:text-lg text-gray-400 font-mono text-center py-5">
              No rounds completed :(
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr] py-2 border-b border-gray-700 text-[10px] md:text-[12px] lg:text-[14px] font-mono text-amber-400 bg-gray-900 bg-opacity-30">
                <span className="px-1 text-center">#</span>
                <span className="px-1 text-center">Clue</span>
                <span className="px-1 text-center">Input</span>
                <span className="px-1 text-center">Result</span>
                <span className="px-1 text-center">~Answer</span>
              </div>
              {roundResults.slice(0, serialCount - 1).map((result) => (
                <div key={result.serial} className="grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr] py-2 border-b border-gray-700 last:border-b-0 text-[10px] md:text-[12px] lg:text-[14px] font-mono">
                  <span className="px-1 text-center text-gray-300">#{result.serial}</span>
                  <span className="px-1 text-left text-gray-300 break-words">{result.clue}</span>
                  <span className="px-1 text-center text-gray-300">{result.input || "-"}</span>
                  <span className={`px-1 text-center ${result.result === "Hit" ? "text-green-400" : "text-red-400"}`}>
                    {result.result}
                  </span>
                  <span className="px-1 text-center text-gray-300">{result.correctWord}</span>
                  <p className="col-span-5 text-center text-white mt-1 italic">
                    {(() => {
                      const words = result.sentence.split(" ");
                      const target = result.correctWord.toLowerCase();
                      const getScore = (w, t) =>
                        [...w].reduce((s, ch, i) => s + (ch === t[i] ? 1 : 0), 0);

                      let maxIdx = -1, maxScore = -1;
                      words.forEach((word, i) => {
                        const w = word.toLowerCase();
                        const score = getScore(w, target);
                        if (score > maxScore) [maxScore, maxIdx] = [score, i];
                      });

                      return words.map((word, i) => (
                        <span key={i} className={i === maxIdx && maxScore > 0 ? "text-amber-400 font-bold" : ""}>
                          {word + " "}
                        </span>
                      ));
                    })()}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
        <button
          onClick={() => setShowDetails(false)}
          className="mt-6 px-8 py-2 bg-amber-700 border-amber-700 border-2 font-sans font-medium text-lg text-white rounded-md hover:bg-amber-600"
        >
          Back
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col w-full h-auto justify-center items-center">
      <style jsx global>{`
        @keyframes spark { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } 100% { opacity: 0; transform: scale(1); } }
        @keyframes targetPulse { 0% { transform: scale(0.8); opacity: 0.7; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.7; } }
        @keyframes holoBlink { 0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; } }
        @keyframes typing { 0% { content: ""; } 50% { content: "_"; } 100% { content: ""; } }
        .typing::after { content: "_"; animation: typing 1s infinite; }
        body { overflow: hidden; }
        .log-container::-webkit-scrollbar { width: 3px; }
        .log-container::-webkit-scrollbar-track { background: transparent; }
        .log-container::-webkit-scrollbar-thumb { background: #f59e0b; border-radius: 3px; }
        .log-container::-webkit-scrollbar-button { display: none; }
      `}</style>
      <div className="flex flex-col lg:flex-row items-center justify-center w-full gap-0">
        <div className="flex flex-col justify-center w-[90%] md:w-[80%] lg:w-3/5 max-w-[600px] items-center">
          <div className="w-[40%] md:w-1/4 lg:w-2/5 sm:max-w-[200px] md:max-w-[300px]">
            <div className="bg-gray-900 bg-opacity-80 border-2 border-b-0 border-amber-600 rounded-t-sm p-2 flex justify-center items-center shadow-[0_0_8px_rgba(249,115,22,0.5)]">
              <p className="text-[18px] md:text-[20px] font-orbitron text-amber-400 tracking-wider">
                {timer.toString().padStart(2, "0")}<span className="text-amber-300 text-[14px] md:text-[16px]">s</span>
              </p>
            </div>
          </div>
          <div className="relative flex flex-col p-5 bg-gray-950 bg-opacity-50 border-[2px] border-amber-800 rounded-sm w-full items-center h-auto text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]">
            <div className="flex justify-between items-center w-full mb-4 relative">
              <div className="flex items-center space-x-2 bg-gray-800 bg-opacity-60 border-2 border-amber-600 rounded-sm px-3 py-1 shadow-[0_0_6px_rgba(249,115,22,0.4)]">
                <span className="text-amber-400 text-[16px] md:text-[18px] font-orbitron tracking-wider">
                  #{serialCount}
                </span>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <motion.span
                  className="text-amber-400 text-[10px] md:text-[12px] font-orbitron tracking-wider opacity-70"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  SYNC
                </motion.span>
              </div>
              <div
                className={`px-3 py-1 rounded-sm border text-lg bg-opacity-20 ${
                  category === "emotion"
                    ? "border-purple-600 text-purple-400 bg-purple-900"
                    : category === "action"
                    ? "border-teal-600 text-teal-400 bg-teal-900"
                    : "border-cyan-600 text-cyan-400 bg-cyan-900"
                }`}
              >
                {category === "emotion" ? "A" : category === "action" ? "S" : "N"}
              </div>
            </div>
            <div className="relative w-full min-h-[150px] bg-amber-950 bg-opacity-30 border border-amber-800 rounded-sm flex flex-col items-center justify-center px-6 mb-6 text-center shadow-inner">
              <motion.h1
                key={serialCount}
                className="text-[16px] md:text-lg lg:text-xl font-mono text-gray-300 tracking-wide overflow-hidden break-words leading-relaxed w-full"
                initial={{ y: 0 }}
                animate={{ y: isCorrect !== null ? -10 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {currentClue?.clue}
              </motion.h1>
              {isCorrect !== null && (
                <motion.div
                  className="flex flex-col items-center space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 5 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isCorrect ? (
                    <>
                      <div
                        className="bg-green-900 bg-opacity-80 border-2 border-green-500 rounded-sm px-4 py-2 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                        style={{ textShadow: "0 0 5px rgba(34, 197, 94, 0.9)" }}
                      >
                        <p className="text-green-300 text-lg md:text-xl font-orbitron font-extrabold tracking-wider">
                          Hit!
                        </p>
                      </div>
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-green-500 rounded-full"
                          initial={{ x: 0, y: 0, opacity: 1 }}
                          animate={{ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 100, opacity: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="bg-red-900 bg-opacity-80 border-2 border-red-500 rounded-sm px-4 py-2 shadow-[0_0_10px_rgba(239,68,68,0.7)]">
                      <p className="text-red-300 text-lg md:text-xl font-orbitron font-extrabold tracking-wider">
                        Miss!
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
            <div className="flex flex-col items-center w-full max-w-[400px] space-y-2">
              <div className="flex items-center w-full space-x-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[a-zA-Z]*$/.test(value) && value.length <= 20) setInput(value);
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={isCorrect !== null}
                  spellCheck={false}
                  className="w-full p-2.5 md:p-3 text-[16px] md:text-xl bg-gray-800 border border-amber-600 rounded-sm text-gray-200 focus:outline-none focus:ring-0 focus:border-amber-500"
                  placeholder="Type the word..."
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isCorrect !== null}
                  className="w-14 h-12 bg-amber-700 rounded-sm flex items-center justify-center text-white hover:bg-amber-600 disabled:bg-gray-600 transition-all cursor-default"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:flex justify-center items-center hidden w-[32px] h-[50px] border-t-4 border-b-4 mt-10 border-amber-700 border-opacity-60"></div>
        <div className="lg:flex hidden flex-col w-full max-w-[150px] p-1 mt-12 items-center gap-0 rounded-sm border-2 border-amber-700 border-opacity-60">
          <div className="w-full p-2 flex flex-col bg-gray-950 bg-opacity-50">
            <div className="text-[14px] md:text-sm lg:text-[18px] font-orbitron text-amber-400 typing mb-1">Log</div>
            <div
              className={`text-[12px] md:text-[14px] lg:text-sm font-roboto-mono mb-2 ${
                category === "emotion" ? "text-purple-400" : category === "action" ? "text-teal-400" : "text-cyan-400"
              }`}
            >
              [{category === "emotion" ? "Aether" : category === "action" ? "Surge" : "Nexus"}]
            </div>
            <div className="w-full border-t border-gray-500 border-opacity-30 mb-2"></div>
            <div ref={logLargeRef} className="h-[240px] overflow-y-auto log-container pr-2">
              {roundResults.length === 0 ? (
                <p className="text-[11px] text-amber-400/60 font-mono italic text-center mt-20">Awaiting Log...</p>
              ) : (
                roundResults.map((result) => (
                  <div key={result.serial} className="flex justify-between items-center text-[11px] font-mono text-gray-300 py-1.5">
                    <div className={`w-3 h-3 ${result.result === "Hit" ? "bg-amber-400" : "bg-gray-500"}`}></div>
                    <span>{`[${result.serial}] ${result.time}`}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="lg:hidden h-[32px] w-[50px] border-l-4 border-r-4 border-amber-700 border-opacity-60"></div>
        <div className="lg:hidden flex flex-col w-[90%] md:w-[80%] max-w-[600px] gap-0 rounded-sm border-2 border-amber-700 border-opacity-60">
          <div className="p-2 flex flex-col bg-gray-950 bg-opacity-50" style={{ height: "150px" }}>
            <div className="text-[14px] md:text-sm lg:text-[18px] font-orbitron text-amber-400 typing mb-1">Log</div>
            <div
              className={`text-[12px] md:text-[14px] lg:text-sm font-roboto-mono mb-2 ${
                category === "emotion" ? "text-purple-400" : category === "action" ? "text-teal-400" : "text-cyan-400"
              }`}
            >
              [{category === "emotion" ? "Aether" : category === "action" ? "Surge" : "Nexus"}]
            </div>
            <div className="w-full border-t border-gray-500 border-opacity-30 mb-2"></div>
            <div ref={logSmallRef} className="h-[calc(100%-60px)] overflow-y-auto log-container pr-2">
              {roundResults.length === 0 ? (
                <p className="text-[11px] text-amber-400/60 font-mono italic text-center mt-8">Awaiting Log...</p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {roundResults.map((result) => (
                    <div key={result.serial} className="flex px-1.5 sm:px-4 md:px-6 justify-between items-center text-[11px] font-mono text-gray-300 py-1 border-r border-gray-500 border-opacity-30 last:border-r-0">
                      <div className={`w-3 h-3 ${result.result === "Hit" ? "bg-amber-400" : "bg-gray-500"}`}></div>
                      <span>{`[${result.serial}] ${result.time}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }}></div>
    </div>
  );
}