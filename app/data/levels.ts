export interface LevelConfig {
    id: string;
    name: string;
    description: string;
    goals: {
        employees: number;
        clients: number;
        happiness?: number; // Optional happiness goal (0-100)
    };
}

export const LEVELS: LevelConfig[] = [
    {
        id: "level_1",
        name: "Level 1: The Startup",
        description: "Welcome to your starter office! Expand your office to reach 10 employees and acquire 20 clients!",
        goals: {
            employees: 10,
            clients: 20,
        },
    },
    {
        id: "level_2",
        name: "Level 2: The Enterprise",
        description: "Scale your business to an empire! Reach 10 employees and 20 clients.",
        goals: {
            employees: 10,
            clients: 20,
        },
    },
    {
        id: "level_3",
        name: "Level 3: The Growing Firm",
        description: "Build a thriving workplace! Reach 20 employees, 40 clients, and maintain 65% average employee happiness. Keep your team happy with quality desks and nearby amenities like coffee machines and break areas!",
        goals: {
            employees: 20,
            clients: 40,
            happiness: 65,
        },
    },
];

export const getLevel = (id: string): LevelConfig | undefined => {
    return LEVELS.find((level) => level.id === id);
};
