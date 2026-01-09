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
        description: "Build your first office! Reach 10 employees and acquire 20 clients.",
        goals: {
            employees: 10,
            clients: 20,
        },
    },
    {
        id: "level_2",
        name: "Level 2: The Enterprise",
        description: "Scale your business to an empire! Reach 50 employees and 100 clients.",
        goals: {
            employees: 50,
            clients: 100,
        },
    },
];

export const getLevel = (id: string): LevelConfig | undefined => {
    return LEVELS.find((level) => level.id === id);
};
