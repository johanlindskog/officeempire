"use client";

import { useState, useRef, useCallback, useEffect, MouseEvent } from "react";
import { ToolType } from "../game/types";
import {
  CATEGORY_NAMES as BUILDING_CATEGORY_NAMES,
  BuildingCategory,
  getBuildingsByCategory,
  getCategories as getBuildingCategories,
  getBuilding,
  BuildingDefinition,
} from "@/app/data/buildings";
import {
  CATEGORY_NAMES as FURNITURE_CATEGORY_NAMES,
  FurnitureCategory,
  getFurnitureByCategory,
  getCategories as getFurnitureCategories,
  getFurniture,
  FurnitureDefinition,
} from "@/app/data/furniture";
import { playDoubleClickSound, playClickSound } from "@/app/utils/sounds";

interface ToolWindowProps {
  selectedTool: ToolType;
  selectedBuildingId: string | null;
  onToolSelect: (tool: ToolType) => void;
  onBuildingSelect: (buildingId: string) => void;
  onSpawnCharacter: () => void;
  onSpawnCar: () => void;
  onRotate?: () => void;
  isVisible: boolean;
  onClose: () => void;
  mode?: "city" | "office"; // Switch between city builder and office simulator
  onHireEmployee?: () => void; // For office mode
}

// Get the preview sprite for a building (prefer south, fall back to first available)
function getBuildingPreviewSprite(building: BuildingDefinition): string {
  return building.sprites.south || Object.values(building.sprites)[0] || "";
}

// Get the preview sprite for furniture (prefer south, fall back to first available)
function getFurniturePreviewSprite(furniture: FurnitureDefinition): string {
  return furniture.sprites.south || Object.values(furniture.sprites)[0] || "";
}

// Calculate zoom level based on building footprint size
function getBuildingPreviewZoom(building: BuildingDefinition): number {
  const footprintSize = Math.max(
    building.footprint.width,
    building.footprint.height
  );
  if (footprintSize === 1) return 950;
  if (footprintSize === 2) return 500;
  const zoom = Math.max(150, 450 - footprintSize * 40);
  return zoom;
}

// Calculate zoom level for furniture
function getFurniturePreviewZoom(furniture: FurnitureDefinition): number {
  const footprintSize = Math.max(
    furniture.footprint.width,
    furniture.footprint.height
  );
  // Much smaller zoom values to show full furniture sprites
  if (footprintSize === 1) return 80;
  if (footprintSize === 2) return 100;
  if (footprintSize === 3) return 120;
  if (footprintSize === 4) return 140;
  const zoom = Math.max(60, 80 + footprintSize * 15);
  return zoom;
}

// Category icons for buildings
const BUILDING_CATEGORY_ICONS: Record<BuildingCategory, string> = {
  residential: "🏠",
  commercial: "🏪",
  props: "🌳",
  christmas: "🎄",
  civic: "🏛️",
  landmark: "🏰",
};

// Category icons for furniture
const FURNITURE_CATEGORY_ICONS: Record<FurnitureCategory, string> = {
  desks: "💼",
  meeting_rooms: "🗣️",
  amenities: "☕",
  decor: "🪴",
};

