"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const initialPrompt = `
You are an AI assistant for a word game. Task:
- Check if input "{input}" is valid for thread "{thread}" ("Ally" or "Rival"), starter "{starter}", and context "{context}" ("direct" or "twist"). Reply "1" for valid, "0" for invalid. Ignore case, use standard English.

- Rules:
  - "Ally": Input must be a synonym or same category as starter, matching the context.
    - "direct": Physical/direct meaning only (e.g., "glow" → "shine" = 1, "glow" → "smart" = 0).
    - "twist": Figurative/abstract meaning only (e.g., "glow" → "radiance" = 1, "glow" → "shine" = 0).
  - "Rival": Input must be an opposite or clear contrast to starter, matching the context.
    - "direct": Physical/direct opposite only (e.g., "hot" → "cold" = 1, "hot" → "dull" = 0).
    - "twist": Figurative/abstract contrast only (e.g., "hot" → "dull" = 1, "hot" → "cold" = 0).
  - Examples:
    - "bright" (direct) → "clear" (1), "smart" (0), "dark" (1), "dull" (0).
    - "bright" (twist) → "smart" (1), "clear" (0), "dull" (1), "dark" (0).
    - "cold" (direct) → "hot" (1), "aloof" (0), "warm" (1), "friendly" (0).
    - "cold" (twist) → "friendly" (1), "hot" (0), "warm" (1), "frigid" (0).
    - "run" (direct) → "dash" (1), "flow" (0), "stop" (1), "rest" (1).
    - "run" (twist) → "flow" (1), "dash" (0), "stall" (1), "break" (1).
  - Context is strict—mismatches are invalid. Use standard meanings, no overlap. Reply only "1" or "0".
