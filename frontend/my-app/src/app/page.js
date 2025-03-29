"use client";

import { useState, useEffect } from "react";
import MainMenu from "./components/MainMenu";

export default function Home() {
  const originalText = "VERBOTRON";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const [displayText, setDisplayText] = useState(originalText);
  const [loaded, setLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Prevent SSR mismatch
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const triggerScramble = () => {
      let iterations = 0;
      const interval = setInterval(() => {
        setDisplayText((prev) =>
          prev
            .split("")
            .map((char, index) => {
              if (index < iterations) return originalText[index]; // Stop scrambling sequentially
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("")
        );

        iterations++;
        if (iterations > originalText.length) {
          clearInterval(interval);
          // Wait for a random time before triggering again
          setTimeout(triggerScramble, Math.random() * (15000 - 5000) + 5000); // 5s - 15s
        }
      }, 100); // Small delay between each letter
    };

    setLoaded(true);
    triggerScramble(); // Initial scramble

  }, [isClient]);

  return (
    <div className={`min-h-screen flex flex-col justify-between overflow-hidden transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}>
      <h1 className="text-[18px] sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-center bg-black border-b-2 border-b-gray-700 bg-opacity-50 font-centauri text-gray-200 stroke-violet stroke-5 p-6 
        tracking-[0.2em] sm:tracking-[0.4em] md:tracking-[0.6em] lg:tracking-[0.8em] xl:tracking-[1em]">
        {isClient ? displayText : originalText}
      </h1>
      <MainMenu />
      <footer className="text-sm md:text-[16px] w-full text-center text-gray-400 py-2">
        &copy; 2025 verbotron.io 🌌 v1.0.0
      </footer>
    </div>
  );
}
