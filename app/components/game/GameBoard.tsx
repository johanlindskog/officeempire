"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TileType,
  ToolType,
  GridCell,
  Direction,
  LightingType,
  VisualSettings,
  GRID_WIDTH,
  GRID_HEIGHT,
  Employee,
  Client,
  GameEconomy,
} from "./types";
import { getLevel } from "@/app/data/levels";
import {
  ROAD_SEGMENT_SIZE,
  getRoadSegmentOrigin,
  hasRoadSegment,
  getRoadConnections,
  getSegmentType,
  generateRoadPattern,
  getAffectedSegments,
  canPlaceRoadSegment,
} from "./roadUtils";
import { getBuilding, getBuildingFootprint } from "@/app/data/buildings";
import { getFurniture, getFurnitureFootprint } from "@/app/data/furniture";
import {
  generateClient,
  calculateMonthlyRevenue,
  applyClientChurn,
  shouldAcquirePassiveClient,
} from "@/app/utils/clientSystem";
import {
  generateEmployee,
  calculateMonthlySalaries,
  countAvailableDesks,
  findAvailableDesk,
} from "@/app/utils/employeeSystem";
import {
  updateAllEmployeeHappiness,
  calculateQuitProbability,
  calculateAverageHappiness,
} from "@/app/utils/happinessSystem";
import dynamic from "next/dynamic";
import type { PhaserGameHandle } from "./phaser/PhaserGame";
import {
  playDestructionSound,
  playBuildSound,
  playBuildRoadSound,
  playOpenSound,
  playDoubleClickSound,
  playClickSound,
} from "@/app/utils/sounds";

// Dynamically import PhaserGame (no SSR - Phaser needs browser APIs)
const PhaserGame = dynamic(() => import("./phaser/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "white",
        fontSize: 18,
      }}
    >
      Loading game...
    </div>
  ),
});

import ToolWindow from "../ui/ToolWindow";
import MusicPlayer from "../ui/MusicPlayer";
import LoadWindow from "../ui/LoadWindow";
import Modal from "../ui/Modal";
import PromptModal from "../ui/PromptModal";
import Dashboard from "../ui/Dashboard";
import BottomManagementBar from "../ui/BottomManagementBar";
import TutorialModal from "../ui/TutorialModal";

// Initialize grid with a center square of office floor tiles (matching Phaser's initialization)
const createEmptyGrid = (): GridCell[][] => {
  // Create a 26x26 center square of office floor tiles
  const squareSize = 26;
  const start = Math.floor((GRID_WIDTH - squareSize) / 2);
  const end = start + squareSize;

  return Array.from({ length: GRID_HEIGHT }, (_, y) =>
    Array.from({ length: GRID_WIDTH }, (_, x) => {
      const isCenterSquare = x >= start && x < end && y >= start && y < end;
      // Create a border of asphalt tiles around the office floor for a more defined look
      const isInnerBorder =
        isCenterSquare &&
        (x === start || x === end - 1 || y === start || y === end - 1);

      return {
        type: isInnerBorder ? TileType.Asphalt : (isCenterSquare ? TileType.Tile : TileType.Asphalt),
        x,
        y,
        isOrigin: true,
      };
    })
  );
};

// Create starter office layout for Level 1
const createLevel1StarterOffice = (): GridCell[][] => {
  const grid = createEmptyGrid();
  const squareSize = 26;
  const start = Math.floor((GRID_WIDTH - squareSize) / 2);

  // Helper to place furniture on the grid
  const placeFurniture = (
    furnitureId: string,
    gridX: number,
    gridY: number,
    width: number,
    height: number,
    orientation: Direction = Direction.Down
  ) => {
    // Look up furniture definition to get logical properties
    const furniture = getFurniture(furnitureId);
    const furnitureType = furniture?.furnitureType;
    // Capacity only matters for desks currently, but good to have generic support
    const capacity = furniture?.capacity;

    // Place origin cell
    grid[gridY][gridX] = {
      ...grid[gridY][gridX],
      type: TileType.Building,
      buildingId: furnitureId,
      buildingOrientation: orientation,
      isOrigin: true,
      furnitureType, // Add logical property
      capacity,      // Add logical property
    };

    // Place non-origin cells
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (dx !== 0 || dy !== 0) {
          grid[gridY + dy][gridX + dx] = {
            ...grid[gridY + dy][gridX + dx],
            type: TileType.Building,
            buildingId: furnitureId,
            buildingOrientation: orientation,
            isOrigin: false,
            originX: gridX,
            originY: gridY,
            furnitureType, // Add logical property
            capacity,      // Add logical property
          };
        }
      }
    }
  };

  // Office layout - coordinates relative to the office tile area
  const centerX = start + Math.floor(squareSize / 2);
  const centerY = start + Math.floor(squareSize / 2);

  // Starter desks area (left side) - 6 basic desks for initial employees
  placeFurniture("basic-desk", centerX - 8, centerY - 8, 1, 1);
  placeFurniture("basic-desk", centerX - 6, centerY - 8, 1, 1);
  placeFurniture("basic-desk", centerX - 4, centerY - 8, 1, 1);
  placeFurniture("basic-desk", centerX - 8, centerY - 6, 1, 1);
  placeFurniture("basic-desk", centerX - 6, centerY - 6, 1, 1);
  placeFurniture("basic-desk", centerX - 4, centerY - 6, 1, 1);

  // Small meeting room (right side top)
  placeFurniture("small-meeting", centerX + 5, centerY - 8, 2, 2);

  // Break area (bottom left)
  placeFurniture("coffee-station", centerX - 8, centerY + 2, 1, 1);
  placeFurniture("water-cooler", centerX - 6, centerY + 2, 1, 1);
  placeFurniture("break-table", centerX - 8, centerY + 4, 2, 2);

  // Executive/Premium desks (right side) - for the CEO and managers
  placeFurniture("executive-desk", centerX + 5, centerY + 2, 2, 1);
  placeFurniture("premium-desk", centerX + 5, centerY + 4, 1, 1);
  placeFurniture("premium-desk", centerX + 7, centerY + 4, 1, 1);

  // Standing desk in middle area
  placeFurniture("standing-desk", centerX - 1, centerY - 2, 1, 1);

  return grid;
};

// Create starter office layout for Level 2 (just a founder desk)
const createLevel2StarterOffice = (): GridCell[][] => {
  const grid = createEmptyGrid();
  const squareSize = 26;
  const start = Math.floor((GRID_WIDTH - squareSize) / 2);
  const centerX = start + Math.floor(squareSize / 2);
  const centerY = start + Math.floor(squareSize / 2);

  // Look up furniture definition to get logical properties
  const furniture = getFurniture("executive-desk");
  const furnitureType = furniture?.furnitureType;
  const capacity = furniture?.capacity;

  // Place a single executive desk for the founder in the center
  grid[centerY][centerX] = {
    ...grid[centerY][centerX],
    type: TileType.Building,
    buildingId: "executive-desk",
    buildingOrientation: Direction.Down,
    isOrigin: true,
    furnitureType,
    capacity,
  };

  // Executive desk is 2x1, place the second cell
  grid[centerY][centerX + 1] = {
    ...grid[centerY][centerX + 1],
    type: TileType.Building,
    buildingId: "executive-desk",
    buildingOrientation: Direction.Down,
    isOrigin: false,
    originX: centerX,
    originY: centerY,
    furnitureType,
    capacity,
  };

  return grid;
};

// Create starter office layout for Level 3 (just a founder desk)
const createLevel3StarterOffice = (): GridCell[][] => {
  const grid = createEmptyGrid();
  const squareSize = 26;
  const start = Math.floor((GRID_WIDTH - squareSize) / 2);
  const centerX = start + Math.floor(squareSize / 2);
  const centerY = start + Math.floor(squareSize / 2);

  // Look up furniture definition to get logical properties
  const furniture = getFurniture("executive-desk");
  const furnitureType = furniture?.furnitureType;
  const capacity = furniture?.capacity;

  // Place a single executive desk for the founder in the center
  grid[centerY][centerX] = {
    ...grid[centerY][centerX],
    type: TileType.Building,
    buildingId: "executive-desk",
    buildingOrientation: Direction.Down,
    isOrigin: true,
    furnitureType,
    capacity,
  };

  // Executive desk is 2x1, place the second cell
  grid[centerY][centerX + 1] = {
    ...grid[centerY][centerX + 1],
    type: TileType.Building,
    buildingId: "executive-desk",
    buildingOrientation: Direction.Down,
    isOrigin: false,
    originX: centerX,
    originY: centerY,
    furnitureType,
    capacity,
  };

  return grid;
};