`;

export default function WordVerse({ thread }) {
  const [clues, setClues] = useState([]);
  const [remainingIndices, setRemainingIndices] = useState([]);
  const [currentPair, setCurrentPair] = useState(["", ""]); // [starter, input]
  const [currentContext, setCurrentContext] = useState(""); // direct or twist
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
  const initializedRef = useRef(false);
  const chatRef = useRef(null);

  const initialize = useCallback(async () => {
    setIsGameReady(false);
    try {
      const chat = await model.startChat({
        history: [{ role: "user", parts: [{ text: initialPrompt }] }],
      });
      chatRef.current = chat;

      const testResponse = await chat.sendMessage(
        `Check: Thread: "Ally" | Starter: "glow" | Input: "shine" | Context: "direct"`
      );
      const testReply = await testResponse.response.text().trim();
      if (testReply !== "1" && testReply !== "0") {
        console.error("Chat test failed:", testReply);
        return;
      }

      const res = await fetch("/data/wordVerse.json");
      const vocabData = await res.json();
      setClues(vocabData[thread]);
      setRemainingIndices(vocabData[thread].map((_, i) => i));
      setIsGameReady(true);
    } catch (error) {
      console.error("Error initializing:", error);
    }
  }, [thread]);

  useEffect(() => {
    if (!initializedRef.current) {
      initialize();
      initializedRef.current = true;
    }
  }, [initialize]);

  useEffect(() => {
    if (isGameReady && clues.length > 0 && !currentPair[0]) {
      setNextPair();
    }
  }, [isGameReady, clues]);

  useEffect(() => {
    if (timer === 0) {
      setGameOver(true);
    } else if (isGameReady && !gameOver) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isGameReady, gameOver]);

  const setNextPair = useCallback(() => {
    if (remainingIndices.length === 0) {
      setGameOver(true);
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
  }, [clues, remainingIndices]);

  const nextRound = useCallback((delay) => {
    setTimeout(() => {
      setSerialCount((prev) => prev + 1);
      setNextPair();
      setIsCorrect(null);
    }, delay);
  }, [setNextPair]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !chatRef.current || isCorrect !== null) return;
    setIsCorrect(null);

    const matchingClue = clues.find((c) => c.word === currentPair[0]);
    const expectedWord = matchingClue?.answer || "";

    try {
      const checkResponse = await chatRef.current.sendMessage(
        `Check: Thread: "${thread}" | Starter: "${currentPair[0]}" | Input: "${input}" | Context: "${currentContext}"`
      );
      const aiReply = await checkResponse.response.text().trim();
      const isAnswerCorrect = aiReply === "1";
      if (aiReply !== "1" && aiReply !== "0") {
        console.error("AI response invalid:", aiReply);
        setIsCorrect(false);
      } else {
        setIsCorrect(isAnswerCorrect);
      }
      setCorrectAnswer(expectedWord);

      setRoundResults((prev) => [
        ...prev,
        {
          serial: serialCount,
          starter: currentPair[0],
          input: input,
          result: isAnswerCorrect ? "Locked" : "Missed",
          correctAnswer: expectedWord,
          context: currentContext,
        },
      ]);

      setInput("");
      if (isAnswerCorrect) setScore((prev) => prev + 1);
      nextRound(1000);
    } catch (error) {
      console.error("Chat error:", error);
      setIsCorrect(false);
      setCorrectAnswer(expectedWord);
      setInput("");
      nextRound(1000);
    }
  }, [input, isCorrect, currentPair, currentContext, thread, serialCount, nextRound]);

  const handleReset = useCallback(() => {
    setTimer(60);
    setScore(0);
    setGameOver(false);
    setSerialCount(1);
    setInput("");
    setIsCorrect(null);
    setCorrectAnswer("");
    setCurrentPair(["", ""]);
    setCurrentContext("");
    setRoundResults([]);
    setShowDetails(false);
    setIsGameReady(false);
    initializedRef.current = false;
    initialize();
  }, [initialize]);

  if (!isGameReady) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] w-full text-white">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-4">
            <div className={`w-4 h-4 bg-green-500 clip-glyph animate-glyph-spin`}></div>
            <div className={`w-4 h-4 bg-green-500 clip-glyph animate-glyph-spin`}></div>
            <div className={`w-4 h-4 bg-green-500 clip-glyph animate-glyph-spin`}></div>
          </div>
          <p className="text-lg text-gray-300 font-centauri">Warping...</p>
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
        <h1 className="text-xl md:text-2xl font-orbitron text-white tracking-wide mb-6 text-shadow-glow">
          Verse Warped!
        </h1>
        <div className="bg-green-800 bg-opacity-20 border-2 border-green-900 rounded-lg p-6 w-[80vw] max-w-96 shadow-lg">
          <p className="text-xl text-gray-300 font-mono"><span className="text-green-400">Score:</span> {score}</p>
          <p className="text-xl text-gray-300 font-mono"><span className="text-green-400">Rounds:</span> {roundsCompleted}</p>
          <p className="text-xl text-gray-300 font-mono"><span className="text-green-400">Accuracy:</span> {accuracy}%</p>
          <p className="text-xl text-gray-300 font-mono"><span className="text-green-400">Thread:</span> {thread === "ally" ? "Ally" : "Rival"}</p>
        </div>
        <button
          onClick={handleReset}
          className="mt-6 px-8 py-2 bg-green-700 border-green-700 border-2 font-sans font-medium text-lg text-white rounded-md hover:bg-green-600 animate-pulse-slow"
        >
          Warp Again
        </button>
        <button
          onClick={() => setShowDetails(true)}
          className="mt-4 px-6 py-2 bg-gray-700 border-gray-700 border-2 font-sans font-medium text-lg text-white rounded-md hover:bg-gray-600"
        >
          See Details
        </button>
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
        <h1 className="text-xl md:text-2xl font-orbitron text-white tracking-wide mb-6 text-shadow-glow">
          Warp Details
        </h1>
        <div className="w-full max-h-[400px] overflow-y-auto bg-gray-950 bg-opacity-50 border-2 border-green-800 rounded-md p-2 shadow-inner">
          {roundResults.length === 0 ? (
            <p className="text-[14px] md:text-[16px] lg:text-lg text-gray-400 font-mono text-center py-5">
              No rounds attempted
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
                  <span className="px-1 text-center text-gray-300">
                    {result.result === "Locked" ? (
                      <span className="text-green-400">{result.result}</span>
                    ) : (
                      <span className="text-red-400">{result.result}</span>
                    )}
                  </span>
                  <span className="col-span-5 px-1 mt-1 text-center text-violet-500 italic">
                    <span className="text-green-400">verbotron: </span> {result.correctAnswer}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
        <button
          onClick={() => setShowDetails(false)}
          className="mt-6 px-8 py-2 bg-green-700 border-green-700 border-2 font-sans font-medium text-lg text-white rounded-md hover:bg-green-600"
        >
          Back
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col w-full justify-center items-center">
      <style jsx global>{`
        .text-shadow-glow { text-shadow: 0 0 8px rgba(34, 197, 94, 0.5); }
      `}</style>
      <div className="w-[40%] md:w-1/4 lg:w-1/5 sm:max-w-[600px] md:max-w-[700px]">
        <div className="bg-gray-900 bg-opacity-80 border-2 border-b-0 border-green-600 rounded-t-md p-2 flex justify-center items-center shadow-[0_0_8px_rgba(34,197,94,0.5)]">
          <p className="text-[18px] md:text-[20px] font-orbitron text-green-400 tracking-wider">
            {timer.toString().padStart(2, "0")}<span className="text-green-300 text-[14px] md:text-[16px]">s</span>
          </p>
        </div>
      </div>

      <div className="relative flex flex-col p-5 bg-gray-950 bg-opacity-50 border-[2px] border-green-800 rounded-md w-[90%] md:w-3/4 lg:w-2/3 sm:max-w-[600px] md:max-w-[700px] items-center h-auto text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]">
        <div className="flex justify-between items-center w-full mb-4 relative">
          <div className="flex items-center space-x-2 bg-gray-800 bg-opacity-60 border-2 border-green-600 rounded-md px-3 py-1 shadow-[0_0_6px_rgba(34,197,94,0.4)]">
            <span className="text-green-400 text-[16px] md:text-[18px] font-orbitron tracking-wider">
              #{serialCount}
            </span>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <motion.span
              className="text-green-400 text-[10px] md:text-[12px] font-orbitron tracking-wider opacity-70"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              WARP
            </motion.span>
          </div>
          <div
            className={`px-4 py-1 rounded-md border text-lg bg-opacity-20 ${
              thread === "ally"
                ? "border-blue-600 text-blue-400 bg-blue-900"
                : "border-rose-600 text-rose-400 bg-rose-900"
            }`}
          >
            {thread === "ally" ? "Ally" : "Rival"}
          </div>
        </div>

        <div className="relative w-full min-h-[180px] bg-green-950 bg-opacity-30 border border-green-800 rounded-md flex flex-col items-center justify-center px-4 mb-6 text-center shadow-inner">
          <div className="absolute top-2 left-2 text-[12px] md:text-[14px] lg:text-[16px] font-mono text-green-400">
            [{currentContext}]
          </div>
          <motion.div
            key={serialCount}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-wrap justify-center gap-4"
          >
            {currentPair.map((word, index) => (
              <div
                key={index}
                className={`px-2 min-w-[80px] max-w-[100px] md:max-w-[120px] h-[40px] md:h-[50px] flex items-center justify-center text-[14px] md:text-lg lg:text-xl font-mono truncate ${
                  word
                    ? thread === "ally"
                      ? "text-gray-300 border-blue-500 bg-blue-800 bg-opacity-10"
                      : "text-gray-300 border-rose-500 bg-red-800 bg-opacity-10"
                    : "text-gray-400 border-gray-500 bg-gray-700 bg-opacity-10"
                } border-2 border-opacity-80`}
                style={{ clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)" }}
              >
                {word || "___"}
              </div>
            ))}
          </motion.div>
          {isCorrect !== null && (
            <motion.div
              className="mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {isCorrect ? (
                <div className="bg-green-900 bg-opacity-80 border-2 border-green-500 rounded-lg px-4 py-2 mt-1 shadow-[0_0_10px_rgba(20,248,68,0.7)] text-shadow-glow">
                  <p className="text-lg md:text-xl font-orbitron font-extrabold tracking-wider text-green-300">
                    Warped!
                  </p>
                </div>
              ) : (
                <div className="bg-red-900 bg-opacity-80 border-2 border-red-500 rounded-lg px-4 py-2 mt-1 shadow-[0_0_10px_rgba(239,68,68,0.7)] text-shadow-glow">
                  <p className="text-lg md:text-xl font-orbitron font-extrabold tracking-wider text-red-300">
                    Missed!
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="flex items-center w-full max-w-[400px] space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z]*$/.test(value) && value.length <= 20) setInput(value);
            }}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            disabled={isCorrect !== null}
            spellCheck={false}
            className="w-full p-2.5 md:p-3 text-[16px] md:text-xl bg-gray-800 border border-green-600 rounded-md text-gray-200 focus:outline-none focus:ring-0 focus:border-green-500"
            placeholder={`Next ${thread === "ally" ? "ally" : "rival"}...`}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isCorrect !== null}
            className="w-14 h-12 bg-green-700 rounded-lg flex items-center justify-center text-white hover:bg-green-600 disabled:bg-gray-600 transition-all cursor-default"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}