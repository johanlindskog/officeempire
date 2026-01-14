// Employee System Utilities
// Handles employee generation, naming, and skill assignment

import { Employee, EmployeeSkill } from "../components/game/types";

// Pool of employee names
const FIRST_NAMES = [
  "Alex", "Sam", "Jordan", "Morgan", "Casey", "Taylor", "Riley", "Jamie",
  "Avery", "Quinn", "Parker", "Reese", "Skyler", "Dakota", "Rowan", "Sage",
  "Kai", "River", "Finley", "Emerson", "Blake", "Cameron", "Drew", "Elliot",
  "Harley", "Jules", "Logan", "Marley", "Nico", "Phoenix", "Remy", "Sawyer",
  "Tatum", "Winter", "Arden", "Blair", "Charlie", "Devin", "Eden", "Frances",
  "Gray", "Hayden", "Indigo", "Jesse", "Kennedy", "Lane", "Micah", "Noel",
  "Oakley", "Payton", "Quincy", "Robin", "Sidney", "Terry", "Val", "Wren",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
  "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
];

// Track used names to avoid duplicates (resets on page reload)
const usedNames = new Set<string>();

/**
 * Generate a unique employee name
 */
function generateName(): string {
  let name: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    name = `${firstName} ${lastName}`;
    attempts++;

    // If we've tried too many times, allow duplicates
    if (attempts >= maxAttempts) {
      break;
    }
  } while (usedNames.has(name));

  usedNames.add(name);
  return name;
}

/**
 * Generate a unique ID for an employee
 */
function generateId(): string {
  return `emp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate random skill levels for an employee
 * Skills range from 0-100, with some natural variation
 */
function generateRandomSkills(): Record<EmployeeSkill, number> {
  // Generate one primary skill (70-90), and others as secondary (20-60)
  const skills = Object.values(EmployeeSkill);
  const primarySkillIndex = Math.floor(Math.random() * skills.length);

  const skillLevels: Record<EmployeeSkill, number> = {} as Record<EmployeeSkill, number>;

  skills.forEach((skill, index) => {
    if (index === primarySkillIndex) {
      // Primary skill: 70-90
      skillLevels[skill] = Math.floor(Math.random() * 21) + 70;
    } else {
      // Secondary skills: 20-60
      skillLevels[skill] = Math.floor(Math.random() * 41) + 20;
    }
  });

  return skillLevels;
}

/**
 * Generate a new employee with random skills
 * @param baseSalary Base monthly salary (default: $5,000)
 * @returns A new Employee object
 */
export function generateEmployee(baseSalary: number = 5000): Employee {
  return {
    id: generateId(),
    name: generateName(),
    skills: generateRandomSkills(),
    assignedDeskId: null,
    salary: baseSalary,
    hireDate: Date.now(),
    happiness: 75, // Start with decent happiness (75/100)
  };
}

/**
 * Calculate total monthly salary expenses
 * @param employees Array of employees
 * @returns Total monthly salary cost
 */
export function calculateMonthlySalaries(employees: Employee[]): number {
  return employees.reduce((sum, emp) => sum + emp.salary, 0);
}

/**
 * Get the number of available (unassigned) desks in the grid
 * @param grid The game grid
 * @returns Number of desks without assigned employees
 */
export function countAvailableDesks(grid: any[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.furnitureType === "desk" && !cell.assignedEmployeeId && cell.isOrigin) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Find the first available desk in the grid
 * @param grid The game grid
 * @returns Coordinates {x, y} of first available desk, or null if none
 */
export function findAvailableDesk(grid: any[][]): { x: number; y: number } | null {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      if (cell.furnitureType === "desk" && !cell.assignedEmployeeId && cell.isOrigin) {
        return { x, y };
      }
    }
  }
  return null;
}
