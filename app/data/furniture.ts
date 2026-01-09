// Furniture Registry - Single source of truth for all office furniture
// Adding new furniture = just add an entry here!

import { FurnitureType } from "../components/game/types";

export type FurnitureCategory = "desks" | "meeting_rooms" | "amenities" | "decor";

export interface FurnitureDefinition {
  id: string;
  name: string;
  category: FurnitureCategory;
  furnitureType: FurnitureType;
  footprint: { width: number; height: number };
  // For furniture where rotation changes the footprint (e.g., 1x2 becomes 2x1)
  footprintByOrientation?: {
    south?: { width: number; height: number };
    north?: { width: number; height: number };
    east?: { width: number; height: number };
    west?: { width: number; height: number };
  };
  sprites: {
    south: string;
    west?: string;
    north?: string;
    east?: string;
  };
  icon: string; // Emoji for UI
  cost: number; // One-time purchase cost
  supportsRotation?: boolean;
  capacity?: number; // For meeting rooms
}

// Helper to get the correct footprint for furniture based on orientation
export function getFurnitureFootprint(
  furniture: FurnitureDefinition,
  orientation?: string
): { width: number; height: number } {
  if (!furniture.footprintByOrientation || !orientation) {
    return furniture.footprint;
  }

  const dirMap: Record<string, "south" | "north" | "east" | "west"> = {
    down: "south",
    up: "north",
    right: "east",
    left: "west",
  };

  const dir = dirMap[orientation];
  if (!dir) {
    return furniture.footprint;
  }
  return furniture.footprintByOrientation[dir] || furniture.footprint;
}

// All furniture defined in one place
export const FURNITURE: Record<string, FurnitureDefinition> = {
  // DESKS
  "basic-desk": {
    id: "basic-desk",
    name: "Basic Desk",
    category: "desks",
    furnitureType: FurnitureType.Desk,
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Furniture/basic_desk.png",
    },
    icon: "💼",
    cost: 500,
  },
  "premium-desk": {
    id: "premium-desk",
    name: "Premium Desk",
    category: "desks",
    furnitureType: FurnitureType.Desk,
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Furniture/premium_desk.png",
    },
    icon: "🖥️",
    cost: 1000,
  },
  "executive-desk": {
    id: "executive-desk",
    name: "Executive Desk",
    category: "desks",
    furnitureType: FurnitureType.Desk,
    footprint: { width: 2, height: 1 },
    sprites: {
      south: "/Furniture/Executive_desk.png",
    },
    icon: "🪑",
    cost: 2000,
  },
  "standing-desk": {
    id: "standing-desk",
    name: "Standing Desk",
    category: "desks",
    furnitureType: FurnitureType.Desk,
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Furniture/standup_desk.png",
    },
    icon: "🧍",
    cost: 1500,
  },

  // MEETING ROOMS
  "small-meeting": {
    id: "small-meeting",
    name: "Small Meeting Room",
    category: "meeting_rooms",
    furnitureType: FurnitureType.MeetingRoom,
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Furniture/small_meeting_room.png",
    },
    icon: "🗣️",
    cost: 2000,
    capacity: 4,
  },
  "large-meeting": {
    id: "large-meeting",
    name: "Large Meeting Room",
    category: "meeting_rooms",
    furnitureType: FurnitureType.MeetingRoom,
    footprint: { width: 3, height: 3 },
    sprites: {
      south: "/Furniture/large_meeting_room.png",
    },
    icon: "🎯",
    cost: 5000,
    capacity: 10,
  },
  "conference-room": {
    id: "conference-room",
    name: "Conference Room",
    category: "meeting_rooms",
    furnitureType: FurnitureType.MeetingRoom,
    footprint: { width: 4, height: 3 },
    sprites: {
      south: "/Furniture/conference_room.png",
    },
    icon: "📊",
    cost: 8000,
    capacity: 20,
  },

  // AMENITIES
  "coffee-station": {
    id: "coffee-station",
    name: "Coffee Station",
    category: "amenities",
    furnitureType: FurnitureType.BreakArea,
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Furniture/coffee_station.png",
    },
    icon: "☕",
    cost: 800,
  },
  "break-table": {
    id: "break-table",
    name: "Break Table",
    category: "amenities",
    furnitureType: FurnitureType.BreakArea,
    footprint: { width: 2, height: 2 },
    sprites: {
      south: "/Furniture/break_table.png",
    },
    icon: "🍽️",
    cost: 1200,
  },
  "water-cooler": {
    id: "water-cooler",
    name: "Water Cooler",
    category: "amenities",
    furnitureType: FurnitureType.BreakArea,
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Furniture/water_cooler.png",
    },
    icon: "🚰",
    cost: 400,
  },

  // DECOR
  "office-plant": {
    id: "office-plant",
    name: "Office Plant",
    category: "decor",
    furnitureType: FurnitureType.Desk, // Decor doesn't need assignment
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Furniture/1x1plant.png",
    },
    icon: "🪴",
    cost: 200,
  },
  "bookshelf": {
    id: "bookshelf",
    name: "Bookshelf",
    category: "decor",
    furnitureType: FurnitureType.Desk, // Decor doesn't need assignment
    footprint: { width: 1, height: 2 },
    sprites: {
      south: "/Furniture/1x2bookshelf.png",
    },
    icon: "📚",
    cost: 400,
  },
  "filing-cabinet": {
    id: "filing-cabinet",
    name: "Filing Cabinet",
    category: "decor",
    furnitureType: FurnitureType.Desk, // Decor doesn't need assignment
    footprint: { width: 1, height: 1 },
    sprites: {
      south: "/Furniture/1x1filing_cabinet.png",
    },
    icon: "🗄️",
    cost: 300,
  },
  "reception-desk": {
    id: "reception-desk",
    name: "Reception Desk",
    category: "decor",
    furnitureType: FurnitureType.Reception,
    footprint: { width: 2, height: 1 },
    sprites: {
      south: "/Furniture/2x1reception.png",
    },
    icon: "🏢",
    cost: 1500,
  },
};

// Helper to get furniture by ID
export function getFurniture(id: string): FurnitureDefinition | undefined {
  return FURNITURE[id];
}

// Helper to get all furniture in a category
export function getFurnitureByCategory(
  category: FurnitureCategory
): FurnitureDefinition[] {
  return Object.values(FURNITURE).filter((f) => f.category === category);
}

// Helper to get all categories that have furniture (in display order)
const CATEGORY_ORDER: FurnitureCategory[] = [
  "desks",
  "meeting_rooms",
  "amenities",
  "decor",
];

export function getCategories(): FurnitureCategory[] {
  const usedCategories = new Set(
    Object.values(FURNITURE).map((f) => f.category)
  );
  return CATEGORY_ORDER.filter((cat) => usedCategories.has(cat));
}

// Category display names
export const CATEGORY_NAMES: Record<FurnitureCategory, string> = {
  desks: "Desks",
  meeting_rooms: "Meeting Rooms",
  amenities: "Amenities",
  decor: "Decor",
};
