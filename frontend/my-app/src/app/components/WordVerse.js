"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

const initialPrompt = `
You are an AI expert for a word game. Task: Check if "{input}" is valid for thread "{thread}" ("Ally" or "Rival"), starter "{starter}", and context "{context}" ("direct" or "twist"). Reply "1" for valid, "0" for invalid. Ignore case, use standard English.

Rules:
- "Ally": Input must be a synonym or same category as starter, matching context.
  - "direct": Physical/literal meaning (e.g., "glow" → "shine" = 1, "radiance" = 0).
  - "twist": Figurative/abstract meaning (e.g., "glow" → "radiance" = 1, "shine" = 0).
- "Rival": Input must be an opposite or contrast to starter, matching context.
  - "direct": Physical/literal opposite (e.g., "hot" → "cold" = 1, "dull" = 0).
  - "twist": Figurative/abstract contrast (e.g., "hot" → "dull" = 1, "cold" = 0).
- Context is strict. No overlap between direct/twist. Input cannot match starter.

Examples:
- "Ally", "bright", "direct": "clear" = 1, "smart" = 0.
- "Ally", "bright", "twist": "smart" = 1, "clear" = 0.
- "Rival", "bright", "direct": "dark" = 1, "dull" = 0.
- "Rival", "bright", "twist": "dull" = 1, "dark" = 0.

Reply only "1" or "0".`;

