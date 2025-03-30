"use client";
import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prompt = `
You are an AI that checks if a sentence fits a paragraph's context.
- The sentence must use the given word: "{word}" in a standard dictionary meaning.
- It must logically complete the paragraph: "{paragraph}" as its final sentence.
- It must be grammatically correct and follow real-world logic.
- Reply "1" if it fits, "0" if it doesn’t.
`;

export default function WordForge({ difficulty }) {
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
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [challenges, setChallenges] = useState(null);
  const [remainingIndices, setRemainingIndices] = useState([]);
  const initializedRef = useRef(false);
  const intervalRef = useRef(null); // Re-added for loading delay

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const chatRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const chat = await model.startChat({
          history: [{ role: "user", parts: [{ text: prompt }] }],
        });
        chatRef.current = chat;

        const testResponse = await chat.sendMessage(
          `Paragraph: "The forest whispered secrets through rustling leaves." | Word: "signal" | Sentence: "A faint signal flickered in the distance."`
        );
        const testReply = await testResponse.response.text().trim();
        if (testReply !== "1" && testReply !== "0") {
          console.error("Model test failed:", testReply);
          return;
        }

        const res = await fetch("/data/wordForge.json");
        const fetchedChallenges = await res.json();
        setChallenges(fetchedChallenges[difficulty]);
        setRemainingIndices(
          Array.from({ length: fetchedChallenges[difficulty].length }, (_, i) => i)
        );
        setIsGameReady(true);
      } catch (error) {
        console.error("Error initializing chat or fetching challenges:", error);
      }
    })();
  }, [difficulty]);

  useEffect(() => {
    if (isGameReady && challenges && !initializedRef.current) {
      setNextChallenge();
      initializedRef.current = true;
    }
  }, [isGameReady, challenges]);

  useEffect(() => {
    if (timer === 0) {
      setGameOver(true);
    } else if (isGameReady) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGameReady, timer]);

  const setNextChallenge = () => {
    if (remainingIndices.length === 0) {
      setGameOver(true);
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
  };

  const handleSubmit = async () => {
    if (!sentence.trim() || !chatRef.current || loading) return;
    setLoading(true);
    setButtonDisabled(true);

    const formattedPrompt = prompt
      .replace("{word}", word)
      .replace("{paragraph}", paragraph);
    try {
      const response = await chatRef.current.sendMessage(
        `${formattedPrompt} | Sentence: "${sentence}"`
      );
      const aiReply = await response.response.text().trim();
      if (aiReply === "1") {
        setScore((prev) => prev + 1);
        setResult("correct");
      } else {
        setResult("incorrect");
      }
    } catch (error) {
      console.error("Error checking sentence:", error);
      setResult("error");
    }

    setLoading(false);
    setTimeout(() => {
      setRound((prev) => prev + 1);
      setNextChallenge();
    }, 600);
  };

  const handleReset = () => {
    setTimer(60);
    setScore(0);
    setRound(1);
    setGameOver(false);
    setSentence("");
    setResult(null);
    setParagraph("");
    setWord("");
    setIsGameReady(false);
    setButtonDisabled(false);
    setChallenges(null);
    setRemainingIndices([]);
    initializedRef.current = false;

    // Simulate loading delay like other modes
    if (intervalRef.current) clearInterval(intervalRef.current);
    let delay = 0;
    intervalRef.current = setInterval(() => {
      delay += 500;
      if (delay >= 1500) { // 1.5s delay to match animation
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        (async () => {
          try {
            const chat = await model.startChat({
              history: [{ role: "user", parts: [{ text: prompt }] }],
            });
            chatRef.current = chat;

            const res = await fetch("/data/wordForge.json");
            const fetchedChallenges = await res.json();
            setChallenges(fetchedChallenges[difficulty]);
            setRemainingIndices(
              Array.from({ length: fetchedChallenges[difficulty].length }, (_, i) => i)
            );
            setIsGameReady(true);
          } catch (error) {
            console.error("Error resetting chat or fetching challenges:", error);
          }
        })();
      }
    }, 500);
  };

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

  if (gameOver) {
    const roundsCompleted = round - 1;
    const accuracy = roundsCompleted > 0 ? ((score / roundsCompleted) * 100).toFixed(1) : "0.0";
  
    return (
      <div className="flex flex-col h-[50vh] justify-center items-center w-[80%] md:w-2/5 text-white
      opacity-0 scale-90 animate-[fadeZoom_0.5s_ease-out_forwards]">
        <div className="relative flex flex-col items-center justify-center space-y-6 bg-opacity-10">
          {/* Title */}
          <h1
            className="text-xl md:text-[22px] xl:text-[24px] font-orbitron text-white tracking-wide"
            style={{ textShadow: "0 0 8px rgba(236, 72, 153, 0.5)" }}
          >
            Forging Complete!
          </h1>
  
          {/* Stats Panel */}
          <div
            className="bg-purple-800 bg-opacity-20 border-2 border-purple-900 rounded-lg p-6 w-[80vw] max-w-96 shadow-lg"
            style={{ transform: "rotateX(5deg)" }}
          >
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
              <span className="text-pink-400">Difficulty:</span>{" "}
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </p>
          </div>
  
          {/* Button */}
          <button
            onClick={handleReset}
            className="z-10 mt-4 px-8 py-2 font-medium font-sans border-purple-900 border-2 bg-pink-700 text-lg text-white rounded-md hover:bg-pink-600 animate-pulse-slow"
          >
            Forge Again
          </button>
  
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col p-5 bg-gray-950 bg-opacity-50 border-[2px] border-purple-900 rounded-md w-[90%] md:w-3/4 lg:w-2/3 sm:max-w-[600px] md:max-w-[700px] items-center h-[425px] text-white">
      <div className="relative w-full bg-gray-800 h-1 mb-4">
        <div
          className="absolute top-0 left-0 h-1 bg-pink-700 rounded"
          style={{ width: `${(timer / 60) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center w-full mb-4 px-2">
        <div className="flex items-center space-x-4">
          <div className="px-4 py-1 bg-gray-800 bg-opacity-50 rounded-md mr-10 border border-purple-900 text-gray-300 text-lg">
            {round}
          </div>
        </div>
        <div
          className={`px-4 py-1 rounded-md border text-lg ${
            difficulty === "easy"
              ? "border-green-600 text-green-400 bg-green-900 bg-opacity-20"
              : difficulty === "medium"
              ? "border-yellow-600 text-yellow-400 bg-yellow-900 bg-opacity-20"
              : "border-red-600 text-red-400 bg-red-900 bg-opacity-20"
          }`}
        >
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </div>
        <div className="px-4 py-1 bg-gray-800 bg-opacity-50 rounded-md border border-purple-900 text-gray-300 text-lg">
          ⏳ {timer}s
        </div>
      </div>
      <div className="relative w-full min-h-[150px] bg-purple-950 bg-opacity-30 border border-purple-900 rounded-lg flex flex-col items-center justify-center px-6 mb-6 text-center shadow-inner">
        <p className="text-[14px] md:text-[16px] lg:text-[18px] font-mono text-gray-200 mb-2">{paragraph}</p>
        <h1 className="text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] font-mono font-medium text-pink-400 tracking-wide">
          [ {word} ]
        </h1>
      </div>
      <input
        type="text"
        placeholder="Enter your sentence"
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        className="w-full p-3.5 md:p-4 text-[16px] md:text-xl border border-gray-500 bg-gray-800 text-white rounded-sm md:rounded-md mb-6 focus:outline-none focus:ring-1 focus:ring-pink-600"
      />
      {result || loading ? (
        <button
          onClick={handleSubmit}
          disabled={buttonDisabled}
          className={`w-2/5 p-2.5 md:p-3.5 text-xl border rounded-lg flex items-center justify-center ${
            loading
              ? "bg-gray-700 bg-opacity-50 border-purple-900"
              : result === "correct"
              ? "approved-bg"
              : result === "incorrect"
              ? "rejected-bg"
              : "bg-pink-800 border-purple-900 text-white hover:border-pink-500 hover:shadow-[0_0_6px_1px_rgba(236,72,153,0.3)]"
          }`}
        >
          {loading
            ? "Checking..."
            : result === "correct"
            ? "Accepted"
            : result === "incorrect"
            ? "Rejected"
            : "Submit"}
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={buttonDisabled}
          className="w-2/5 p-2.5 md:p-3.5 text-xl border border-purple-900 bg-pink-800 text-white rounded-lg hover:border-pink-500 hover:shadow-[0_0_6px_1px_rgba(236,72,153,0.3)] transition-border-color transition-shadow duration-250"
        >
          Submit
        </button>
      )}
    </div>
  );
}