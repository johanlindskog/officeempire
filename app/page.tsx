"use client";

import { useState } from "react";
import GameBoard from "./components/game/GameBoard";
import MainMenu from "./components/ui/MainMenu";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState<string>("level_1");

  const handleStartGame = (levelId: string) => {
    setCurrentLevelId(levelId);
    setIsPlaying(true);
  };

  if (!isPlaying) {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  // @ts-ignore - GameBoard prop will be added next
  return <GameBoard levelId={currentLevelId} />;
}
