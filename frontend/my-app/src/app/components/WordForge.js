"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prompt = `
You are an AI that performs two tasks for a vocabulary game:
1. **Check Fit**: For a paragraph "{paragraph}", word "{word}", and sentence "{sentence}", reply "1" if the sentence uses the word in a standard dictionary meaning (for Literal) or a figurative, metaphorical, or idiomatic meaning (for Figurative), logically uses the context of the paragraph, and is grammatically correct; reply "0" otherwise. Interpret the word’s meaning based on the task prefix (e.g., "Literal:" or "Figurative:").
2. **Generate Sentence**: For a paragraph "{paragraph}" and word "{word}", return a short sentence (max 10 words) using the word in a standard dictionary meaning (for Literal) or a figurative, metaphorical, or idiomatic meaning (for Figurative) that logically uses the context the paragraph.
`;

export default function WordForge({ style }) {
  const [paragraph, setParagraph] = useState("");
  const [word, setWord] = useState("");
  const [sentence, setSentence] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [isGameReady, setIsGameReady] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [challenges, setChallenges] = useState(null);
  const [remainingIndices, setRemainingIndices] = useState([]);
  const [roundResults, setRoundResults] = useState([]);
  const initializedRef = useRef(false);
  const chatRef = useRef(null);

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const initialize = useCallback(async () => {
    setIsGameReady(false);
    try {
      const chat = await model.startChat({
        history: [{ role: "user", parts: [{ text: prompt }] }],
      });
      chatRef.current = chat;

      const testResponse = await chat.sendMessage(
        `${style === "literal" ? "Literal" : "Figurative"}: Paragraph: "The forest whispered secrets through rustling leaves." | Word: "signal" | Sentence: "A faint signal flickered in the distance."`
      );
      const testReply = await testResponse.response.text().trim();
      if (testReply !== "1" && testReply !== "0") {
        console.error("Model test failed:", testReply);
        return;
      }

      const res = await fetch("/data/wordForge.json");
      const fetchedChallenges = await res.json();
      setChallenges(fetchedChallenges[style]);
      setRemainingIndices(
        Array.from({ length: fetchedChallenges[style].length }, (_, i) => i)
      );
      setIsGameReady(true);
    } catch (error) {
      console.error("Error initializing chat or fetching challenges:", error);
    }
  }, [style]);

  useEffect(() => {
    if (!initializedRef.current) {
      initialize();
      initializedRef.current = true;
    }
  }, [initialize]);

  useEffect(() => {
    if (isGameReady && challenges && !paragraph) {
      setNextChallenge();
    }
  }, [isGameReady, challenges]);

  useEffect(() => {
    if (timer === 0) {
      handleGameOverPrep();
    } else if (isGameReady && !gameOver) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isGameReady, gameOver]);

  const setNextChallenge = useCallback(() => {
    if (remainingIndices.length === 0) {
      handleGameOverPrep();
      return;
    }
    const idx = Math.floor(Math.random() * remainingIndices.length);
    const newChallengeIndex = remainingIndices[idx];
    const newChallenge = challenges[newChallengeIndex];
    setParagraph(newChallenge.paragraph);
    setWord(newChallenge.word);
    setRemainingIndices((prev) => prev.filter((i) => i !== newChallengeIndex));
    setSentence("");
    setResult(null);
    setButtonDisabled(false);
  }, [challenges, remainingIndices]);

  const handleSubmit = useCallback(async () => {
    if (!sentence.trim() || !chatRef.current || loading) return;
    setLoading(true);
    setButtonDisabled(true);
  
    const formattedPrompt = prompt
      .replace("{word}", word)
      .replace("{paragraph}", paragraph);
    try {
      const response = await chatRef.current.sendMessage(
        `${style === "literal" ? "Literal" : "Figurative"}: 1. Check Fit: ${formattedPrompt} | Sentence: "${sentence}"`
      );
      const aiReply = await response.response.text().trim();
      const isCorrect = aiReply === "1";
      setResult(isCorrect ? "correct" : "incorrect");
  
      setRoundResults((prev) => [
        ...prev,
        {
          serial: round,
          paragraph,
          word,
          sentence,
          result: isCorrect ? "Forged" : "Failed",
          aiSentence: "",
        },
      ]);
  
      if (isCorrect) setScore((prev) => prev + 1);
  
      setLoading(false);
      setTimeout(() => {
        setRound((prev) => prev + 1);
        setNextChallenge();
      }, 800);
    } catch (error) {
      console.error("Error checking sentence:", error);
      setResult("error");
      setRoundResults((prev) => [
        ...prev,
        { serial: round, paragraph, word, sentence, result: "Error", aiSentence: "" },
      ]);
      setLoading(false);
      setTimeout(() => {
        setRound((prev) => prev + 1);
        setNextChallenge();
      }, 800);
    }
  }, [sentence, word, paragraph, loading, round, setNextChallenge, style]);
  
  const handleGameOverPrep = useCallback(async () => {
    setShowTransition(true);
    try {
      const updatedResults = await Promise.all(
        roundResults.map(async (result) => {
          if (!result.aiSentence) {
            const response = await chatRef.current.sendMessage(
              `${style === "literal" ? "Literal" : "Figurative"}: 2. Generate Sentence: Paragraph: "${result.paragraph}" | Word: "${result.word}"`
            );
            const aiSentence = await response.response.text().trim();
            return { ...result, aiSentence };
          }
          return result;
        })
      );
      setRoundResults(updatedResults);
    } catch (error) {
      console.error("Error generating AI sentences:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setShowTransition(false);
    setGameOver(true);
  }, [roundResults, style]);

  const handleReset = useCallback(() => {
    setTimer(60);
    setScore(0);
    setRound(1);
    setGameOver(false);
    setSentence("");
    setResult(null);
    setParagraph("");
    setWord("");
    setIsGameReady(false);
    setShowTransition(false);
    setShowDetails(false);
    setButtonDisabled(false);
    setChallenges(null);
    setRemainingIndices([]);
    setRoundResults([]);
    initializedRef.current = false;
    initialize();
  }, [initialize]);

  if (!isGameReady) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] w-full text-white">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-6 relative">
            <div className="relative">
              <div className="w-4 h-4 bg-pink-500 rounded-sm hammer-pulse" style={{ transformOrigin: "center" }}></div>
              <div className="w-2 h-2 bg-purple-900 rounded-full spark-fade" style={{ top: "-4px", right: "-8px" }}></div>
            </div>
            <div className="relative">
              <div className="w-4 h-4 bg-pink-500 rounded-sm hammer-pulse delay-200" style={{ transformOrigin: "center" }}></div>
              <div className="w-2 h-2 bg-purple-900 rounded-full spark-fade delay-200" style={{ top: "-4px", right: "-8px" }}></div>
            </div>
            <div className="relative">
              <div className="w-4 h-4 bg-pink-500 rounded-sm hammer-pulse delay-400" style={{ transformOrigin: "center" }}></div>
              <div className="w-2 h-2 bg-purple-900 rounded-full spark-fade delay-400" style={{ top: "-4px", right: "-8px" }}></div>
            </div>
          </div>
          <p className="text-lg text-gray-300 font-centauri">Forging...</p>
        </div>
      </div>
    );
  }

  if (showTransition) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] w-[80%] md:w-2/3 lg:w-1/2 max-w-[600px] text-white">
        <div className="relative w-full h-32 bg-gray-950 bg-opacity-50 border-2 border-purple-900 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.3)] overflow-hidden">
          <div className="relative z-10 flex items-center gap-6">
            <p className="text-[18px] md:text-[20px] font-orbitron text-pink-400 tracking-wider">
              Forging Results...
            </p>
            <motion.div
              className="w-4 h-4 bg-pink-500 rounded-sm"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (gameOver && !showDetails) {
    const roundsCompleted = round - 1;
    const accuracy = roundsCompleted > 0 ? ((score / roundsCompleted) * 100).toFixed(1) : "0.0";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col h-[70vh] justify-center items-center w-[80%] md:w-2/5 text-white"
      >
        <h1
          className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide mb-6"
          style={{ textShadow: "0 0 8px rgba(236, 72, 153, 0.5)" }}
        >
          Forging Complete!
        </h1>
        <div className="bg-purple-800 bg-opacity-20 border-2 border-purple-900 rounded-lg p-6 w-[80vw] max-w-96 shadow-lg">
          <p className="text-xl text-gray-300 font-mono">
            <span className="text-pink-400">Final Score:</span> {score}
          </p>
          <p className="text-xl text-gray-300 font-mono">
            <span className="text-pink-400">Rounds Forged:</span> {roundsCompleted}
          </p>
          <p className="text-xl text-gray-300 font-mono">
            <span className="text-pink-400">Accuracy:</span> {accuracy}%
          </p>
          <p className="text-xl text-gray-300 font-mono">
            <span className="text-pink-400">Play Style:</span>{" "}
            {style === "literal" ? "Core" : "Flux"}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="mt-6 px-8 py-2 font-medium font-sans border-purple-900 border-2 bg-pink-700 text-lg text-white rounded-md hover:bg-pink-600 animate-pulse-slow"
        >
          Forge Again
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
          style={{ textShadow: "0 0 8px rgba(236, 72, 153, 0.5)" }}
        >
          Forge Details
        </h1>
        <div
          className="w-full max-h-[400px] overflow-y-auto bg-gray-950 bg-opacity-50 border-2 border-purple-900 rounded-md p-2 shadow-inner"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ec4899 transparent" }}
        >
          {roundResults.length === 0 ? (
            <p className="text-[14px] md:text-[16px] lg:text-lg text-gray-400 font-mono text-center py-5">
              No rounds forged :(
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr] py-2 border-b border-gray-700 text-[10px] md:text-[12px] lg:text-[14px] font-mono text-pink-400 bg-gray-900 bg-opacity-30">
                <span className="px-1 text-center">#</span>
                <span className="px-1 text-center">Paragraph</span>
                <span className="px-1 text-center">Word</span>
                <span className="px-1 text-center">Result</span>
              </div>
              {roundResults.map((result) => (
                <div
                  key={result.serial}
                  className="grid grid-cols-[0.5fr_2fr_1fr_1fr] py-2 border-b border-gray-700 last:border-b-0 text-[10px] md:text-[12px] lg:text-[14px] font-mono"
                >
                  <span className="px-1 text-center text-gray-300">#{result.serial}</span>
                  <span className="px-1 text-left text-gray-300 break-words">{result.paragraph}</span>
                  <span className="px-1 text-center text-gray-300">{result.word}</span>
                  <span
                    className={`px-1 text-center ${
                      result.result === "Forged" ? "text-green-400" : "text-purple-400"
                    }`}
                  >
                    {result.result}
                  </span>
                  <p className="col-span-4 text-center text-white mt-1 italic">
                    <span className="text-pink-400 font-bold">Yours: </span>{result.sentence}
                  </p>
                  <p className="col-span-4 text-center text-white mt-1 italic">
                    <span className="text-purple-400 font-bold">Verbotron: </span>
                    {result.aiSentence || "Pending..."}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
        <button
          onClick={() => setShowDetails(false)}
          className="mt-6 px-8 py-2 bg-pink-700 border-purple-900 border-2 font-sans font-medium text-lg text-white rounded-md hover:bg-pink-600"
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
      `}</style>
      <div className="w-[40%] md:w-1/4 lg:w-1/5 sm:max-w-[600px] md:max-w-[700px]">
        <div className="bg-gray-900 bg-opacity-80 border-2 border-b-0 border-purple-900 rounded-t-md p-2 flex justify-center items-center shadow-[0_0_8px_rgba(236,72,153,0.5)]">
          <p className="text-[18px] md:text-[20px] font-orbitron text-pink-400 tracking-wider">
            {timer.toString().padStart(2, "0")}<span className="text-pink-300 text-[14px] md:text-[16px]">s</span>
          </p>
        </div>
      </div>

      <div className="relative flex flex-col p-5 bg-gray-950 bg-opacity-50 border-[2px] border-purple-900 rounded-md w-[90%] md:w-3/4 lg:w-2/3 sm:max-w-[600px] md:max-w-[700px] items-center h-auto text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]">
        <div className="flex justify-between items-center w-full mb-4 relative">
          <div className="flex items-center space-x-2 bg-gray-800 bg-opacity-60 border-2 border-purple-900 rounded-md px-3 py-1 shadow-[0_0_6px_rgba(236,72,153,0.4)]">
            <span className="text-pink-400 text-[16px] md:text-[18px] font-orbitron tracking-wider">
              #{round}
            </span>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <motion.span
              className="text-pink-400 text-[10px] md:text-[12px] font-orbitron tracking-wider opacity-70"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              FORGE
            </motion.span>
          </div>
          <div
            className={`px-4 py-1 rounded-md border text-lg bg-opacity-20 ${
              style === "literal"
                ? "border-emerald-600 text-emerald-400 bg-emerald-900"
                : "border-sky-600 text-sky-400 bg-sky-900"
            }`}
          >
            {style === "literal" ? "Core" : "Flux"}
          </div>
        </div>

        <div className="relative w-full min-h-[180px] bg-purple-950 bg-opacity-30 border border-purple-900 rounded-md flex flex-col items-center justify-center px-6 mb-6 text-center shadow-inner">
          <motion.p
            key={round}
            className="text-[16px] md:text-lg lg:text-xl font-mono text-purple-300 mb-2"
            initial={{ y: 0 }}
            animate={{ y: result !== null ? -10 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {paragraph}
          </motion.p>
          <motion.h1
            key={round + "word"}
            className="text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] font-mono font-medium text-pink-400 tracking-wide"
            initial={{ y: 0 }}
            animate={{ y: result !== null ? -10 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            [ {word} ]
          </motion.h1>

          {result !== null && (
            <motion.div
              className="flex flex-col items-center space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {result === "correct" ? (
                <>
                  <div
                    className="bg-green-900 bg-opacity-80 border-2 border-green-500 rounded-lg px-4 py-2 shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                    style={{ textShadow: "0 0 5px rgba(34, 197, 94, 0.9)" }}
                  >
                    <p className="text-green-300 text-lg md:text-xl font-orbitron font-extrabold tracking-wider">
                      Forged!
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
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className="bg-purple-900 bg-opacity-80 border-2 border-purple-500 rounded-lg px-4 py-2 shadow-[0_0_10px_rgba(239,68,68,0.7)]"
                    style={{ textShadow: "0 0 5px rgba(239, 68, 68, 0.9)" }}
                  >
                    <p className="text-purple-300 text-lg md:text-xl font-orbitron font-extrabold tracking-wider">
                      Failed!
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="flex items-center w-full space-x-4">
          <input
            type="text"
            value={sentence}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(value) && value.split(" ").length <= 60) {
                setSentence(value);
              }
            }}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            disabled={result !== null}
            spellCheck={false}
            className="w-full p-2.5 md:p-3 text-[16px] md:text-xl bg-gray-800 border border-purple-900 rounded-md text-gray-200 focus:outline-none focus:ring-0 focus:border-pink-500"
            placeholder="Forge your sentence..."
          />
          <button
            onClick={handleSubmit}
            disabled={!sentence.trim() || result !== null || loading}
            className="w-14 h-12 bg-pink-700 rounded-lg flex items-center justify-center text-white hover:bg-pink-600 disabled:bg-gray-600 transition-all cursor-default"
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