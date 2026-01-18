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
                padding: "20px",
                overflow: "auto",
            }}
        >
            {/* Title Card */}
            <div
                className="rct-panel"
                style={{
                    padding: "12px 24px",
                    marginBottom: 20,
                    boxShadow: "6px 6px 0px rgba(0,0,0,0.5)",
                    textAlign: "center",
                }}
            >
                <h1
                    style={{
                        fontSize: "clamp(32px, 8vw, 48px)",
                        margin: 0,
                        textShadow: "3px 3px 0px #4a1a1a",
                        color: "#fff",
                        fontFamily: "var(--font-jersey), sans-serif",
                    }}
                >
                    OFFICE EMPIRE
                </h1>
                <div
                    style={{
                        fontSize: "clamp(14px, 3vw, 18px)",
                        color: "#4a1a1a",
                        fontWeight: "bold",
                        marginTop: 4,
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
                    gap: 10,
                    padding: "16px",
                    boxShadow: "6px 6px 0px rgba(0,0,0,0.5)",
                    width: "100%",
                    maxWidth: "500px",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: 4, fontSize: 16, fontWeight: "bold" }}>
                    Select Level
                </div>

                {LEVELS.map((level) => (
                    <button
                        key={level.id}
                        className="rct-button"
                        onClick={() => onStartGame(level.id)}
                        style={{
                            fontSize: 16,
                            padding: "10px 16px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <span>{level.name}</span>
                        <span style={{ fontSize: 12, opacity: 0.8, fontWeight: "normal" }}>
                            {level.description}
                        </span>
                    </button>
                ))}

                <div style={{ height: 8 }} />

                <button
                    className="rct-button"
                    onClick={() => setShowAbout(true)}
                    style={{
                        fontSize: 18,
                        padding: "10px 16px",
                        textAlign: "center",
                    }}
                >
                    About
                </button>

                <button
                    className="rct-button"
                    onClick={() => window.open("https://officeempire.lovable.app/", "_blank")}
                    style={{
                        fontSize: 18,
                        padding: "10px 16px",
                        textAlign: "center",
                    }}
                >
                    Feedback
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
