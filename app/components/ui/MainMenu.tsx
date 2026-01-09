import { useState } from "react";
import Modal from "./Modal";
import { LEVELS } from "@/app/data/levels";

interface MainMenuProps {
    onStartGame: (levelId: string) => void;
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
    const [showAbout, setShowAbout] = useState(false);

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                position: "relative",
                backgroundImage: "url(/UI/menu_bg.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Title Card */}
            <div
                className="rct-panel"
                style={{
                    padding: "20px 40px",
                    marginBottom: 40,
                    boxShadow: "8px 8px 0px rgba(0,0,0,0.5)",
                    textAlign: "center",
                }}
            >
                <h1
                    style={{
                        fontSize: 64,
                        margin: 0,
                        textShadow: "4px 4px 0px #4a1a1a",
                        color: "#fff",
                        fontFamily: "var(--font-jersey), sans-serif",
                    }}
                >
                    OFFICE EMPIRE
                </h1>
                <div
                    style={{
                        fontSize: 24,
                        color: "#4a1a1a",
                        fontWeight: "bold",
                        marginTop: 8,
                    }}
                >
                    OFFICE SIMULATOR
                </div>
            </div>

            {/* Menu Buttons */}
            <div
                className="rct-panel"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    padding: 24,
                    boxShadow: "8px 8px 0px rgba(0,0,0,0.5)",
                    minWidth: 400,
                }}
            >
                <div style={{ textAlign: "center", marginBottom: 8, fontSize: 18, fontWeight: "bold" }}>
                    Select Level
                </div>

                {LEVELS.map((level) => (
                    <button
                        key={level.id}
                        className="rct-button"
                        onClick={() => onStartGame(level.id)}
                        style={{
                            fontSize: 20,
                            padding: "12px 24px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                        }}
                    >
                        <span>{level.name}</span>
                        <span style={{ fontSize: 14, opacity: 0.8, fontWeight: "normal" }}>
                            {level.description}
                        </span>
                    </button>
                ))}

                <div style={{ height: 16 }} />

                <button
                    className="rct-button"
                    onClick={() => setShowAbout(true)}
                    style={{
                        fontSize: 24,
                        padding: "12px 24px",
                        textAlign: "center",
                    }}
                >
                    About
                </button>
            </div>

            {/* About Modal */}
            <Modal
                isVisible={showAbout}
                title="About Office Empire"
                message={`Build and manage your own office empire!
        
        HOW TO PLAY:
        
        1. BUILD YOUR OFFICE
           Place desks ($500+) and amenities to create a workspace.
        
        2. HIRE EMPLOYEES
           Staff comes at a cost of $5,000/mo but is essential for growth.
           
        3. MANAGE CLIENTS
           Acquire clients to earn revenue ($2k-$5k/mo).
           ⚠️ maintain 1 employee per 3 clients to avoid high churn!
           
        4. GROW
           Reaching 5+ employees unlocks organic growth (passive client acquisition).`}
                onClose={() => setShowAbout(false)}
                showCancel={false}
            />

            <div style={{
                position: 'absolute',
                bottom: 10,
                color: 'white',
                textShadow: '1px 1px 0 #000',
                fontSize: 14,
                opacity: 0.8
            }}>
                v0.1.0 - Demo Build
            </div>
        </div>
    );
}
