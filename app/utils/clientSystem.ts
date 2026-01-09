// Client System Utilities
// Handles client generation, naming, and revenue calculations

import { Client } from "../components/game/types";

// Pool of company names for clients
const COMPANY_NAMES = [
  "TechCorp",
  "DataFlow Inc",
  "CloudSync Solutions",
  "NextGen Innovations",
  "Digital Dynamics",
  "Apex Analytics",
  "Quantum Computing Co",
  "Velocity Ventures",
  "Synergy Systems",
  "Frontier Technologies",
  "Catalyst Consulting",
  "Paradigm Partners",
  "Momentum Media",
  "Vertex Ventures",
  "Zenith Solutions",
  "Fusion Enterprises",
  "Horizon Holdings",
  "Pinnacle Partners",
  "Summit Strategies",
  "Eclipse Energy",
  "Nova Networks",
  "Stellar Software",
  "Infinity Innovations",
  "Cascade Capital",
  "Meridian Management",
  "Spectrum Services",
  "Titan Technologies",
  "Vanguard Ventures",
  "Quantum Solutions",
  "Nexus Networks",
  "Prestige Partners",
  "Benchmark Business",
  "Optimal Operations",
  "Strategic Systems",
  "Premier Professionals",
  "Global Growth Group",
  "Cornerstone Corp",
  "Keystone Capital",
  "Foundation Firms",
  "Bedrock Business",
  "Anchor Analytics",
  "Lighthouse Labs",
  "Beacon Brands",
  "Signal Solutions",
  "Pulse Partners",
  "Momentum Markets",
  "Velocity Vision",
  "Acceleration Associates",
  "Propel Partners",
  "Boost Business",
];

// Track used names to avoid duplicates (resets on page reload)
const usedNames = new Set<string>();

/**
 * Generate a unique company name
 */
function generateCompanyName(): string {
  // If all names are used, allow reuse
  if (usedNames.size >= COMPANY_NAMES.length) {
    usedNames.clear();
  }

  let name: string;
  do {
    name = COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)];
  } while (usedNames.has(name));

  usedNames.add(name);
  return name;
}

/**
 * Generate a unique ID for a client
 */
function generateId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a new client with random revenue
 * @returns A new Client object
 */
export function generateClient(): Client {
  return {
    id: generateId(),
    name: generateCompanyName(),
    monthlyRevenue: Math.floor(Math.random() * 3000) + 2000, // $2,000 - $5,000
    startDate: Date.now(),
  };
}

/**
 * Calculate total monthly revenue from all clients
 * @param clients Array of clients
 * @returns Total monthly revenue
 */
export function calculateMonthlyRevenue(clients: Client[]): number {
  return clients.reduce((sum, client) => sum + client.monthlyRevenue, 0);
}

/**
 * Apply client churn (random client loss)
 * @param clients Current client array
 * @param employeeCount Number of employees
 * @returns Filtered client array after churn
 */
export function applyClientChurn(
  clients: Client[],
  employeeCount: number
): Client[] {
  // Determine churn rate based on staffing
  // If understaffed (employees < clients/3), higher churn
  const isUnderstaffed = employeeCount < clients.length / 3;
  const churnRate = isUnderstaffed ? 0.2 : 0.05; // 20% vs 5%

  return clients.filter(() => Math.random() > churnRate);
}

/**
 * Check if passive client acquisition should occur
 * Happens when you have 5+ employees with 50% chance per month
 * @param employeeCount Number of employees
 * @returns True if a client should be auto-acquired
 */
export function shouldAcquirePassiveClient(employeeCount: number): boolean {
  if (employeeCount < 5) return false;
  return Math.random() < 0.5;
}
