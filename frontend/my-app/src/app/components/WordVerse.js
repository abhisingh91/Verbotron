"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

const initialPrompt = `
You are an AI assistant for a word sequence game. Task:
- **Check Sequence**: For thread "{thread}" ("Chain" or "Clash"), previous "{previous}", input "{input}", reply "1" if correct next word, "0" if not. Ignore case, use standard English.

- **Rules**:
  - "Chain": Related words (synonyms or shared trait). E.g., "glow" → "shine" (1), "dark" → "bright" (0).
  - "Clash": Contrasting words (opposites or differences). E.g., "hot" → "cold" (1), "glow" → "shine" (0).

- Reply only "1" or "0".
`;

export default function WordVerse({ thread }) {
  const [clues, setClues] = useState([]);
  const [remainingIndices, setRemainingIndices] = useState([]);
  const [currentSequence, setCurrentSequence] = useState(["", "", ""]);
  const [step, setStep] = useState(0);
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
  const initializedRef = useRef(false);
  const chatRef = useRef(null);

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
        `Check Sequence: Thread: "Chain" | Previous: "glow" | Input: "shine"`
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
    if (isGameReady && clues.length > 0 && !currentSequence[0]) {
      setNextSequence();
    }
  }, [isGameReady, clues]);

  useEffect(() => {
    if (timer === 0) {
      handleGameOverPrep();
    } else if (isGameReady && !gameOver) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isGameReady, gameOver]);

  const setNextSequence = useCallback(() => {
    if (remainingIndices.length === 0) {
      handleGameOverPrep();
      return;
    }
    const idx = Math.floor(Math.random() * remainingIndices.length);
    const newClueIndex = remainingIndices[idx];
    const newSequence = clues[newClueIndex].sequence;
    setCurrentSequence([newSequence[0], "", ""]);
    setStep(0);
    setRemainingIndices((prev) => prev.filter((i) => i !== newClueIndex));
    setInput("");
    setIsCorrect(null);
    setCorrectAnswer("");
  }, [clues, remainingIndices]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !chatRef.current || isCorrect !== null) return;
    setIsCorrect(null);
  
    const matchingClue = clues.find((c) => c.sequence[0] === currentSequence[0]);
    const expectedWord = matchingClue ? matchingClue.sequence[step + 1] : "";
  
    try {
      const checkResponse = await chatRef.current.sendMessage(
        `Check Sequence: Thread: "${thread}" | Previous: "${currentSequence[step]}" | Input: "${input}"`
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
  
      setRoundResults((prev) => {
        const lastResult = prev.find((r) => r.serial === serialCount) || {
          serial: serialCount,
          sequence: [...currentSequence],
          firstInput: null,
          secondInput: null,
          result: null, // Add result field
          correctWords: matchingClue.sequence.slice(1),
        };
        const updatedResult = {
          ...lastResult,
          ...(step === 0 ? { firstInput: input } : { secondInput: input }),
          result: isAnswerCorrect ? (step === 1 ? "Warped" : lastResult.result) : "Broken",
        };
        return prev.some((r) => r.serial === serialCount)
          ? prev.map((r) => (r.serial === serialCount ? updatedResult : r))
          : [...prev, updatedResult];
      });
  
      setInput("");
  
      if (isAnswerCorrect) {
        setScore((prev) => prev + 1);
        const newSequence = [...currentSequence];
        newSequence[step + 1] = input;
        setCurrentSequence(newSequence);
        setStep((prev) => prev + 1);
        if (step === 1) {
          setTimeout(() => {
            setSerialCount((prev) => prev + 1);
            setNextSequence();
            setIsCorrect(null);
          }, 1000);
        } else {
          setTimeout(() => setIsCorrect(null), 600);
        }
      } else {
        setTimeout(() => {
          setSerialCount((prev) => prev + 1);
          setNextSequence();
          setIsCorrect(null);
        }, 1000);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsCorrect(false);
      setCorrectAnswer(expectedWord);
      setInput("");
      setTimeout(() => {
        setSerialCount((prev) => prev + 1);
        setNextSequence();
        setIsCorrect(null);
      }, 1000);
    }
  }, [input, isCorrect, currentSequence, step, thread, serialCount, setNextSequence]);

  const handleGameOverPrep = useCallback(async () => {
    setShowTransition(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setShowTransition(false);
    setGameOver(true);
  }, []);

  const handleReset = useCallback(() => {
    setTimer(60);
    setScore(0);
    setGameOver(false);
    setSerialCount(1);
    setInput("");
    setIsCorrect(null);
    setCorrectAnswer("");
    setCurrentSequence(["", "", ""]);
    setStep(0);
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
            <div className="w-4 h-4 bg-green-400 clip-glyph animate-glyph-spin"></div>
            <div className="w-4 h-4 bg-green-500 clip-glyph animate-glyph-spin delay-200"></div>
            <div className="w-4 h-4 bg-green-600 clip-glyph animate-glyph-spin delay-400"></div>
          </div>
          <p className="text-lg text-gray-300 font-centauri">Warping...</p>
        </div>
      </div>
    );
  }

  if (showTransition) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] w-[80%] md:w-2/3 lg:w-1/2 max-w-[600px] text-white">
        <div className="relative w-full h-32 bg-gray-950 bg-opacity-50 border-2 border-green-800 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.3)] overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <p className="text-[18px] md:text-[20px] font-orbitron text-green-300 tracking-wider">
              Warping Results...
            </p>
            <motion.div
              className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-green-400"
              style={{ transformOrigin: "top" }}
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (gameOver && !showDetails) {
    const sequencesCompleted = serialCount - 1;
    const accuracy = sequencesCompleted > 0 ? ((score / (sequencesCompleted * 2)) * 100).toFixed(1) : "0.0";

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col h-[70vh] justify-center items-center w-[90%] md:w-3/4 lg:w-2/3 text-white"
      >
        <h1
          className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide mb-6"
          style={{ textShadow: "0 0 8px rgba(34, 197, 94, 0.5)" }}
        >
          Verse Warped!
        </h1>
        <div className="bg-green-800 bg-opacity-20 border-2 border-green-900 rounded-lg p-6 w-[80vw] max-w-96 shadow-lg">
          <p className="text-xl text-gray-300 font-mono"><span className="text-green-400">Score:</span> {score}</p>
          <p className="text-xl text-gray-300 font-mono"><span className="text-green-400">Sequences:</span> {sequencesCompleted}</p>
          <p className="text-xl text-gray-300 font-mono"><span className="text-green-400">Accuracy:</span> {accuracy}%</p>
          <p className="text-xl text-gray-300 font-mono"><span className="text-green-400">Thread:</span> {thread === "chain" ? "Chain" : "Clash"}</p>
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
        <h1
          className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide mb-6"
          style={{ textShadow: "0 0 8px rgba(34, 197, 94, 0.5)" }}
        >
          Warp Details
        </h1>
        <div className="w-full max-h-[400px] overflow-y-auto bg-gray-950 bg-opacity-50 border-2 border-green-800 rounded-md p-2 shadow-inner">
          {roundResults.length === 0 ? (
            <p className="text-[14px] md:text-[16px] lg:text-lg text-gray-400 font-mono text-center py-5">
              No sequences attempted
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[0.5fr_1fr_1fr_1fr_1fr] py-2 border-b border-gray-700 text-[10px] md:text-[12px] lg:text-[14px] font-mono text-green-400 bg-gray-900 bg-opacity-30">
                <span className="px-1 text-center">#</span>
                <span className="px-1 text-center">Thread</span>
                <span className="px-1 text-center">First</span>
                <span className="px-1 text-center">Second</span>
                <span className="px-1 text-center">Result</span>
              </div>
              {roundResults.map((result, index) => (
                <div
                  key={`${result.serial}-${index}`}
                  className="grid grid-cols-[0.5fr_1fr_1fr_1fr_1fr] py-2 border-b border-gray-700 last:border-b-0 text-[10px] md:text-[12px] lg:text-[14px] font-mono"
                >
                  <span className="px-1 text-center text-gray-300">#{result.serial}</span>
                  <span className="px-1 text-center text-gray-300">{result.sequence[0]} → ___ → ___</span>
                  <span className="px-1 text-center text-gray-300">{result.firstInput || "-"}</span>
                  <span className="px-1 text-center text-gray-300">{result.secondInput || "-"}</span>
                  <span className="px-1 text-center text-gray-300">{result.result || "-"}</span>
                  <span className="col-span-5 px-1 text-center text-violet-500 italic">
                    <span className="text-green-400">verbotron: </span> {result.correctWords.join(" → ")}
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
    <>
      <style jsx global>{`
        @keyframes spark {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes glyphSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .clip-glyph {
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
        }
        .animate-glyph-spin {
          animation: glyphSpin 1.5s infinite linear;
        }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
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
              THREAD
            </motion.span>
          </div>
          <div
            className={`px-4 py-1 rounded-md border text-lg bg-opacity-20 ${
              thread === "chain"
                ? "border-blue-600 text-blue-400 bg-blue-900"
                : "border-rose-600 text-rose-400 bg-rose-900"
            }`}
          >
            {thread === "chain" ? "Chain" : "Clash"}
          </div>
        </div>

        <div className="relative w-full min-h-[180px] bg-green-950 bg-opacity-30 border border-green-800 rounded-md flex flex-col items-center justify-center px-4 mb-6 text-center shadow-inner">
          <motion.div
            key={serialCount}
            className="flex flex-wrap justify-center gap-2 md:gap-4"
            initial={{ y: 0 }}
            animate={{ y: isCorrect === true && step === 2 ? -10 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {currentSequence.map((word, index) => (
              <div
                key={index}
                className={`px-1 min-w-[75px] max-w-[80px] md:max-w-[120px] lg:max-w-[140px] h-[40px] md:h-[50px] flex items-center justify-center text-[14px] md:text-lg lg:text-xl font-mono truncate ${
                  word
                    ? thread === "chain"
                      ? "text-blue-400 border-blue-500 bg-blue-800 bg-opacity-20"
                      : "text-rose-400 border-rose-500 bg-rose-800 bg-opacity-20"
                    : "text-gray-400 border-gray-500 bg-gray-700 bg-opacity-10"
                } border-2 border-opacity-40`}
                style={{
                  clipPath: "polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)",
                }}
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
                step === 2 ? (
                  <div
                    className={`bg-opacity-80 border-2 rounded-lg px-4 py-2 mt-1 shadow-[0_0_10px_rgba(${thread === "chain" ? "34,197,94" : "239,68,68"},0.7)] ${
                      thread === "chain"
                        ? "bg-green-900 border-green-500"
                        : "bg-rose-900 border-rose-500"
                    }`}
                    style={{ textShadow: `0 0 5px rgba(${thread === "chain" ? "34, 197, 94" : "239, 68, 68"}, 0.9)` }}
                  >
                    <p
                      className={`text-lg md:text-xl font-orbitron font-extrabold tracking-wider ${
                        thread === "chain" ? "text-green-300" : "text-rose-300"
                      }`}
                    >
                      Warped!
                    </p>
                  </div>
                ) : (
                  <div
                    className={`bg-opacity-50 border rounded-md px-2 py-1 mt-1 shadow-[0_0_5px_rgba(${thread === "chain" ? "34,197,94" : "239,68,68"},0.5)] ${
                      thread === "chain"
                        ? "bg-green-900 border-green-500 text-green-400"
                        : "bg-rose-900 border-rose-500 text-rose-400"
                    }`}
                  >
                    <p className="text-sm md:text-base font-orbitron font-bold tracking-wide">
                      Linked
                    </p>
                  </div>
                )
              ) : (
                <div
                  className="bg-red-900 bg-opacity-80 border-2 border-red-500 rounded-lg px-4 py-2 mt-1 shadow-[0_0_10px_rgba(239,68,68,0.7)]"
                  style={{ textShadow: "0 0 5px rgba(239, 68, 68, 0.9)" }}
                >
                  <p className="text-lg md:text-xl font-orbitron font-extrabold tracking-wider text-red-300">
                    Broken!
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
              if (/^[a-zA-Z]*$/.test(value) && value.length <= 20) {
                setInput(value);
              }
            }}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            disabled={isCorrect !== null}
            spellCheck={false}
            className="w-full p-2.5 md:p-3 text-[16px] md:text-xl bg-gray-800 border border-green-600 rounded-md text-gray-200 focus:outline-none focus:ring-0 focus:border-green-500"
            placeholder={`Next ${thread}...`}
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
    </>
  );
}