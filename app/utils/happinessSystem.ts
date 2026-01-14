// Employee Happiness System
// Calculates and manages employee happiness based on office conditions

import { Employee, GridCell, GRID_WIDTH, GRID_HEIGHT } from "../components/game/types";

/**
 * Desk quality multipliers for happiness calculation
 */
const DESK_QUALITY_BONUS: Record<string, number> = {
  "desk-basic": 0,        // No bonus
  "desk-premium": 10,     // +10 happiness
  "desk-executive": 20,   // +20 happiness
  "desk-standing": 15,    // +15 happiness
};

/**
 * Building IDs that provide happiness bonuses when nearby
 */
const AMENITY_BUILDINGS: Record<string, { bonus: number; range: number }> = {
  "coffee-machine": { bonus: 10, range: 10 },      // +10 within 10 tiles
  "break-area": { bonus: 15, range: 15 },          // +15 within 15 tiles
  "meeting-room": { bonus: 8, range: 12 },         // +8 within 12 tiles
  "water-cooler": { bonus: 5, range: 8 },          // +5 within 8 tiles
  "plant": { bonus: 3, range: 5 },                 // +3 within 5 tiles
};

/**
 * Calculate distance between two grid positions
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Find all amenity buildings in the grid
 */
function findAmenities(grid: GridCell[][]): Array<{ x: number; y: number; buildingId: string }> {
  const amenities: Array<{ x: number; y: number; buildingId: string }> = [];

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      if (cell.isOrigin && cell.buildingId && AMENITY_BUILDINGS[cell.buildingId]) {
        amenities.push({ x, y, buildingId: cell.buildingId });
      }
    }
  }

  return amenities;
}

/**
 * Calculate happiness for a single employee based on their desk and nearby amenities
 * @param employee The employee to calculate happiness for
 * @param grid The game grid
 * @returns Happiness value (0-100)
 */
export function calculateEmployeeHappiness(employee: Employee, grid: GridCell[][]): number {
  if (!employee.assignedDeskId) {
    // No desk = very unhappy
    return 20;
  }

  // Parse desk coordinates
  const [deskX, deskY] = employee.assignedDeskId.split(",").map(Number);
  const deskCell = grid[deskY]?.[deskX];

  if (!deskCell) {
    return 20;
  }

  // Base happiness starts at 50
  let happiness = 50;

  // Add desk quality bonus
  if (deskCell.buildingId && DESK_QUALITY_BONUS[deskCell.buildingId] !== undefined) {
    happiness += DESK_QUALITY_BONUS[deskCell.buildingId];
  }

  // Find all amenities and calculate proximity bonuses
  const amenities = findAmenities(grid);
  const appliedBonuses = new Set<string>(); // Track which amenity types we've already counted

  for (const amenity of amenities) {
    const amenityConfig = AMENITY_BUILDINGS[amenity.buildingId];
    const distance = calculateDistance(deskX, deskY, amenity.x, amenity.y);

    // If within range and we haven't applied this amenity type yet
    if (distance <= amenityConfig.range && !appliedBonuses.has(amenity.buildingId)) {
      happiness += amenityConfig.bonus;
      appliedBonuses.add(amenity.buildingId);
    }
  }

  // Clamp happiness between 0 and 100
  return Math.max(0, Math.min(100, happiness));
}

/**
 * Calculate average happiness across all employees
 * @param employees Array of employees
 * @returns Average happiness (0-100), or 0 if no employees
 */
export function calculateAverageHappiness(employees: Employee[]): number {
  if (employees.length === 0) return 0;

  const totalHappiness = employees.reduce((sum, emp) => sum + emp.happiness, 0);
  return Math.round(totalHappiness / employees.length);
}

/**
 * Get happiness tier label and color
 * @param happiness Happiness value (0-100)
 * @returns Object with label and color
 */
export function getHappinessTier(happiness: number): { label: string; color: string; emoji: string } {
  if (happiness >= 80) {
    return { label: "Very Happy", color: "#22c55e", emoji: "😊" };
  } else if (happiness >= 60) {
    return { label: "Happy", color: "#84cc16", emoji: "🙂" };
  } else if (happiness >= 40) {
    return { label: "Neutral", color: "#eab308", emoji: "😐" };
  } else if (happiness >= 20) {
    return { label: "Unhappy", color: "#f97316", emoji: "😟" };
  } else {
    return { label: "Very Unhappy", color: "#ef4444", emoji: "😢" };
  }
}

/**
 * Calculate chance of employee quitting based on happiness
 * @param happiness Happiness value (0-100)
 * @returns Probability of quitting per month (0-1)
 */
export function calculateQuitProbability(happiness: number): number {
  if (happiness >= 60) return 0; // Happy employees don't quit
  if (happiness >= 40) return 0.05; // 5% chance per month
  if (happiness >= 20) return 0.15; // 15% chance per month
  return 0.30; // 30% chance per month for very unhappy
}

/**
 * Update all employee happiness values based on current grid state
 * @param employees Array of employees
 * @param grid The game grid
 * @returns Updated employees array with new happiness values
 */
export function updateAllEmployeeHappiness(
  employees: Employee[],
  grid: GridCell[][]
): Employee[] {
  return employees.map((emp) => ({
    ...emp,
    happiness: calculateEmployeeHappiness(emp, grid),
  }));
}
