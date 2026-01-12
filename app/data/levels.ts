export interface LevelConfig {
    id: string;
    name: string;
    description: string;
    goals: {
        employees: number;
        clients: number;
    };
}

export const LEVELS: LevelConfig[] = [
    {
        id: "level_1",
        name: "Level 1: The Startup",
        description: "Welcome to your starter office! You begin with 10 workstations (6 basic desks, 2 premium, 1 executive, 1 standing), a small meeting room, and a break area. Expand your office to reach 10 employees and acquire 20 clients!",
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
];

export const getLevel = (id: string): LevelConfig | undefined => {
    return LEVELS.find((level) => level.id === id);
};