// Discrete zoom levels matching the button zoom levels
const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 4];
const SCROLL_THRESHOLD = 100; // Amount of scroll needed to change zoom level

// Helper function to find closest zoom level index
const findClosestZoomIndex = (zoomValue: number): number => {
  let closestIndex = 0;
  let minDiff = Math.abs(zoomValue - ZOOM_LEVELS[0]);
  for (let i = 1; i < ZOOM_LEVELS.length; i++) {
    const diff = Math.abs(zoomValue - ZOOM_LEVELS[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }
  return closestIndex;
};

export default function GameBoard({ levelId = "level_1", onReturnToMenu }: { levelId?: string; onReturnToMenu?: () => void }) {
  // Grid state (only thing React manages now)
  // Use starter office for level 1, level 2 starter for level 2, level 3 starter for level 3, empty grid for other levels
  const [grid, setGrid] = useState<GridCell[][]>(() => {
    let initialGrid: GridCell[][];
    if (levelId === "level_1") {
      initialGrid = createLevel1StarterOffice();
    } else if (levelId === "level_2") {
      initialGrid = createLevel2StarterOffice();
    } else if (levelId === "level_3") {
      initialGrid = createLevel3StarterOffice();
    } else {
      initialGrid = createEmptyGrid();
    }

    // Count furniture in initial grid
    let furnitureCount = 0;
    for (let y = 0; y < initialGrid.length; y++) {
      for (let x = 0; x < initialGrid[y].length; x++) {
        if (initialGrid[y][x].buildingId) {
          furnitureCount++;
          if (furnitureCount <= 3) {
            console.log("[GameBoard] Furniture at (" + x + "," + y + "):", initialGrid[y][x].buildingId);
          }
        }
      }
    }
    console.log("[GameBoard] Created initial grid with", furnitureCount, "furniture cells for level:", levelId);

    return initialGrid;
  });

  // UI state
  const [selectedTool, setSelectedTool] = useState<ToolType>(ToolType.None);
  const [zoom, setZoom] = useState(1.2);
  const [debugPaths, setDebugPaths] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isToolWindowVisible, setIsToolWindowVisible] = useState(false);
  const [buildingOrientation, setBuildingOrientation] = useState<Direction>(
    Direction.Down
  );
  const [isPlayerDriving, setIsPlayerDriving] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null
  );
  const [isLoadWindowVisible, setIsLoadWindowVisible] = useState(false);
  const [isTutorialVisible, setIsTutorialVisible] = useState(() => {
    // Show tutorial for level 1 if user hasn't seen it before
    if (levelId === "level_1") {
      const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
      return !hasSeenTutorial;
    }
    return false;
  });
  const [modalState, setModalState] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    showCancel?: boolean;
    onConfirm?: (() => void) | null;
  }>({
    isVisible: false,
    title: "",
    message: "",
    showCancel: false,
    onConfirm: null,
  });
  const [promptState, setPromptState] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    defaultValue: string;
    onConfirm: ((value: string) => void) | null;
  }>({
    isVisible: false,
    title: "",
    message: "",
    defaultValue: "",
    onConfirm: null,
  });
  const [visualSettings, setVisualSettings] = useState<VisualSettings>({
    blueness: 0,
    contrast: 1.0,
    saturation: 1.0,
    brightness: 1.0,
  });

  // Mobile warning state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileWarningDismissed, setMobileWarningDismissed] = useState(false);

  // Office Simulator state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [economy, setEconomy] = useState<GameEconomy>({
    cash: 20000, // Starting capital
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    lastMonthTick: Date.now(),
  });
  const [gameInitialized, setGameInitialized] = useState(false);

  // Initialize game with starting employees and clients
  useEffect(() => {
    if (!gameInitialized) {
      // Find an available desk for the founder
      const founderDesk = findAvailableDesk(grid);

      // Add founder employee (you!) and assign to desk if available
      const founder = generateEmployee(0);
      founder.salary = 10000;
      founder.name = "You (Founder)";

      if (founderDesk) {
        founder.assignedDeskId = `${founderDesk.x},${founderDesk.y}`;

        // Spawn founder character at the desk (wait for game to be ready)
        setTimeout(() => {
          if (phaserGameRef.current) {
            const characterId = phaserGameRef.current.spawnEmployeeCharacter(
              founder.id,
              founderDesk.x,
              founderDesk.y
            );
            founder.characterId = characterId;
            // Update employee with characterId
            setEmployees(prev => prev.map(emp =>
              emp.id === founder.id ? { ...emp, characterId } : emp
            ));
          }
        }, 100);

        // Mark the desk as assigned in the grid
        setGrid((prevGrid) => {
          const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
          newGrid[founderDesk.y][founderDesk.x] = {
            ...newGrid[founderDesk.y][founderDesk.x],
            assignedEmployeeId: founder.id,
          };
          return newGrid;
        });
      }

      setEmployees([founder]);

      // Add 2 starting clients
      setClients([generateClient(), generateClient()]);

      setGameInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameInitialized]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Ref to Phaser game for spawning entities
  const phaserGameRef = useRef<PhaserGameHandle>(null);

  // Ref to map container for scrolling to center
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Ref to track accumulated scroll delta for zoom
  const scrollAccumulatorRef = useRef(0);
  const scrollDirectionRef = useRef<number | null>(null); // Track scroll direction: positive = down, negative = up

  // Scroll the map container to center the canvas when it loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapContainerRef.current) {
        const container = mapContainerRef.current;
        const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        const scrollTop = (container.scrollHeight - container.clientHeight) / 2;
        container.scrollLeft = scrollLeft;
        container.scrollTop = scrollTop;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Reset building orientation to south when switching buildings
  useEffect(() => {
    if (selectedBuildingId) {
      const building = getBuilding(selectedBuildingId);
      if (building?.supportsRotation) {
        setBuildingOrientation(Direction.Down);
      }
    }
  }, [selectedBuildingId]);

  // Handle keyboard rotation for buildings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle rotation if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement)?.isContentEditable);

      if (isTyping) {
        return;
      }

      if (selectedTool === ToolType.Building && selectedBuildingId) {
        const building = getBuilding(selectedBuildingId);
        if (building?.supportsRotation && (e.key === "r" || e.key === "R")) {
          e.preventDefault();
          setBuildingOrientation((prev) => {
            switch (prev) {
              case Direction.Down:
                return Direction.Right;
              case Direction.Right:
                return Direction.Up;
              case Direction.Up:
                return Direction.Left;
              case Direction.Left:
                return Direction.Down;
              default:
                return Direction.Down;
            }
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTool, selectedBuildingId]);

  // Handle ESC key to deselect tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle ESC if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement)?.isContentEditable);

      if (isTyping) {
        return;
      }

      if (e.key === "Escape") {
        if (selectedTool !== ToolType.None) {
          setSelectedTool(ToolType.None);
        }
        // Close tool window if it's open
        if (isToolWindowVisible) {
          setIsToolWindowVisible(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTool, isToolWindowVisible]);

  // Sync driving state with Phaser
  useEffect(() => {
    if (phaserGameRef.current) {
      phaserGameRef.current.setDrivingState(isPlayerDriving);
    }
  }, [isPlayerDriving]);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);

  // Handler to advance to next month immediately
  const handleAdvanceMonth = useCallback(() => {
    // Calculate revenue from clients
    const revenue = calculateMonthlyRevenue(clients);

    // Calculate expenses
    const salaries = calculateMonthlySalaries(employees);
    const deskCount = grid
      .flat()
      .filter((cell) => cell.furnitureType === "desk" && cell.isOrigin).length;
    const rent = deskCount * 100; // $100/desk/month
    const expenses = salaries + rent;

    // Update economy
    setEconomy((prev) => ({
      cash: prev.cash + revenue - expenses,
      monthlyRevenue: revenue,
      monthlyExpenses: expenses,
      lastMonthTick: Date.now(), // Reset the timer
    }));

    // Apply client churn
    setClients((prev) => applyClientChurn(prev, employees.length));

    // Passive client acquisition (if 5+ employees)
    if (shouldAcquirePassiveClient(employees.length) && clients.length < 100) {
      setClients((prev) => [...prev, generateClient()]);
    }

    // Check for bankruptcy
    if (economy.cash + revenue - expenses < -expenses && expenses > 0) {
      setIsPaused(true);
      setModalState({
        isVisible: true,
        title: "Bankruptcy!",
        message: `Your consultancy has run out of money. Game Over!\n\nFinal Stats:\nEmployees: ${employees.length}\nClients: ${clients.length}\nCash: $${(economy.cash + revenue - expenses).toLocaleString()}`,
        showCancel: false,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isVisible: false }));
          // Return to main menu
          if (onReturnToMenu) {
            onReturnToMenu();
          }
        },
      });
    }

    playDoubleClickSound();
  }, [economy, clients, employees, grid]);

  // Office Simulator: Monthly Economic Cycle
  useEffect(() => {
    if (isPaused || isTutorialVisible) return;

    const monthDuration = 30000; // 30 seconds = 1 game month

    const interval = setInterval(() => {
      const now = Date.now();

      if (now - economy.lastMonthTick >= monthDuration) {
        // Calculate revenue from clients
        const revenue = calculateMonthlyRevenue(clients);

        // Calculate expenses
        const salaries = calculateMonthlySalaries(employees);
        const deskCount = grid
          .flat()
          .filter((cell) => cell.furnitureType === "desk" && cell.isOrigin).length;
        const rent = deskCount * 100; // $100/desk/month
        const expenses = salaries + rent;

        // Update economy
        setEconomy((prev) => ({
          cash: prev.cash + revenue - expenses,
          monthlyRevenue: revenue,
          monthlyExpenses: expenses,
          lastMonthTick: now,
        }));

        // Update employee happiness based on current office conditions
        setEmployees((prev) => updateAllEmployeeHappiness(prev, grid));

        // Handle unhappy employees quitting
        setEmployees((prev) => {
          const remainingEmployees = prev.filter((emp) => {
            const quitChance = calculateQuitProbability(emp.happiness);
            if (quitChance > 0 && Math.random() < quitChance) {
              // Employee quits! Remove their character
              if (emp.characterId && phaserGameRef.current) {
                phaserGameRef.current.removeEmployeeCharacter(emp.characterId);
              }

              // Clear their desk assignment
              if (emp.assignedDeskId) {
                const [deskX, deskY] = emp.assignedDeskId.split(",").map(Number);
                setGrid((prevGrid) => {
                  const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
                  if (newGrid[deskY]?.[deskX]) {
                    newGrid[deskY][deskX].assignedEmployeeId = undefined;
                  }
                  return newGrid;
                });
              }
              return false; // Remove this employee
            }
            return true; // Keep this employee
          });
          return remainingEmployees;
        });

        // Apply client churn
        setClients((prev) => applyClientChurn(prev, employees.length));

        // Passive client acquisition (if 5+ employees)
        if (shouldAcquirePassiveClient(employees.length) && clients.length < 100) {
          setClients((prev) => [...prev, generateClient()]);
        }

        // Check for bankruptcy
        if (economy.cash < -expenses && expenses > 0) {
          setIsPaused(true);
          setModalState({
            isVisible: true,
            title: "Bankruptcy!",
            message: `Your consultancy has run out of money. Game Over!\n\nFinal Stats:\nEmployees: ${employees.length}\nClients: ${clients.length}\nCash: $${economy.cash.toLocaleString()}`,
            showCancel: false,
            onConfirm: () => {
              setModalState((prev) => ({ ...prev, isVisible: false }));
              // Return to main menu
              if (onReturnToMenu) {
                onReturnToMenu();
              }
            },
          });
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [economy, clients, employees, grid, isPaused, isTutorialVisible]);

  // Check for victory
  useEffect(() => {
    if (isPaused) return;

    const currentLevel = getLevel(levelId);
    if (!currentLevel) return;

    const avgHappiness = calculateAverageHappiness(employees);
    const employeeGoalMet = employees.length >= currentLevel.goals.employees;
    const clientGoalMet = clients.length >= currentLevel.goals.clients;
    const happinessGoalMet = !currentLevel.goals.happiness || avgHappiness >= currentLevel.goals.happiness;

    if (employeeGoalMet && clientGoalMet && happinessGoalMet) {
      setIsPaused(true);

      let statsMessage = `Current Stats:\nEmployees: ${employees.length}\nClients: ${clients.length}`;
      if (currentLevel.goals.happiness) {
        statsMessage += `\nHappiness: ${avgHappiness}%`;
      }
      statsMessage += `\nCash: $${economy.cash.toLocaleString()}`;

      setModalState({
        isVisible: true,
        title: levelId === "level_1" ? "Level Complete! 🌟" : "Victory! 🎉",
        message: `Congratulations! You've reached the goals for ${currentLevel.name}!\n\n${statsMessage}`,
        showCancel: false,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isVisible: false }));
          if (onReturnToMenu) {
            onReturnToMenu();
          } else {
            setIsPaused(false);
          }
        },
      });
    }
  }, [employees.length, clients.length, levelId, isPaused, onReturnToMenu, economy.cash, employees]);


  // Handle tile click (grid modifications)
  const handleTileClick = useCallback(
    (x: number, y: number) => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));

        switch (selectedTool) {
          case ToolType.None: {
            break;
          }
          case ToolType.RoadNetwork: {
            const segmentOrigin = getRoadSegmentOrigin(x, y);
            const placementCheck = canPlaceRoadSegment(
              newGrid,
              segmentOrigin.x,
              segmentOrigin.y
            );
            if (!placementCheck.valid) break;

            for (let dy = 0; dy < ROAD_SEGMENT_SIZE; dy++) {
              for (let dx = 0; dx < ROAD_SEGMENT_SIZE; dx++) {
                const px = segmentOrigin.x + dx;
                const py = segmentOrigin.y + dy;
                if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                  newGrid[py][px].isOrigin = dx === 0 && dy === 0;
                  newGrid[py][px].originX = segmentOrigin.x;
                  newGrid[py][px].originY = segmentOrigin.y;
                  newGrid[py][px].type = TileType.Road;
                }
              }
            }

            const affectedSegments = getAffectedSegments(
              segmentOrigin.x,
              segmentOrigin.y
            );

            for (const seg of affectedSegments) {
              if (!hasRoadSegment(newGrid, seg.x, seg.y)) continue;

              const connections = getRoadConnections(newGrid, seg.x, seg.y);
              const segmentType = getSegmentType(connections);
              const pattern = generateRoadPattern(segmentType);

              for (const tile of pattern) {
                const px = seg.x + tile.dx;
                const py = seg.y + tile.dy;
                if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                  newGrid[py][px].type = tile.type;
                }
              }
            }
            playBuildRoadSound();
            break;
          }
          case ToolType.Tile: {
            if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
              const cell = newGrid[y][x];
              if (cell.type === TileType.Building && cell.buildingId) {
                const building = getBuilding(cell.buildingId);
                if (
                  building &&
                  (building.category === "props" || building.isDecoration)
                ) {
                  newGrid[y][x].underlyingTileType = TileType.Tile;
                } else {
                  break;
                }
              } else if (
                cell.type === TileType.Grass ||
                cell.type === TileType.Snow
              ) {
                newGrid[y][x].type = TileType.Tile;
                newGrid[y][x].isOrigin = true;
                newGrid[y][x].originX = x;
                newGrid[y][x].originY = y;
              } else {
                break;
              }
              playBuildRoadSound();
            }
            break;
          }
          case ToolType.Asphalt: {
            if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
              const cell = newGrid[y][x];
              if (cell.type === TileType.Building && cell.buildingId) {
                const building = getBuilding(cell.buildingId);
                if (
                  building &&
                  (building.category === "props" || building.isDecoration)
                ) {
                  newGrid[y][x].underlyingTileType = TileType.Asphalt;
                } else {
                  break;
                }
              } else if (
                cell.type === TileType.Grass ||
                cell.type === TileType.Snow ||
                cell.type === TileType.Tile
              ) {
                newGrid[y][x].type = TileType.Asphalt;
                newGrid[y][x].isOrigin = true;
                newGrid[y][x].originX = x;
                newGrid[y][x].originY = y;
              } else {
                break;
              }
              playBuildRoadSound();
            }
            break;
          }
          case ToolType.Snow: {
            if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
              const cell = newGrid[y][x];
              if (cell.type === TileType.Building && cell.buildingId) {
                const building = getBuilding(cell.buildingId);
                if (
                  building &&
                  (building.category === "props" || building.isDecoration)
                ) {
                  newGrid[y][x].underlyingTileType = TileType.Snow;
                } else {
                  break;
                }
              } else if (
                cell.type === TileType.Grass ||
                cell.type === TileType.Tile
              ) {
                newGrid[y][x].type = TileType.Snow;
                newGrid[y][x].isOrigin = true;
                newGrid[y][x].originX = x;
                newGrid[y][x].originY = y;
              } else {
                break;
              }
              playBuildRoadSound();
            }
            break;
          }
          case ToolType.Building: {
            if (!selectedBuildingId) break;

            // Check if it's furniture (office simulator) or building (city builder)
            const furniture = getFurniture(selectedBuildingId);
            const building = furniture ? null : getBuilding(selectedBuildingId);

            if (!furniture && !building) break;

            // For furniture, check if player has enough cash
            if (furniture) {
              if (economy.cash < furniture.cost) {
                // Show insufficient funds modal
                setModalState({
                  isVisible: true,
                  title: "Insufficient Funds",
                  message: `Not enough cash to purchase ${furniture.name}. Cost: $${furniture.cost.toLocaleString()}, Available: $${economy.cash.toLocaleString()}`,
                  showCancel: false,
                  onConfirm: () => {
                    setModalState((prev) => ({ ...prev, isVisible: false }));
                  },
                });
                break;
              }
            }

            // Get footprint based on current orientation
            const footprint = furniture
              ? getFurnitureFootprint(furniture, buildingOrientation)
              : getBuildingFootprint(building!, buildingOrientation);

            const bOriginX = x - footprint.width + 1;
            const bOriginY = y - footprint.height + 1;

            if (
              bOriginX < 0 ||
              bOriginY < 0 ||
              bOriginX + footprint.width > GRID_WIDTH ||
              bOriginY + footprint.height > GRID_HEIGHT
            ) {
              break;
            }

            const isDecoration = building
              ? (building.category === "props" || building.isDecoration)
              : false;
            let buildingHasCollision = false;
            for (
              let dy = 0;
              dy < footprint.height && !buildingHasCollision;
              dy++
            ) {
              for (
                let dx = 0;
                dx < footprint.width && !buildingHasCollision;
                dx++
              ) {
                const px = bOriginX + dx;
                const py = bOriginY + dy;
                if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                  const cellType = newGrid[py][px].type;
                  if (furniture) {
                    // Furniture (office simulator) can only be placed on Tile (office floor)
                    if (cellType !== TileType.Tile) {
                      buildingHasCollision = true;
                    }
                  } else if (isDecoration) {
                    // Decorations can be placed on grass, tile, or snow
                    if (
                      cellType !== TileType.Grass &&
                      cellType !== TileType.Tile &&
                      cellType !== TileType.Snow
                    ) {
                      buildingHasCollision = true;
                    }
                  } else {
                    // Regular buildings can only be placed on grass
                    if (cellType !== TileType.Grass) {
                      buildingHasCollision = true;
                    }
                  }
                }
              }
            }
            if (buildingHasCollision) break;

            // Place furniture/building on grid
            for (let dy = 0; dy < footprint.height; dy++) {
              for (let dx = 0; dx < footprint.width; dx++) {
                const px = bOriginX + dx;
                const py = bOriginY + dy;
                if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                  const underlyingType = isDecoration
                    ? newGrid[py][px].type
                    : undefined;
                  newGrid[py][px].type = TileType.Building;
                  newGrid[py][px].buildingId = selectedBuildingId;
                  newGrid[py][px].isOrigin = dx === 0 && dy === 0;
                  newGrid[py][px].originX = bOriginX;
                  newGrid[py][px].originY = bOriginY;
                  if (isDecoration) {
                    newGrid[py][px].underlyingTileType = underlyingType;
                  }
                  // Store furniture type for office simulator
                  if (furniture) {
                    newGrid[py][px].furnitureType = furniture.furnitureType;
                    if (furniture.capacity) {
                      newGrid[py][px].capacity = furniture.capacity;
                    }
                  }
                  // Handle rotation
                  if (furniture?.supportsRotation || building?.supportsRotation) {
                    newGrid[py][px].buildingOrientation = buildingOrientation;
                  }
                }
              }
            }

            // Deduct cost for furniture
            if (furniture) {
              setEconomy((prev) => ({
                ...prev,
                cash: prev.cash - furniture.cost,
              }));
            }

            playBuildSound();
            // Trigger screen shake effect (like SimCity 4)
            if (phaserGameRef.current) {
              phaserGameRef.current.shakeScreen("y", 0.6, 150);
            }
            break;
          }
          case ToolType.Eraser: {
            const cell = newGrid[y][x];
            const originX = cell.originX;
            const originY = cell.originY;
            const cellType = cell.type;

            const shouldPlaySound = cellType !== TileType.Grass;

            if (originX !== undefined && originY !== undefined) {
              const isRoadSegment =
                hasRoadSegment(newGrid, originX, originY) &&
                (cellType === TileType.Road || cellType === TileType.Asphalt);

              if (isRoadSegment) {
                const neighbors = getAffectedSegments(originX, originY).filter(
                  (seg) => seg.x !== originX || seg.y !== originY
                );

                for (let dy = 0; dy < ROAD_SEGMENT_SIZE; dy++) {
                  for (let dx = 0; dx < ROAD_SEGMENT_SIZE; dx++) {
                    const px = originX + dx;
                    const py = originY + dy;
                    if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                      newGrid[py][px].type = TileType.Grass;
                      newGrid[py][px].isOrigin = true;
                      newGrid[py][px].originX = undefined;
                      newGrid[py][px].originY = undefined;
                    }
                  }
                }

                for (const seg of neighbors) {
                  if (!hasRoadSegment(newGrid, seg.x, seg.y)) continue;

                  const connections = getRoadConnections(newGrid, seg.x, seg.y);
                  const segmentType = getSegmentType(connections);
                  const pattern = generateRoadPattern(segmentType);

                  for (const tile of pattern) {
                    const px = seg.x + tile.dx;
                    const py = seg.y + tile.dy;
                    if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                      newGrid[py][px].type = tile.type;
                    }
                  }
                }

                if (shouldPlaySound) {
                  playDestructionSound();
                  // Horizontal shake on deletion
                  phaserGameRef.current?.shakeScreen("x", 0.6, 150);
                }
              } else {
                const cellBuildingId = cell.buildingId;
                let sizeW = 1;
                let sizeH = 1;

                if (cellType === TileType.Building && cellBuildingId) {
                  const building = getBuilding(cellBuildingId);
                  if (building) {
                    // Get footprint based on stored orientation
                    const footprint = getBuildingFootprint(
                      building,
                      cell.buildingOrientation
                    );
                    sizeW = footprint.width;
                    sizeH = footprint.height;
                  }
                }

                for (let dy = 0; dy < sizeH; dy++) {
                  for (let dx = 0; dx < sizeW; dx++) {
                    const px = originX + dx;
                    const py = originY + dy;
                    if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                      newGrid[py][px].type = TileType.Grass;
                      newGrid[py][px].buildingId = undefined;
                      newGrid[py][px].isOrigin = true;
                      newGrid[py][px].originX = undefined;
                      newGrid[py][px].originY = undefined;
                    }
                  }
                }

                if (shouldPlaySound) {
                  playDestructionSound();
                  // Horizontal shake on deletion
                  phaserGameRef.current?.shakeScreen("x", 0.6, 150);
                }
              }
            } else if (cellType !== TileType.Grass) {
              newGrid[y][x].type = TileType.Grass;
              newGrid[y][x].isOrigin = true;
              playDestructionSound();
              // Horizontal shake on deletion
              phaserGameRef.current?.shakeScreen("x", 0.6, 150);
            }
            break;
          }
        }

        return newGrid;
      });
    },
    [selectedTool, selectedBuildingId, buildingOrientation]
  );

  // Handle batch tile placement from drag operations (snow/tile tools)
  const handleTilesDrag = useCallback(
    (tiles: Array<{ x: number; y: number }>) => {
      if (tiles.length === 0) return;

      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
        let anyPlaced = false;

        for (const { x, y } of tiles) {
          if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;

          const cell = newGrid[y][x];

          if (selectedTool === ToolType.Snow) {
            if (cell.type === TileType.Building && cell.buildingId) {
              const building = getBuilding(cell.buildingId);
              if (
                building &&
                (building.category === "props" || building.isDecoration)
              ) {
                newGrid[y][x].underlyingTileType = TileType.Snow;
                anyPlaced = true;
              }
            } else if (
              cell.type === TileType.Grass ||
              cell.type === TileType.Tile
            ) {
              newGrid[y][x].type = TileType.Snow;
              newGrid[y][x].isOrigin = true;
              newGrid[y][x].originX = x;
              newGrid[y][x].originY = y;
              anyPlaced = true;
            }
          } else if (selectedTool === ToolType.Tile) {
            if (cell.type === TileType.Building && cell.buildingId) {
              const building = getBuilding(cell.buildingId);
              if (
                building &&
                (building.category === "props" || building.isDecoration)
              ) {
                newGrid[y][x].underlyingTileType = TileType.Tile;
                anyPlaced = true;
              }
            } else if (
              cell.type === TileType.Grass ||
              cell.type === TileType.Snow
            ) {
              newGrid[y][x].type = TileType.Tile;
              newGrid[y][x].isOrigin = true;
              newGrid[y][x].originX = x;
              newGrid[y][x].originY = y;
              anyPlaced = true;
            }
          } else if (selectedTool === ToolType.Asphalt) {
            if (cell.type === TileType.Building && cell.buildingId) {
              const building = getBuilding(cell.buildingId);
              if (
                building &&
                (building.category === "props" || building.isDecoration)
              ) {
                newGrid[y][x].underlyingTileType = TileType.Asphalt;
                anyPlaced = true;
              }
            } else if (
              cell.type === TileType.Grass ||
              cell.type === TileType.Snow ||
              cell.type === TileType.Tile
            ) {
              newGrid[y][x].type = TileType.Asphalt;
              newGrid[y][x].isOrigin = true;
              newGrid[y][x].originX = x;
              newGrid[y][x].originY = y;
              anyPlaced = true;
            }
          }
        }

        if (anyPlaced) {
          playBuildRoadSound();
        }

        return newGrid;
      });
    },
    [selectedTool]
  );

  // Handle batch road segment placement from drag operations
  const handleRoadDrag = useCallback(
    (segments: Array<{ x: number; y: number }>) => {
      if (segments.length === 0) return;

      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
        let anyPlaced = false;

        // Place all road segments
        for (const { x: segmentX, y: segmentY } of segments) {
          const placementCheck = canPlaceRoadSegment(
            newGrid,
            segmentX,
            segmentY
          );
          if (!placementCheck.valid) continue;

          for (let dy = 0; dy < ROAD_SEGMENT_SIZE; dy++) {
            for (let dx = 0; dx < ROAD_SEGMENT_SIZE; dx++) {
              const px = segmentX + dx;
              const py = segmentY + dy;
              if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                newGrid[py][px].isOrigin = dx === 0 && dy === 0;
                newGrid[py][px].originX = segmentX;
                newGrid[py][px].originY = segmentY;
                newGrid[py][px].type = TileType.Road;
                anyPlaced = true;
              }
            }
          }
        }

        if (anyPlaced) {
          // Update all affected segments (including neighbors)
          const allAffectedSegments = new Set<string>();
          for (const { x: segmentX, y: segmentY } of segments) {
            const affectedSegments = getAffectedSegments(segmentX, segmentY);
            for (const seg of affectedSegments) {
              allAffectedSegments.add(`${seg.x},${seg.y}`);
            }
          }

          for (const segKey of allAffectedSegments) {
            const [segX, segY] = segKey.split(",").map(Number);
            if (!hasRoadSegment(newGrid, segX, segY)) continue;

            const connections = getRoadConnections(newGrid, segX, segY);
            const segmentType = getSegmentType(connections);
            const pattern = generateRoadPattern(segmentType);

            for (const tile of pattern) {
              const px = segX + tile.dx;
              const py = segY + tile.dy;
              if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                newGrid[py][px].type = tile.type;
              }
            }
          }

          playBuildRoadSound();
        }

        return newGrid;
      });
    },
    []
  );

  // Perform the actual deletion of tiles
  const performDeletion = useCallback(
    (tiles: Array<{ x: number; y: number }>) => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
        const deletedOrigins = new Set<string>();

        for (const { x, y } of tiles) {
          if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;

          const cell = newGrid[y][x];
          if (cell.type === TileType.Grass) continue;

          const originX = cell.originX ?? x;
          const originY = cell.originY ?? y;
          const originKey = `${originX},${originY}`;

          if (deletedOrigins.has(originKey)) continue;
          deletedOrigins.add(originKey);

          const cellType = cell.type;

          if (cellType === TileType.Road || cellType === TileType.Asphalt) {
            const isRoadSegment = hasRoadSegment(newGrid, originX, originY);

            if (isRoadSegment) {
              // Delete road segment
              const neighbors = getAffectedSegments(originX, originY).filter(
                (seg) => seg.x !== originX || seg.y !== originY
              );

              for (let dy = 0; dy < ROAD_SEGMENT_SIZE; dy++) {
                for (let dx = 0; dx < ROAD_SEGMENT_SIZE; dx++) {
                  const px = originX + dx;
                  const py = originY + dy;
                  if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                    newGrid[py][px].type = TileType.Grass;
                    newGrid[py][px].isOrigin = true;
                    newGrid[py][px].originX = undefined;
                    newGrid[py][px].originY = undefined;
                  }
                }
              }

              // Update neighboring road segments
              for (const seg of neighbors) {
                if (!hasRoadSegment(newGrid, seg.x, seg.y)) continue;

                const connections = getRoadConnections(newGrid, seg.x, seg.y);
                const segmentType = getSegmentType(connections);
                const pattern = generateRoadPattern(segmentType);

                for (const tile of pattern) {
                  const px = seg.x + tile.dx;
                  const py = seg.y + tile.dy;
                  if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                    newGrid[py][px].type = tile.type;
                  }
                }
              }
            } else {
              // Single tile
              newGrid[y][x].type = TileType.Grass;
              newGrid[y][x].isOrigin = true;
              newGrid[y][x].originX = undefined;
              newGrid[y][x].originY = undefined;
            }
          } else if (cellType === TileType.Building && cell.buildingId) {
            // Delete building
            const building = getBuilding(cell.buildingId);
            let sizeW = 1;
            let sizeH = 1;

            if (building) {
              const footprint = getBuildingFootprint(
                building,
                cell.buildingOrientation
              );
              sizeW = footprint.width;
              sizeH = footprint.height;
            }

            for (let dy = 0; dy < sizeH; dy++) {
              for (let dx = 0; dx < sizeW; dx++) {
                const px = originX + dx;
                const py = originY + dy;
                if (px < GRID_WIDTH && py < GRID_HEIGHT) {
                  newGrid[py][px].type = TileType.Grass;
                  newGrid[py][px].buildingId = undefined;
                  newGrid[py][px].isOrigin = true;
                  newGrid[py][px].originX = undefined;
                  newGrid[py][px].originY = undefined;
                }
              }
            }
          } else {
            // Snow, Tile, or other single tiles
            newGrid[y][x].type = TileType.Grass;
            newGrid[y][x].isOrigin = true;
            newGrid[y][x].originX = undefined;
            newGrid[y][x].originY = undefined;
          }
        }

        playDestructionSound();
        // Horizontal shake on deletion (eraser drag / bulk delete path)
        phaserGameRef.current?.shakeScreen("x", 0.6, 150);
        return newGrid;
      });
    },
    []
  );

  // Handle eraser drag with confirmation modal
  const handleEraserDrag = useCallback(
    (tiles: Array<{ x: number; y: number }>) => {
      if (tiles.length === 0) return;

      // Count unique items that would be deleted
      const itemsToDelete = new Set<string>();
      const processedOrigins = new Set<string>();

      for (const { x, y } of tiles) {
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;

        const cell = grid[y]?.[x];
        if (!cell || cell.type === TileType.Grass) continue;

        const originX = cell.originX ?? x;
        const originY = cell.originY ?? y;
        const originKey = `${originX},${originY}`;

        if (processedOrigins.has(originKey)) continue;
        processedOrigins.add(originKey);

        if (cell.type === TileType.Building && cell.buildingId) {
          const building = getBuilding(cell.buildingId);
          itemsToDelete.add(
            `building:${originKey}:${building?.name || "Building"}`
          );
        } else if (
          cell.type === TileType.Road ||
          cell.type === TileType.Asphalt
        ) {
          const isRoadSegment = hasRoadSegment(grid, originX, originY);
          if (isRoadSegment) {
            itemsToDelete.add(`road:${originKey}`);
          } else {
            itemsToDelete.add(`tile:${x},${y}`);
          }
        } else {
          itemsToDelete.add(`tile:${x},${y}`);
        }
      }

      if (itemsToDelete.size === 0) return;

      // Show confirmation modal for multiple items
      if (itemsToDelete.size > 1) {
        // Store tiles for deletion after confirmation
        const tilesToDelete = [...tiles];
        setModalState({
          isVisible: true,
          title: "Confirm Deletion",
          message: `Are you sure you want to delete ${itemsToDelete.size} items?`,
          showCancel: true,
          onConfirm: () => performDeletion(tilesToDelete),
        });
        return;
      }

      // Single item - delete immediately without confirmation
      performDeletion(tiles);
    },
    [grid, performDeletion]
  );

  // Spawn handlers (delegate to Phaser)
  const handleSpawnCharacter = useCallback(() => {
    if (phaserGameRef.current) {
      const success = phaserGameRef.current.spawnCharacter();
      if (!success) {
        setModalState({
          isVisible: true,
          title: "Cannot Spawn Character",
          message: "Please place some roads first!",
        });
      }
    }
  }, []);

  const handleSpawnCar = useCallback(() => {
    if (phaserGameRef.current) {
      const success = phaserGameRef.current.spawnCar();
      if (!success) {
        setModalState({
          isVisible: true,
          title: "Cannot Spawn Car",
          message: "Please place some roads with asphalt first!",
        });
      }
    }
  }, []);

  // Office Simulator: Employee Management Functions
  const handleHireEmployee = useCallback(() => {
    // Find an available desk
    const availableDesk = findAvailableDesk(grid);

    if (!availableDesk) {
      setModalState({
        isVisible: true,
        title: "No Available Desks",
        message: "Purchase desks before hiring employees. Each employee needs a workspace!",
        showCancel: false,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isVisible: false }));
        },
      });
      return;
    }

    // Check if can afford hiring cost (represented as first month's salary)
    const hiringCost = 5000;
    if (economy.cash < hiringCost) {
      setModalState({
        isVisible: true,
        title: "Insufficient Funds",
        message: `Not enough cash to hire employee. Cost: $${hiringCost.toLocaleString()}, Available: $${economy.cash.toLocaleString()}`,
        showCancel: false,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isVisible: false }));
        },
      });
      return;
    }

    // Generate new employee and assign to the desk
    const newEmployee = generateEmployee(5000);
    newEmployee.assignedDeskId = `${availableDesk.x},${availableDesk.y}`;

    // Spawn employee character at the desk
    if (phaserGameRef.current) {
      const characterId = phaserGameRef.current.spawnEmployeeCharacter(
        newEmployee.id,
        availableDesk.x,
        availableDesk.y
      );
      newEmployee.characterId = characterId;
    }

    // Mark the desk as assigned in the grid
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
      newGrid[availableDesk.y][availableDesk.x] = {
        ...newGrid[availableDesk.y][availableDesk.x],
        assignedEmployeeId: newEmployee.id,
      };
      return newGrid;
    });

    setEmployees((prev) => [...prev, newEmployee]);

    // Deduct hiring cost
    setEconomy((prev) => ({
      ...prev,
      cash: prev.cash - hiringCost,
    }));

    playDoubleClickSound();
  }, [grid, economy.cash]);

  const handleFireEmployee = useCallback((employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;

    // Clear desk assignment if employee has one
    if (employee.assignedDeskId) {
      const [x, y] = employee.assignedDeskId.split(",").map(Number);
      setGrid((prev) => {
        const newGrid = prev.map((row) => row.map((cell) => ({ ...cell })));
        newGrid[y][x] = { ...newGrid[y][x], assignedEmployeeId: undefined };
        return newGrid;
      });
    }

    // Remove employee character from game
    if (employee.characterId && phaserGameRef.current) {
      phaserGameRef.current.removeEmployeeCharacter(employee.characterId);
    }

    // Deduct severance (1 month salary)
    setEconomy((prev) => ({
      ...prev,
      cash: prev.cash - employee.salary,
    }));

    // Remove employee
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));

    playDestructionSound();
  }, [employees]);

  const handleAssignEmployeeToDesk = useCallback(
    (employeeId: string, x: number, y: number) => {
      const cell = grid[y][x];

      // Check if it's a desk and unassigned
      if (cell.furnitureType !== "desk" || cell.assignedEmployeeId) {
        return;
      }

      // Update grid with employee assignment
      setGrid((prev) => {
        const newGrid = prev.map((row) => row.map((cell) => ({ ...cell })));
        newGrid[y][x] = { ...newGrid[y][x], assignedEmployeeId: employeeId };
        return newGrid;
      });

      // Update employee with desk assignment
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employeeId ? { ...e, assignedDeskId: `${x},${y}` } : e
        )
      );

      playClickSound();
    },
    [grid]
  );

  // Office Simulator: Client Management Functions
  const handleAcquireClient = useCallback(() => {
    const marketingCost = 1000;

    // Check if can afford marketing
    if (economy.cash < marketingCost) {
      setModalState({
        isVisible: true,
        title: "Insufficient Funds",
        message: `Not enough cash for marketing. Cost: $${marketingCost.toLocaleString()}, Available: $${economy.cash.toLocaleString()}`,
        showCancel: false,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isVisible: false }));
        },
      });
      return;
    }

    // Check if already at max clients
    if (clients.length >= 100) {
      setModalState({
        isVisible: true,
        title: "Maximum Clients Reached",
        message: "Congratulations! You've reached the maximum of 100 clients!",
        showCancel: false,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isVisible: false }));
        },
      });
      return;
    }

    // Acquire new client
    setEconomy((prev) => ({
      ...prev,
      cash: prev.cash - marketingCost,
    }));

    const newClient = generateClient();
    setClients((prev) => [...prev, newClient]);

    playDoubleClickSound();
  }, [economy.cash, clients.length]);

  // Save/Load functions
  interface GameSaveData {
    grid: GridCell[][];
    characterCount: number;
    carCount: number;
    zoom?: number;
    visualSettings?: VisualSettings;
    timestamp: number;
  }

  const handleSaveGame = useCallback(() => {
    const characterCount = phaserGameRef.current?.getCharacterCount() ?? 0;
    const carCount = phaserGameRef.current?.getCarCount() ?? 0;

    // Check if there are any existing saves
    const existingSaves: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("pogicity_save_")) {
        existingSaves.push(key.replace("pogicity_save_", ""));
      }
    }

    if (existingSaves.length === 0) {
      // First save - prompt for name
      setPromptState({
        isVisible: true,
        title: "Save Game",
        message: "Enter a name for this save:",
        defaultValue: "",
        onConfirm: (saveName: string) => {
          const saveData: GameSaveData = {
            grid,
            characterCount,
            carCount,
            zoom,
            visualSettings,
            timestamp: Date.now(),
          };

          try {
            localStorage.setItem(
              `pogicity_save_${saveName}`,
              JSON.stringify(saveData)
            );
            setModalState({
              isVisible: true,
              title: "Game Saved",
              message: `Game saved as "${saveName}"!`,
            });
            playDoubleClickSound();
          } catch (error) {
            setModalState({
              isVisible: true,
              title: "Save Failed",
              message: "Failed to save game!",
            });
            console.error("Save error:", error);
          }
        },
      });
    } else {
      // Use default name or prompt
      const defaultName = `Save ${existingSaves.length + 1}`;
      setPromptState({
        isVisible: true,
        title: "Save Game",
        message: `Enter a name for this save:\n(Leave empty for "${defaultName}")`,
        defaultValue: defaultName,
        onConfirm: (saveName: string) => {
          const finalName =
            saveName.trim() === "" ? defaultName : saveName.trim();
          const saveData: GameSaveData = {
            grid,
            characterCount,
            carCount,
            zoom,
            visualSettings,
            timestamp: Date.now(),
          };

          try {
            localStorage.setItem(
              `pogicity_save_${finalName}`,
              JSON.stringify(saveData)
            );
            setModalState({
              isVisible: true,
              title: "Game Saved",
              message: `Game saved as "${finalName}"!`,
            });
            playDoubleClickSound();
          } catch (error) {
            setModalState({
              isVisible: true,
              title: "Save Failed",
              message: "Failed to save game!",
            });
            console.error("Save error:", error);
          }
        },
      });
    }
  }, [grid, zoom, visualSettings]);

  const handleLoadGame = useCallback((saveData: GameSaveData) => {
    try {
      // Restore grid
      setGrid(saveData.grid);

      // Clear existing characters and cars
      phaserGameRef.current?.clearCharacters();
      phaserGameRef.current?.clearCars();

      // Restore UI state
      if (saveData.zoom !== undefined) {
        setZoom(saveData.zoom);
      }
      if (saveData.visualSettings) {
        setVisualSettings(saveData.visualSettings);
      }

      // Wait for grid to update, then spawn characters and cars
      setTimeout(() => {
        for (let i = 0; i < (saveData.characterCount ?? 0); i++) {
          phaserGameRef.current?.spawnCharacter();
        }
        for (let i = 0; i < (saveData.carCount ?? 0); i++) {
          phaserGameRef.current?.spawnCar();
        }
      }, 100);

      setModalState({
        isVisible: true,
        title: "Game Loaded",
        message: "Game loaded successfully!",
      });
      playDoubleClickSound();
    } catch (error) {
      setModalState({
        isVisible: true,
        title: "Load Failed",
        message: "Failed to load game!",
      });
      console.error("Load error:", error);
    }
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    scrollAccumulatorRef.current = 0; // Reset accumulator when using buttons
    setZoom((prev) => {
      const currentIndex = ZOOM_LEVELS.indexOf(prev);
      if (currentIndex === -1) {
        // If current zoom doesn't match exactly, find closest and go up
        const closestIndex = findClosestZoomIndex(prev);
        return ZOOM_LEVELS[Math.min(closestIndex + 1, ZOOM_LEVELS.length - 1)];
      }
      return ZOOM_LEVELS[Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1)];
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    scrollAccumulatorRef.current = 0; // Reset accumulator when using buttons
    setZoom((prev) => {
      const currentIndex = ZOOM_LEVELS.indexOf(prev);
      if (currentIndex === -1) {
        // If current zoom doesn't match exactly, find closest and go down
        const closestIndex = findClosestZoomIndex(prev);
        return ZOOM_LEVELS[Math.max(closestIndex - 1, 0)];
      }
      return ZOOM_LEVELS[Math.max(currentIndex - 1, 0)];
    });
  }, []);

  // Zoom is now handled directly in Phaser for correct pointer coordinates
  // This callback just syncs React state when Phaser emits a zoom change
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        background: "#4a5d6a",
      }}
    >
      {/* Top Left - Back and Zoom buttons */}
      <div
        className="top-button-bar"
        style={{
          position: "absolute",
          top: 0,
          left: 2, // Slight margin so border doesn't touch edge
          zIndex: 1000,
          display: "flex",
          gap: 0,
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Back to Menu button */}
        <button
          onClick={() => {
            if (onReturnToMenu) {
              onReturnToMenu();
            }
            playDoubleClickSound();
          }}
          title="Back to Menu"
          className="rct-blue-button-interactive"
          style={{
            background: "#6CA6E8",
            border: "2px solid",
            borderColor: "#A3CDF9 #366BA8 #366BA8 #A3CDF9",
            padding: "0 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 0,
            borderTop: "none",
            boxShadow: "1px 1px 0px #244B7A",
            transition: "filter 0.1s",
            height: 48,
            fontFamily: "monospace",
            fontSize: 20,
            fontWeight: "bold",
            color: "#000",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.1)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          onMouseDown={(e) => {
            e.currentTarget.style.filter = "brightness(0.9)";
            e.currentTarget.style.borderColor =
              "#366BA8 #A3CDF9 #A3CDF9 #366BA8";
            e.currentTarget.style.transform = "translate(1px, 1px)";
            e.currentTarget.style.boxShadow = "inset 1px 1px 0px #244B7A";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
            e.currentTarget.style.borderColor =
              "#A3CDF9 #366BA8 #366BA8 #A3CDF9";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "1px 1px 0px #244B7A";
          }}
        >
          ← MENU
        </button>
        <button
          onClick={() => {
            handleZoomOut();
            playDoubleClickSound();
          }}
          title="Zoom Out"
          className="rct-blue-button-interactive"
          style={{
            background: "#6CA6E8",
            border: "2px solid",
            borderColor: "#A3CDF9 #366BA8 #366BA8 #A3CDF9", // Light, Dark, Dark, Light
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 0, // No rounded corners
            borderTop: "none", // Remove top border to attach to edge
            boxShadow: "1px 1px 0px #244B7A",
            imageRendering: "pixelated",
            transition: "filter 0.1s",
            width: 48,
            height: 48,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.1)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          onMouseDown={(e) => {
            e.currentTarget.style.filter = "brightness(0.9)";
            e.currentTarget.style.borderColor =
              "#366BA8 #A3CDF9 #A3CDF9 #366BA8"; // Inverted
            e.currentTarget.style.transform = "translate(1px, 1px)";
            e.currentTarget.style.boxShadow = "inset 1px 1px 0px #244B7A";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
            e.currentTarget.style.borderColor =
              "#A3CDF9 #366BA8 #366BA8 #A3CDF9"; // Reset
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "1px 1px 0px #244B7A";
          }}
        >
          <img
            src="/UI/zoomout.png"
            alt="Zoom Out"
            style={{
              width: 48,
              height: 48,
              display: "block",
            }}
          />
        </button>
        <button
          onClick={() => {
            handleZoomIn();
            playDoubleClickSound();
          }}
          title="Zoom In"
          className="rct-blue-button-interactive"
          style={{
            background: "#6CA6E8",
            border: "2px solid",
            borderColor: "#A3CDF9 #366BA8 #366BA8 #A3CDF9", // Light, Dark, Dark, Light
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 0, // No rounded corners
            borderTop: "none", // Remove top border
            boxShadow: "1px 1px 0px #244B7A",
            imageRendering: "pixelated",
            transition: "filter 0.1s",
            width: 48,
            height: 48,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.1)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          onMouseDown={(e) => {
            e.currentTarget.style.filter = "brightness(0.9)";
            e.currentTarget.style.borderColor =
              "#366BA8 #A3CDF9 #A3CDF9 #366BA8"; // Inverted
            e.currentTarget.style.transform = "translate(1px, 1px)";
            e.currentTarget.style.boxShadow = "inset 1px 1px 0px #244B7A";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
            e.currentTarget.style.borderColor =
              "#A3CDF9 #366BA8 #366BA8 #A3CDF9"; // Reset
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "1px 1px 0px #244B7A";
          }}
        >
          <img
            src="/UI/zoomin.png"
            alt="Zoom In"
            style={{
              width: 48,
              height: 48,
              display: "block",
            }}
          />
        </button>
        {/* Tutorial button - Only show for Level 1 */}
        {levelId === "level_1" && (
          <button
            onClick={() => {
              setIsTutorialVisible(true);
              playOpenSound();
            }}
            title="Tutorial"
            className="rct-blue-button-interactive"
            style={{
              background: "#6CA6E8",
              border: "2px solid",
              borderColor: "#A3CDF9 #366BA8 #366BA8 #A3CDF9",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 0,
              borderTop: "none",
              boxShadow: "1px 1px 0px #244B7A",
              imageRendering: "pixelated",
              transition: "filter 0.1s",
              width: 48,
              height: 48,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = "brightness(1.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            onMouseDown={(e) => {
              e.currentTarget.style.filter = "brightness(0.9)";
              e.currentTarget.style.borderColor =
                "#366BA8 #A3CDF9 #A3CDF9 #366BA8";
              e.currentTarget.style.transform = "translate(1px, 1px)";
              e.currentTarget.style.boxShadow = "inset 1px 1px 0px #244B7A";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)";
              e.currentTarget.style.borderColor =
                "#A3CDF9 #366BA8 #366BA8 #A3CDF9";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "1px 1px 0px #244B7A";
            }}
          >
            <span
              style={{
                fontSize: 32,
                lineHeight: 1,
              }}
            >
              📚
            </span>
          </button>
        )}
      </div>

      {/* Top Right - Build and Eraser buttons */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 2,
          zIndex: 1000,
          display: "flex",
          gap: 0,
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            const willOpen = !isToolWindowVisible;
            setIsToolWindowVisible(willOpen);
            // Close destroy mode when opening build menu
            if (willOpen && selectedTool === ToolType.Eraser) {
              setSelectedTool(ToolType.None);
            }
            // Exit build mode when closing build menu
            if (!willOpen && selectedTool === ToolType.Building) {
              setSelectedTool(ToolType.None);
              setSelectedBuildingId(null);
            }
            if (willOpen) {
              playOpenSound();
            } else {
              playDoubleClickSound();
            }
          }}
          className={`rct-maroon-button-interactive ${isToolWindowVisible ? "active" : ""
            }`}
          title="Build Menu"
          style={{
            background: isToolWindowVisible ? "#4a1a1a" : "#6b2a2a",
            borderLeft: "2px solid",
            borderRight: "2px solid",
            borderBottom: "2px solid",
            borderTop: "none",
            borderLeftColor: isToolWindowVisible ? "#4a1a1a" : "#ab6a6a",
            borderRightColor: isToolWindowVisible ? "#ab6a6a" : "#4a1a1a",
            borderBottomColor: isToolWindowVisible ? "#ab6a6a" : "#4a1a1a",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 0,
            boxShadow: isToolWindowVisible
              ? "inset 1px 1px 0px #2a0a0a"
              : "1px 1px 0px #2a0a0a",
            imageRendering: "pixelated",
            transition: "filter 0.1s",
            transform: isToolWindowVisible ? "translate(1px, 1px)" : "none",
          }}
          onMouseEnter={(e) =>
            !isToolWindowVisible &&
            (e.currentTarget.style.filter = "brightness(1.1)")
          }
          onMouseLeave={(e) =>
            !isToolWindowVisible && (e.currentTarget.style.filter = "none")
          }
          onMouseDown={(e) => {
            if (isToolWindowVisible) return;
            e.currentTarget.style.filter = "brightness(0.9)";
            e.currentTarget.style.borderColor =
              "#4a1a1a #ab6a6a #ab6a6a #4a1a1a";
            e.currentTarget.style.transform = "translate(1px, 1px)";
            e.currentTarget.style.boxShadow = "inset 1px 1px 0px #2a0a0a";
          }}
          onMouseUp={(e) => {
            if (isToolWindowVisible) return;
            e.currentTarget.style.filter = "brightness(1.1)";
            e.currentTarget.style.borderColor =
              "#ab6a6a #4a1a1a #4a1a1a #ab6a6a";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "1px 1px 0px #2a0a0a";
          }}
        >
          <img
            src="/UI/build.png"
            alt="Build"
            style={{
              width: 48,
              height: 48,
              display: "block",
            }}
          />
        </button>
        <button
          onClick={() => {
            // Close build menu when activating destroy mode
            if (isToolWindowVisible) {
              setIsToolWindowVisible(false);
            }
            if (selectedTool === ToolType.Eraser) {
              setSelectedTool(ToolType.None);
            } else {
              setSelectedTool(ToolType.Eraser);
            }
            playDoubleClickSound();
          }}
          className={`rct-maroon-button-interactive ${selectedTool === ToolType.Eraser ? "active" : ""
            }`}
          title="Eraser (Esc to deselect)"
          style={{
            background:
              selectedTool === ToolType.Eraser ? "#4a1a1a" : "#6b2a2a",
            border: "2px solid",
            borderColor:
              selectedTool === ToolType.Eraser
                ? "#4a1a1a #ab6a6a #ab6a6a #4a1a1a"
                : "#ab6a6a #4a1a1a #4a1a1a #ab6a6a",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 0,
            borderTop: "none",
            boxShadow:
              selectedTool === ToolType.Eraser
                ? "inset 1px 1px 0px #2a0a0a"
                : "1px 1px 0px #2a0a0a",
            imageRendering: "pixelated",
            transition: "filter 0.1s",
            transform:
              selectedTool === ToolType.Eraser ? "translate(1px, 1px)" : "none",
          }}
          onMouseEnter={(e) =>
            selectedTool !== ToolType.Eraser &&
            (e.currentTarget.style.filter = "brightness(1.1)")
          }
          onMouseLeave={(e) =>
            selectedTool !== ToolType.Eraser &&
            (e.currentTarget.style.filter = "none")
          }
          onMouseDown={(e) => {
            if (selectedTool === ToolType.Eraser) return;
            e.currentTarget.style.filter = "brightness(0.9)";
            e.currentTarget.style.borderColor =
              "#4a1a1a #ab6a6a #ab6a6a #4a1a1a";
            e.currentTarget.style.transform = "translate(1px, 1px)";
            e.currentTarget.style.boxShadow = "inset 1px 1px 0px #2a0a0a";
          }}
          onMouseUp={(e) => {
            if (selectedTool === ToolType.Eraser) return;
            e.currentTarget.style.filter = "brightness(1.1)";
            e.currentTarget.style.borderColor =
              "#ab6a6a #4a1a1a #4a1a1a #ab6a6a";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "1px 1px 0px #2a0a0a";
          }}
        >
          <img
            src="/UI/bulldozer.png"
            alt="Bulldozer"
            style={{
              width: 48,
              height: 48,
              display: "block",
            }}
          />
        </button>
      </div>

      {/* Bottom right - Music player */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          zIndex: 1000,
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        <MusicPlayer />
      </div>

      {/* Main game area */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Map container - Phaser canvas */}
        <div
          ref={mapContainerRef}
          style={{
            position: "relative",
            overflow: "auto",
            maxWidth: "100%",
            maxHeight: "100%",
            borderRadius: 0,
            width: "100%",
            height: "100%",
            filter: `
              hue-rotate(${visualSettings.blueness}deg)
              contrast(${visualSettings.contrast})
              saturate(${visualSettings.saturation})
              brightness(${visualSettings.brightness})
            `,
          }}
        >
          <PhaserGame
            ref={phaserGameRef}
            grid={grid}
            selectedTool={selectedTool}
            selectedBuildingId={selectedBuildingId}
            buildingOrientation={buildingOrientation}
            zoom={zoom}
            onTileClick={handleTileClick}
            onTilesDrag={handleTilesDrag}
            onEraserDrag={handleEraserDrag}
            onRoadDrag={handleRoadDrag}
            onZoomChange={handleZoomChange}
            showPaths={debugPaths}
            showStats={showStats}
          />
        </div>

        {/* Dashboard (Office Simulator) */}
        <Dashboard
          economy={economy}
          employees={employees}
          clients={clients}
          goals={getLevel(levelId)?.goals || { employees: 50, clients: 100 }}
          onAdvanceMonth={handleAdvanceMonth}
        />

        {/* Floating tool window */}
        <ToolWindow
          selectedTool={selectedTool}
          selectedBuildingId={selectedBuildingId}
          onToolSelect={setSelectedTool}
          onBuildingSelect={(id) => {
            setSelectedBuildingId(id);
            setSelectedTool(ToolType.Building);
          }}
          onSpawnCharacter={handleSpawnCharacter}
          onSpawnCar={handleSpawnCar}
          onRotate={() => {
            if (selectedTool === ToolType.Building && selectedBuildingId) {
              const building = getBuilding(selectedBuildingId);
              if (building?.supportsRotation) {
                setBuildingOrientation((prev) => {
                  switch (prev) {
                    case Direction.Down:
                      return Direction.Right;
                    case Direction.Right:
                      return Direction.Up;
                    case Direction.Up:
                      return Direction.Left;
                    case Direction.Left:
                      return Direction.Down;
                    default:
                      return Direction.Down;
                  }
                });
              }
            }
          }}
          isVisible={isToolWindowVisible}
          onClose={() => {
            setIsToolWindowVisible(false);
            // Turn off build mode when closing build menu
            if (selectedTool === ToolType.Building) {
              setSelectedTool(ToolType.None);
              setSelectedBuildingId(null);
            }
          }}
          mode="office"
          onHireEmployee={handleHireEmployee}
        />

        {/* Bottom Management Bar - Always visible */}
        <BottomManagementBar
          employees={employees}
          clients={clients}
          economy={economy}
          maxEmployees={getLevel(levelId)?.goals.employees || 50}
          maxClients={getLevel(levelId)?.goals.clients || 100}
          onHireEmployee={handleHireEmployee}
          onFireEmployee={handleFireEmployee}
          onAcquireClient={handleAcquireClient}
        />

        {/* Load window */}
        <LoadWindow
          isVisible={isLoadWindowVisible}
          onClose={() => setIsLoadWindowVisible(false)}
          onLoad={handleLoadGame}
        />

        {/* Modal */}
        <Modal
          isVisible={modalState.isVisible}
          title={modalState.title}
          message={modalState.message}
          showCancel={modalState.showCancel}
          onConfirm={modalState.onConfirm ?? undefined}
          onClose={() =>
            setModalState({ ...modalState, isVisible: false, onConfirm: null })
          }
        />

        {/* Prompt Modal */}
        <PromptModal
          isVisible={promptState.isVisible}
          title={promptState.title}
          message={promptState.message}
          defaultValue={promptState.defaultValue}
          onClose={() => setPromptState({ ...promptState, isVisible: false })}
          onConfirm={(value) => {
            if (promptState.onConfirm) {
              promptState.onConfirm(value);
            }
            setPromptState({ ...promptState, isVisible: false });
          }}
        />

        {/* Tutorial Modal - Only for Level 1 first-time players */}
        <TutorialModal
          isVisible={isTutorialVisible}
          onComplete={() => {
            localStorage.setItem("hasSeenTutorial", "true");
            setIsTutorialVisible(false);
            // Reset the monthly timer to start fresh after tutorial
            setEconomy((prev) => ({
              ...prev,
              lastMonthTick: Date.now(),
            }));
            playDoubleClickSound();
          }}
          onSkip={() => {
            localStorage.setItem("hasSeenTutorial", "true");
            setIsTutorialVisible(false);
            // Reset the monthly timer to start fresh after tutorial
            setEconomy((prev) => ({
              ...prev,
              lastMonthTick: Date.now(),
            }));
            playClickSound();
          }}
        />

        {/* Mobile Warning Banner */}
        {isMobile && !mobileWarningDismissed && (
          <div
            style={{
              position: "absolute",
              bottom: 100,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2000,
              background: "rgba(0, 0, 0, 0.95)",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 0,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 14,
              maxWidth: "90%",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <span>
              📱 Best experienced on desktop — mobile may be a bit janky!
            </span>
            <button
              onClick={() => setMobileWarningDismissed(true)}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