export default function WordVerse({ thread }) {
  const [clues, setClues] = useState([]);
  const [remainingIndices, setRemainingIndices] = useState([]);
  const [currentPair, setCurrentPair] = useState(["", ""]);
  const [currentContext, setCurrentContext] = useState("");
  const [input, setInput] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(300);
  const [gameOver, setGameOver] = useState(false);
  const [serialCount, setSerialCount] = useState(1);
  const [isGameReady, setIsGameReady] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [roundResults, setRoundResults] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const initializedRef = useRef(false);
  const gameOverTriggeredRef = useRef(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const logLargeRef = useRef(null);
  const logSmallRef = useRef(null);

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const generateRandomProgress = (current, max = 90) => {
    const increment = Math.floor(Math.random() * 15) + 5; // Random 5-20%
    return Math.min(current + increment, max);
  };

  const getRandomInterval = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const initialize = useCallback(async () => {
    setIsGameReady(false);
    setLoadProgress(0);
    try {
      await new Promise((resolve) => setTimeout(resolve, getRandomInterval(150, 300)));
      setLoadProgress(generateRandomProgress(0, 20)); // 5-20%
      await new Promise((resolve) => setTimeout(resolve, getRandomInterval(100, 250)));
      setLoadProgress(generateRandomProgress(20, 40)); // 25-40%
      const chat = await model.startChat({
        history: [{ role: "user", parts: [{ text: initialPrompt }] }],
      });
      chatRef.current = chat;

      await new Promise((resolve) => setTimeout(resolve, getRandomInterval(200, 350)));
      setLoadProgress(generateRandomProgress(40, 60)); // 45-60%
      const testResponse = await chat.sendMessage(
        `Check: Thread: "Ally" | Starter: "glow" | Input: "shine" | Context: "direct"`
      );
      const testReply = await testResponse.response.text().trim();
      if (testReply !== "1" && testReply !== "0") {
        console.error("Chat test failed:", testReply);
        throw new Error("Chat initialization failed");
      }
      await new Promise((resolve) => setTimeout(resolve, getRandomInterval(150, 300)));
      setLoadProgress(generateRandomProgress(60, 80)); // 65-80%

      await new Promise((resolve) => setTimeout(resolve, getRandomInterval(100, 200)));
      setLoadProgress(generateRandomProgress(80, 90)); // 85-90%
      const res = await fetch("/data/wordVerse.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch clues");
      const vocabData = await res.json();
      setClues(vocabData[thread]);
      setRemainingIndices(
        Array.from({ length: vocabData[thread].length }, (_, i) => i)
      );

      await new Promise((resolve) => setTimeout(resolve, getRandomInterval(200, 400)));
      setLoadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCountdown(3);
    } catch (error) {
      console.error("Error initializing:", error);
      await new Promise((resolve) => setTimeout(resolve, getRandomInterval(150, 300)));
      setLoadProgress(generateRandomProgress(loadProgress, 90));
      await new Promise((resolve) => setTimeout(resolve, getRandomInterval(100, 200)));
      setLoadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCountdown(3);
    }
  }, [thread]);

  const handleGameOverPrep = useCallback(async () => {
    if (gameOverTriggeredRef.current) return;
    gameOverTriggeredRef.current = true;

    setShowTransition(true);
    setLoadProgress(0);

    await new Promise((resolve) => setTimeout(resolve, getRandomInterval(100, 250)));
    setLoadProgress(generateRandomProgress(0, 25)); // 5-25%
    await new Promise((resolve) => setTimeout(resolve, getRandomInterval(150, 300)));
    setLoadProgress(generateRandomProgress(25, 50)); // 30-50%
    await new Promise((resolve) => setTimeout(resolve, getRandomInterval(100, 200)));
    setLoadProgress(generateRandomProgress(50, 75)); // 55-75%
    await new Promise((resolve) => setTimeout(resolve, getRandomInterval(150, 250)));
    setLoadProgress(generateRandomProgress(75, 90)); // 80-90%
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoadProgress(100);
    await new Promise((resolve) => setTimeout(resolve, 800));

    setShowTransition(false);
    setGameOver(true);
    setTimeout(() => {
      gameOverTriggeredRef.current = false;
    }, 0);
  }, []);

  const setNextPair = useCallback(() => {
    if (remainingIndices.length === 0) {
      if (!gameOverTriggeredRef.current) {
        handleGameOverPrep();
      }
      return;
    }
    const idx = Math.floor(Math.random() * remainingIndices.length);
    const newClueIndex = remainingIndices[idx];
    setCurrentPair([clues[newClueIndex].word, ""]);
    setCurrentContext(clues[newClueIndex].context);
    setRemainingIndices((prev) => prev.filter((i) => i !== newClueIndex));
    setInput("");
    setIsCorrect(null);
    setCorrectAnswer("");
  }, [clues, remainingIndices, handleGameOverPrep]);


  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !chatRef.current || isCorrect !== null) return;
    setIsCorrect(null);

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const matchingClue = clues.find((c) => c.word === currentPair[0]);
    const expectedWord = matchingClue?.answer || "";

    try {
      const checkResponse = await chatRef.current.sendMessage(
        `Check: Thread: "${thread}" | Starter: "${currentPair[0]}" | Input: "${input}" | Context: "${currentContext}"`
      );
      const aiReply = await checkResponse.response.text().trim();
      const isAnswerCorrect = aiReply === "1";

      setIsCorrect(isAnswerCorrect);
      setCorrectAnswer(expectedWord);

      setRoundResults((prev) => [
        ...prev,
        {
          serial: serialCount,
          starter: currentPair[0],
          input,
          result: isAnswerCorrect ? "Locked" : "Missed",
          correctAnswer: expectedWord,
          context: currentContext,
          time: timeString,
        },
      ]);

      if (isAnswerCorrect) setScore((prev) => prev + 1);

      setTimeout(() => {
        setSerialCount((prev) => prev + 1);
        setNextPair();
      }, 800);
    } catch (error) {
      console.error("Chat error:", error);
      setIsCorrect(false);
      setCorrectAnswer(expectedWord);
      setRoundResults((prev) => [
        ...prev,
        {
          serial: serialCount,
          starter: currentPair[0],
          input,
          result: "Missed",
          correctAnswer: expectedWord,
          context: currentContext,
          time: timeString,
        },
      ]);
      setTimeout(() => {
        setSerialCount((prev) => prev + 1);
        setNextPair();
      }, 800);
    }
  }, [input, isCorrect, currentPair, currentContext, thread, serialCount, setNextPair]);

  const handleReset = useCallback(() => {
    setTimer(60);
    setScore(0);
    setSerialCount(1);
    setGameOver(false);
    setInput("");
    setIsCorrect(null);
    setCorrectAnswer("");
    setCurrentPair(["", ""]);
    setCurrentContext("");
    setRoundResults([]);
    setShowDetails(false);
    setShowTransition(false);
    setIsGameReady(false);
    setClues([]);
    setRemainingIndices([]);
    setCountdown(null);
    setLoadProgress(0);
    initializedRef.current = false;
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!initializedRef.current) {
      initialize();
      initializedRef.current = true;
    }
  }, [initialize]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      setIsGameReady(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (isGameReady && clues.length > 0 && !currentPair[0]) {
      setNextPair();
    }
  }, [isGameReady, clues, setNextPair]);

  useEffect(() => {
    if (timer === 0 && !gameOverTriggeredRef.current) {
      handleGameOverPrep();
    } else if (isGameReady && !gameOver) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isGameReady, gameOver, handleGameOverPrep]);

  useEffect(() => {
    if (logLargeRef.current) {
      logLargeRef.current.scrollTop = logLargeRef.current.scrollHeight;
    }
    if (logSmallRef.current) {
      logSmallRef.current.scrollTop = logSmallRef.current.scrollHeight;
    }
  }, [roundResults]);

  if (!isGameReady && countdown === null) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] w-full text-white">
        <div className="flex flex-col items-center justify-center">
          <div className="flex space-x-4 mb-2">
            <div className={`w-4 h-4 bg-green-500 clip-glyph animate-glyph-spin`}></div>
            <div className={`w-4 h-4 bg-green-500 clip-glyph animate-glyph-spin`}></div>
            <div className={`w-4 h-4 bg-green-500 clip-glyph animate-glyph-spin`}></div>
          </div>
          <p className="text-lg text-gray-300 font-centauri">Warping...</p>
          <p className="text-sm text-green-400 font-roboto-mono">[{loadProgress}%]</p>
        </div>
      </div>
    );
  }

  if (showTransition) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] w-[80%] md:w-2/3 lg:w-1/2 max-w-[600px] text-white">
        <div className="relative w-full h-32 bg-gray-950 bg-opacity-50 border-2 border-green-900 rounded-sm flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <p className="text-[18px] md:text-[20px] font-orbitron text-green-400 tracking-wider">
              Processing Data...
            </p>
            <div className="relative flex justify-center items-center w-6 h-6 rounded-full border border-green-500">
              <motion.div
                className="absolute top-[3px] w-3 h-3 bg-green-500"
                style={{
                  clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                  transformOrigin: "50% 66.67%",
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            </div>
          </div>
          <p className="absolute bottom-6 text-sm text-green-400 font-mono">[{loadProgress}%]</p>
        </div>
      </div>
    );
  }

  if (gameOver && !showDetails) {
    const roundsCompleted = serialCount - 1;
    const accuracy = roundsCompleted > 0 ? ((score / roundsCompleted) * 100).toFixed(1) : "0.0";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col h-[70vh] justify-center items-center w-[80%] md:w-2/5 text-white"
      >
        <div className="w-[80vw] max-w-[350px] flex flex-col border-2 border-b-0 border-green-900 py-4 text-center">
          <h1
            className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide mb-1 typing"
            style={{ textShadow: "0 0 8px rgba(34, 197, 94, 0.8)" }}
          >
            Phase Complete_
          </h1>
          <p className="text-sm md:text-base text-gray-400 font-mono">[Core Stable]</p>
        </div>
        <div className="bg-gray-950 bg-opacity-40 border-2 border-green-900 rounded-sm p-4 w-[80vw] max-w-[350px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-300 font-roboto-mono text-lg">
            <span className="text-green-400 font-bold">Score</span>
            <span>[{score}]</span>
            <span className="text-green-400 font-bold">Rounds</span>
            <span>[{roundsCompleted}]</span>
            <span className="text-green-400 font-bold">Accuracy</span>
            <span>[{accuracy}%]</span>
            <span className="text-green-400 font-bold">Category</span>
            <span>[{thread === "ally" ? "Ally" : "Rival"}]</span>
          </div>
        </div>
        <div className="mt-6 flex w-[80%] max-w-[250px] flex-col gap-4 font-orbitron">
          <button
            onClick={handleReset}
            className="px-8 py-2 bg-green-700 bg-opacity-50 border-2 border-green-600 text-gray-200 text-lg rounded-sm hover:tracking-[4px] transition-all"
          >
            Warp Again
          </button>
          <button
            onClick={() => setShowDetails(true)}
            className="px-6 py-2 bg-gray-950 bg-opacity-50 border-2 border-green-800 text-green-600 text-lg rounded-sm hover:tracking-[4px] transition-all"
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
          style={{ textShadow: "0 0 8px rgba(34, 197, 94, 0.5)" }}
        >
          Warp Details
        </h1>
        <div
          className="w-full max-h-[400px] overflow-y-auto bg-gray-950 bg-opacity-50 border-2 border-green-900 rounded-sm p-2 shadow-inner"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#22c55e transparent" }}
        >
          {roundResults.length === 0 ? (
            <p className="text-[14px] md:text-[16px] lg:text-lg text-gray-400 font-mono text-center py-5">
              No interaction detected :(
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[0.7fr_1fr_1.5fr_1.5fr_1fr] py-2 border-b border-gray-700 text-[10px] md:text-[12px] lg:text-[14px] font-mono text-green-400 bg-gray-900 bg-opacity-30">
                <span className="px-1 text-center">#</span>
                <span className="px-1 text-center">Context</span>
                <span className="px-1 text-center">Word</span>
                <span className="px-1 text-center">Input</span>
                <span className="px-1 text-center">Result</span>
              </div>
              {roundResults.map((result, index) => (
                <div
                  key={`${result.serial}-${index}`}
                  className="grid grid-cols-[0.7fr_1fr_1.5fr_1.5fr_1fr] py-2 border-b border-gray-700 last:border-b-0 text-[10px] md:text-[12px] lg:text-[14px] font-mono"
                >
                  <span className="px-1 text-center text-gray-300">#{result.serial}</span>
                  <span className="px-1 text-center text-gray-300">{result.context}</span>
                  <span className="px-1 text-center text-gray-300">{result.starter}</span>
                  <span className="px-1 text-center text-gray-300">{result.input || "-"}</span>
                  <span
                    className={`px-1 text-center ${
                      result.result === "Locked" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {result.result}
                  </span>
                  <span className="col-span-5 px-1 mt-1 text-center text-white italic">
                    <span className="text-green-400 font-bold">Verbotron: </span>
                    {result.correctAnswer}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
        <button
          onClick={() => setShowDetails(false)}
          className="mt-6 px-8 py-2 bg-green-700 border-green-900 border-2 font-sans font-medium text-lg text-white rounded-sm hover:bg-green-600"
        >
          Back
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col w-full h-auto justify-center items-center">
      <style jsx global>{`
        @keyframes spark {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes targetPulse {
          0% { transform: scale(0.8); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.7; }
        }
        @keyframes holoBlink {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
        @keyframes typing {
          0% { content: ""; }
          50% { content: "_"; }
          100% { content: ""; }
        }
        @keyframes pulseGlow {
          0% { text-shadow: 0 0 5px rgba(34, 197, 94, 0.5); }
          50% { text-shadow: 0 0 15px rgba(34, 197, 94, 0.9); }
          100% { text-shadow: 0 0 5px rgba(34, 197, 94, 0.5); }
        }
        .typing::after {
          content: "_";
          animation: typing 1s infinite;
        }
        .hammer-pulse {
          animation: targetPulse 1.5s infinite;
        }
        .spark-fade {
          animation: spark 1s infinite;
          position: absolute;
        }
        .pulse-glow {
          animation: pulseGlow 1.5s infinite;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
        body {
          overflow: hidden;
        }
        .log-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="flex flex-col lg:flex-row items-center justify-center w-full gap-0">
        <div className="flex flex-col justify-center w-[90%] md:w-[80%] lg:w-3/5 max-w-[600px] items-center">
          <div className="w-[40%] md:w-1/4 lg:w-2/5 sm:max-w-[200px] md:max-w-[300px]">
            <div className="bg-gray-950 bg-opacity-50 border-2 border-b-0 border-green-900 rounded-t-sm p-2 flex justify-center items-center shadow-[0_0_10px_rgba(0,0,0,0.3)]">
              <p className="text-[18px] md:text-[20px] font-orbitron text-green-400 tracking-wider h-[28px] md:h-[32px]">
                {countdown === null && timer.toString().padStart(2, "0")}
                {countdown === null && (
                  <span className="text-green-300 text-[14px] md:text-[16px]">s</span>
                )}
              </p>
            </div>
          </div>
          <div className="relative flex flex-col p-5 bg-gray-950 bg-opacity-50 border-[2px] border-green-900 rounded-sm w-full items-center h-auto text-white shadow-[0_0_10px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-center w-full mb-4 relative h-[34px] md:h-[38px]">
              <div className="flex items-center justify-center space-x-2 bg-green-900 bg-opacity-20 border border-green-600 rounded-sm w-[56px] p-1">
                <span className="text-green-400 text-[14px] md:text-[16px] font-orbitron tracking-wider h-[24px] md:h-[26px]">
                  {countdown === null && `#${serialCount}`}
                </span>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <motion.span
                  className="text-green-400 text-[10px] md:text-[12px] font-orbitron tracking-wider opacity-70 h-[16px] md:h-[18px]"
                  animate={countdown === null ? { opacity: [0.4, 0.8, 0.4] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {countdown === null && "SYNC"}
                </motion.span>
              </div>
              <div
                className={`p-1 w-[56px] rounded-sm border text-lg bg-opacity-20 font-orbitron h-[34px] md:h-[38px] flex items-center justify-center ${
                  thread === "ally"
                    ? "border-blue-600 text-blue-400 bg-blue-900"
                    : "border-rose-600 text-rose-400 bg-rose-900"
                }`}
              >
                {countdown === null && (thread === "ally" ? "A" : "R")}
              </div>
            </div>
            <div className="relative w-full min-h-[180px] bg-green-950 bg-opacity-30 border border-green-900 rounded-sm flex flex-col items-center justify-center px-4 mb-6 text-center shadow-inner">
              {/* <div className="absolute top-2 left-2 text-[12px] md:text-[14px] lg:text-[16px] font-mono text-green-400 h-[18px] md:h-[20px]">
                {countdown === null && `[${currentContext}]`}
              </div> */}
              {countdown !== null ? (
                <motion.div
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-sm md:text-lg font-orbitron text-green-400 pulse-glow tracking-wider">
                    CORE LINK: {countdown}
                  </p>
                  <motion.div
                    className="w-4 h-4 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <p className="text-[12px] md:text-[14px] font-mono text-gray-400 italic">
                    Initializing module...
                  </p>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    key={serialCount}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full flex justify-center gap-4"
                  >
                    {currentPair.map((word, index) => (
                      <div
                        key={index}
                        className={`px-2 w-[60%] max-w-[150px] md:max-w-[180px] h-[40px] md:h-[50px] flex items-center justify-center text-[14px] md:text-sm lg:text-lg font-mono truncate ${
                          word
                            ? thread === "ally"
                              ? "text-gray-300 border-blue-500 bg-blue-800 bg-opacity-10"
                              : "text-gray-300 border-rose-500 bg-red-800 bg-opacity-10"
                            : "text-gray-400 border-gray-500 bg-gray-700 bg-opacity-10"
                        } border border-opacity-80`}
                      >
                        {word || (index === 1 && input) || "___"}
                      </div>
                    ))}
                  </motion.div>
                  {isCorrect !== null && (
                    <motion.div
                      className="mt-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 5 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      {isCorrect ? (
                        <>
                          <div
                            className="bg-green-900 bg-opacity-80 border-2 border-green-500 rounded-sm px-4 py-1.5 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                            style={{ textShadow: "0 0 5px rgba(34, 197, 94, 0.9)" }}
                          >
                            <p className="text-green-300 text-sm md:text-lg font-orbitron font-extrabold tracking-wider">
                              Warped!
                            </p>
                          </div>
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 bg-green-500 rounded-full"
                              initial={{ x: 0, y: 0, opacity: 1 }}
                              animate={{
                                x: (Math.random() - 0.5) * 200,
                                y: (Math.random() - 0.5) * 100,
                                opacity: 0,
                              }}
                              transition={{ duration: 0.2, delay: i * 0.03 }}
                            />
                          ))}
                        </>
                      ) : (
                        <div className="bg-red-900 bg-opacity-80 border-2 border-red-500 rounded-sm px-4 py-1.5 shadow-[0_0_10px_rgba(239,68,68,0.7)]">
                          <p className="text-red-300 text-sm md:text-lg font-orbitron font-extrabold tracking-wider">
                            Missed!
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
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
                    if (/^[a-zA-Z]*$/.test(value) && value.length <= 20) {
                      setInput(value);
                      setCurrentPair((prev) => [prev[0], value]);
                    }
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={isCorrect !== null || countdown !== null}
                  spellCheck={false}
                  className="w-full p-2.5 md:p-3 text-[16px] md:text-xl bg-gray-800 border border-green-900 rounded-sm text-gray-200 focus:outline-none focus:ring-0 focus:border-green-500"
                  placeholder={countdown === null ? `Enter ${thread === "ally" ? "ally" : "rival"}...` : ""}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isCorrect !== null || countdown !== null}
                  className="w-14 h-12 bg-green-700 rounded-sm flex items-center justify-center text-white hover:bg-green-600 disabled:bg-gray-600 transition-all cursor-default"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:flex justify-center items-center hidden w-[32px] h-[50px] border-t-4 border-b-4 mt-10 border-green-800 shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transformOrigin: "left" }}
          className="unfold lg:flex hidden flex-col w-full max-w-[150px] p-1 mt-12 items-center gap-0 rounded-sm border-2 border-green-800 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
        >
          <div className="w-full p-2 flex flex-col bg-gray-950 bg-opacity-50">
            <div className={`text-[14px] md:text-sm lg:text-[18px] font-orbitron text-green-400 ${countdown === null ? "typing": ""} mb-1 h-[22px] md:h-[24px]`}>
              {countdown === null && "Log"}
            </div>
            <div
              className={`text-[12px] md:text-[14px] lg:text-sm font-roboto-mono mb-2 h-[18px] md:h-[20px] ${
                thread === "ally" ? "text-blue-400" : "text-rose-400"
              }`}
            >
              {countdown === null && `[${thread === "ally" ? "Ally" : "Rival"}]`}
            </div>
            <div className="w-full border-t border-gray-500 border-opacity-30 mb-2"></div>
            <div ref={logLargeRef} className="h-[240px] overflow-y-auto log-container pr-2">
              {roundResults.length === 0 ? (
                <p className="text-[11px] text-green-400/60 font-mono italic text-center mt-20 h-[22px]">
                  {countdown === null && "Awaiting Log..."}
                </p>
              ) : (
                roundResults.map((result) => (
                  <div
                    key={result.serial}
                    className="flex justify-between items-center text-[11px] font-mono text-gray-300 py-1.5"
                  >
                    <div
                      className={`w-3 h-3 ${result.result === "Locked" ? "bg-green-400" : "bg-gray-500"}`}
                    ></div>
                    <span>{`[${result.serial}] ${result.time}`}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
        <div className="lg:hidden h-[32px] w-[50px] border-l-4 border-r-4 border-green-800 shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transformOrigin: "top" }}
          className="lg:hidden flex flex-col w-[90%] md:w-[80%] max-w-[500px] gap-0 rounded-sm border-2 border-green-800 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
        >
          <div className="p-2 flex flex-col bg-gray-950 bg-opacity-50" style={{ height: "150px" }}>
            <div className={`text-[14px] md:text-sm lg:text-[18px] font-orbitron text-green-400 ${countdown === null ? "typing" : ""} mb-1 h-[22px] md:h-[24px]`}>
              {countdown === null && "Log"}
            </div>
            <div
              className={`text-[12px] md:text-[14px] lg:text-sm font-roboto-mono mb-2 h-[18px] md:h-[20px] ${
                thread === "ally" ? "text-blue-400" : "text-rose-400"
              }`}
            >
              {countdown === null && `[${thread === "ally" ? "Ally" : "Rival"}]`}
            </div>
            <div className="w-full border-t border-gray-500 border-opacity-30 mb-2"></div>
            <div ref={logSmallRef} className="h-[calc(100%-60px)] overflow-y-auto log-container pr-2">
              {roundResults.length === 0 ? (
                <p className="text-[11px] text-green-400/60 font-mono italic text-center mt-8 h-[22px]">
                  {countdown === null && "Awaiting Log..."}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {roundResults.map((result) => (
                    <div
                      key={result.serial}
                      className="flex px-1.5 sm:px-4 md:px-6 justify-between items-center text-[11px] font-mono text-gray-300 py-1 border-r border-gray-500 border-opacity-30 last:border-r-0"
                    >
                      <div
                        className={`w-3 h-3 ${result.result === "Locked" ? "bg-green-400" : "bg-gray-500"}`}
                      ></div>
                      <span>{`[${result.serial}] ${result.time}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }}></div>
    </div>
  );
}