export default function ToolWindow({
  selectedTool,
  selectedBuildingId,
  onToolSelect,
  onBuildingSelect,
  onSpawnCharacter,
  onSpawnCar,
  onRotate,
  isVisible,
  onClose,
  mode = "office",
  onHireEmployee,
}: ToolWindowProps) {
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") {
      return { x: 10, y: 50 };
    }
    const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
    if (isMobile) {
      const menuWidth = Math.min(300, window.innerWidth - 20);
      return {
        x: Math.max(10, (window.innerWidth - menuWidth) / 2),
        y: 60,
      };
    } else {
      return {
        x: Math.max(10, window.innerWidth - 310),
        y: 50,
      };
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<{name: string; cost: number; x: number; y: number} | null>(null);

  const categories = mode === "office" ? getFurnitureCategories() : getBuildingCategories();
  const CATEGORY_NAMES = mode === "office" ? FURNITURE_CATEGORY_NAMES : BUILDING_CATEGORY_NAMES;
  const CATEGORY_ICONS = mode === "office" ? FURNITURE_CATEGORY_ICONS : BUILDING_CATEGORY_ICONS;

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Helper function to check if we're on mobile and should auto-close
  const autoCloseOnMobile = useCallback(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
      if (isMobile) {
        setTimeout(() => onClose(), 300); // Small delay for visual feedback
      }
    }
  }, [onClose]);

  if (!isVisible) return null;

  const baseWidth = 300;
  const responsiveWidth = Math.min(baseWidth, windowSize.width - 20);

  const getSelectedItemName = () => {
    if (hoveredBuilding) return hoveredBuilding;
    if (selectedBuildingId && selectedTool === ToolType.Building) {
      return mode === "office"
        ? getFurniture(selectedBuildingId)?.name
        : getBuilding(selectedBuildingId)?.name;
    }
    return "";
  };

  return (
    <div
      className="rct-frame"
      style={{
        position: "absolute",
        left: Math.min(position.x, windowSize.width - responsiveWidth - 10),
        top: position.y,
        width: responsiveWidth,
        maxHeight: Math.min(600, windowSize.height - 100),
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        userSelect: "none",
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Title bar */}
      <div className="rct-titlebar" onMouseDown={handleMouseDown} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{mode === "office" ? "Build" : "Buildings"}</span>
        <button
          className="rct-close"
          onClick={() => {
            onClose();
            playDoubleClickSound();
          }}
          style={{
            fontSize: 20,
            padding: "2px 8px",
            minWidth: 32,
            minHeight: 32,
          }}
        >
          ×
        </button>
      </div>

      {/* Content panel - scrollable with all categories expanded */}
      <div
        className="rct-panel"
        style={{
          padding: 0,
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
        }}
      >
        {/* All Categories Expanded */}
        {categories.map((category) => {
          const items = mode === "office"
            ? getFurnitureByCategory(category as FurnitureCategory)
            : getBuildingsByCategory(category as BuildingCategory);

          if (items.length === 0) return null;

          const categoryName = CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES];
          const categoryIcon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];

          return (
            <div key={category}>
              {/* Category Header */}
              <div
                style={{
                  padding: "8px 10px",
                  background: "var(--rct-frame-mid)",
                  borderBottom: "2px solid var(--rct-frame-dark)",
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "var(--rct-text-light)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  textShadow: "1px 1px 0 var(--rct-text-shadow)",
                }}
              >
                <span>{categoryIcon}</span>
                <span>{categoryName}</span>
              </div>

              {/* Category Items Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 4,
                  padding: 6,
                  background: "var(--rct-panel-mid)",
                }}
              >
                {items.map((item) => {
                  const previewSprite = mode === "office"
                    ? getFurniturePreviewSprite(item as FurnitureDefinition)
                    : getBuildingPreviewSprite(item as BuildingDefinition);
                  const previewZoom = mode === "office"
                    ? getFurniturePreviewZoom(item as FurnitureDefinition)
                    : getBuildingPreviewZoom(item as BuildingDefinition);
                  const isSelected =
                    selectedTool === ToolType.Building &&
                    selectedBuildingId === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (isSelected) {
                          // Deselect if clicking the same item
                          onToolSelect(ToolType.None);
                          onBuildingSelect("");
                        } else {
                          // Select the item
                          onToolSelect(ToolType.Building);
                          onBuildingSelect(item.id);
                          autoCloseOnMobile(); // Auto-close on mobile
                        }
                        playClickSound();
                      }}
                      onMouseEnter={(e) => {
                        setHoveredBuilding(item.name);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredItem({
                          name: item.name,
                          cost: 'cost' in item ? item.cost : 0,
                          x: rect.left + rect.width / 2,
                          y: rect.bottom + 10
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredBuilding(null);
                        setHoveredItem(null);
                      }}
                      className={`rct-button ${isSelected ? "active" : ""}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 4,
                        minHeight: 56,
                        overflow: "hidden",
                        background: isSelected
                          ? "var(--rct-button-active)"
                          : undefined,
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 46,
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <img
                          src={previewSprite}
                          alt={item.name}
                          style={{
                            width: `${previewZoom / 2}%`,
                            height: `${previewZoom / 2}%`,
                            objectFit: "cover",
                            objectPosition: "center bottom",
                            imageRendering: "pixelated",
                            transform: "scale(2)",
                            transformOrigin: "center bottom",
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Tools Section - at the bottom */}
        <div>
          {/* Tools Header */}
          <div
            style={{
              padding: "8px 10px",
              background: "var(--rct-frame-mid)",
              borderBottom: "2px solid var(--rct-frame-dark)",
              fontSize: 14,
              fontWeight: "bold",
              color: "var(--rct-text-light)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              textShadow: "1px 1px 0 var(--rct-text-shadow)",
            }}
          >
            <span>🔧</span>
            <span>Tools</span>
          </div>

          {/* Tools Content */}
          <div
            style={{
              padding: 6,
              background: "var(--rct-panel-mid)",
            }}
          >
            {/* Tiles Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 4,
                marginBottom: 8,
              }}
            >
              <button
                onClick={() => {
                  onToolSelect(ToolType.RoadNetwork);
                  autoCloseOnMobile();
                  playClickSound();
                }}
                className={`rct-button ${selectedTool === ToolType.RoadNetwork ? "active" : ""}`}
                title="Road"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                  minHeight: 56,
                }}
              >
                <img
                  src="/Tiles/1x1asphalt.png"
                  alt="Road"
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />
                <span style={{ fontSize: 10, marginTop: 2 }}>Road</span>
              </button>
              <button
                onClick={() => {
                  onToolSelect(ToolType.Asphalt);
                  autoCloseOnMobile();
                  playClickSound();
                }}
                className={`rct-button ${selectedTool === ToolType.Asphalt ? "active" : ""}`}
                title="Asphalt"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                  minHeight: 56,
                }}
              >
                <img
                  src="/Tiles/1x1asphalt_tile.png"
                  alt="Asphalt"
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />
                <span style={{ fontSize: 10, marginTop: 2 }}>Asphalt</span>
              </button>
              <button
                onClick={() => {
                  onToolSelect(ToolType.Tile);
                  autoCloseOnMobile();
                  playClickSound();
                }}
                className={`rct-button ${selectedTool === ToolType.Tile ? "active" : ""}`}
                title="Tile"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                  minHeight: 56,
                }}
              >
                <img
                  src="/Tiles/1x1square_tile.png"
                  alt="Tile"
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />
                <span style={{ fontSize: 10, marginTop: 2 }}>Tile</span>
              </button>
              <button
                onClick={() => {
                  onToolSelect(ToolType.Snow);
                  autoCloseOnMobile();
                  playClickSound();
                }}
                className={`rct-button ${selectedTool === ToolType.Snow ? "active" : ""}`}
                title="Snow"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                  minHeight: 56,
                }}
              >
                <img
                  src="/Tiles/1x1snow_tile_1.png"
                  alt="Snow"
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />
                <span style={{ fontSize: 10, marginTop: 2 }}>Snow</span>
              </button>
            </div>

            {/* Action buttons */}
            {mode === "office" ? (
              <button
                onClick={() => {
                  if (onHireEmployee) {
                    onHireEmployee();
                  }
                  playClickSound();
                }}
                className="rct-button"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: "bold",
                  backgroundColor: "#16a34a",
                }}
              >
                <span style={{ fontSize: 14 }}>👔</span>
                <span>Hire Employee ($5,000)</span>
              </button>
            ) : (
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => {
                    onSpawnCharacter();
                    playClickSound();
                  }}
                  className="rct-button"
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <span>🍌</span>
                  <span>Spawn Citizen</span>
                </button>
                <button
                  onClick={() => {
                    onSpawnCar();
                    playClickSound();
                  }}
                  className="rct-button"
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    fontSize: 12,
                  }}
                >
                  <span>🚗</span>
                  <span>Spawn Car</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - shows selected/hovered item name and rotate hint */}
      <div
        style={{
          padding: "6px 10px",
          background: "var(--rct-panel-mid)",
          borderTop: "2px solid var(--rct-panel-dark)",
          fontSize: 13,
          minHeight: 28,
          color: "var(--rct-text-light)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textShadow: "1px 1px 0 var(--rct-text-shadow)",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {getSelectedItemName() || "Select an item"}
        </span>
        {selectedTool === ToolType.Building && selectedBuildingId && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span style={{ opacity: 0.7, fontSize: 11 }}>
              &quot;R&quot; rotate
            </span>
            <button
              className="rct-button"
              onClick={() => {
                onRotate?.();
                playClickSound();
              }}
              style={{
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Rotate building"
            >
              <img
                src="/UI/r20x20rotate.png"
                alt="Rotate"
                style={{
                  width: 24,
                  height: 24,
                  imageRendering: "pixelated",
                }}
              />
            </button>
          </span>
        )}

        {/* Mobile helper text */}
        <div
          className="mobile-build-helper"
          style={{
            display: "none",
            padding: "8px 12px",
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            borderTop: "1px solid var(--rct-border)",
            fontSize: 12,
            color: "var(--rct-text-light)",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          💡 Tap an item to select. The menu will auto-close so you can place it on the map!
        </div>
      </div>

      {/* Tooltip for hovered item */}
      {hoveredItem && (
        <div
          style={{
            position: "fixed",
            left: hoveredItem.x,
            top: hoveredItem.y,
            transform: "translateX(-50%)",
            background: "rgba(0, 0, 0, 0.95)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: "bold",
            zIndex: 10000,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div style={{ marginBottom: 2 }}>{hoveredItem.name}</div>
          <div style={{ color: "#4ade80", fontSize: 11 }}>
            Cost: ${hoveredItem.cost.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
