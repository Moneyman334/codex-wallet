import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const KONAMI_CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a"
];

export function useKonamiCode() {
  const [konamiIndex, setKonamiIndex] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem("codex_founder_mode") === "true";
  });
  const { toast } = useToast();

  const activateFounderMode = useCallback(() => {
    setIsUnlocked(true);
    localStorage.setItem("codex_founder_mode", "true");
    
    document.body.classList.add("founder-mode");
    
    toast({
      title: "🎮 FOUNDER MODE ACTIVATED",
      description: "Welcome to the inner circle. You've unlocked exclusive features!",
      duration: 5000,
    });

    const colors = ["#ff0080", "#7928ca", "#0070f3", "#00d4ff", "#ff4d4d"];
    let colorIndex = 0;
    const interval = setInterval(() => {
      document.documentElement.style.setProperty(
        "--founder-glow",
        colors[colorIndex % colors.length]
      );
      colorIndex++;
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      document.documentElement.style.removeProperty("--founder-glow");
    }, 3000);
  }, [toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const expectedKey = KONAMI_CODE[konamiIndex]?.toLowerCase();

      if (key === expectedKey) {
        const nextIndex = konamiIndex + 1;
        if (nextIndex === KONAMI_CODE.length) {
          activateFounderMode();
          setKonamiIndex(0);
        } else {
          setKonamiIndex(nextIndex);
        }
      } else {
        setKonamiIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [konamiIndex, activateFounderMode]);

  useEffect(() => {
    if (isUnlocked) {
      document.body.classList.add("founder-mode");
    }
  }, [isUnlocked]);

  return { isFounderMode: isUnlocked, activateFounderMode };
}
