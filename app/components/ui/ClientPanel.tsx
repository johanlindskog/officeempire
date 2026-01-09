// Client Panel Component - Manages client acquisition and viewing

"use client";

import { useState, useRef, useCallback, MouseEvent } from "react";
import { Client, GameEconomy } from "../game/types";
import { playDoubleClickSound } from "@/app/utils/sounds";

interface ClientPanelProps {
  isVisible: boolean;
  clients: Client[];
  economy: GameEconomy;
  maxClients: number;
  onClose: () => void;
  onAcquire: () => void;
}

export default function ClientPanel({
  isVisible,
  clients,
  economy,
  maxClients,
  onClose,
  onAcquire,
}: ClientPanelProps) {
  const [position, setPosition] = useState({
    x: typeof window !== "undefined" ? window.innerWidth / 2 + 10 : 100,
    y: typeof window !== "undefined" ? window.innerHeight / 2 - 250 : 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

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

  const handleAcquire = () => {
    onAcquire();
    playDoubleClickSound();
  };

  if (!isVisible) return null;

  const canAffordMarketing = economy.cash >= 1000;
  const sortedClients = [...clients].sort((a, b) => b.startDate - a.startDate);
  const totalRevenue = clients.reduce((sum, c) => sum + c.monthlyRevenue, 0);

  return (
    <div
      className="rct-frame"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: 600,
        maxHeight: 500,
        display: "flex",
        flexDirection: "column",
        zIndex: 3000,
        userSelect: "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Title bar */}
      <div className="rct-titlebar" onMouseDown={handleMouseDown}>
        <span>🤝 Client Management ({clients.length}/{maxClients})</span>
        <button className="rct-close" onClick={onClose}>
          ×
        </button>
      </div>

      {/* Content panel */}
      <div
        className="rct-panel"
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxHeight: 420,
          overflow: "auto",
        }}
      >
        {/* Revenue Summary */}
        <div
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            border: "1px solid var(--rct-border)",
            borderRadius: 4,
            padding: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: 14 }}>
            Total Monthly Revenue:
          </span>
          <span
            style={{
              fontWeight: "bold",
              fontSize: 16,
              color: "#4ade80",
            }}
          >
            ${totalRevenue.toLocaleString()}/mo
          </span>
        </div>

        {/* Client List */}
        {clients.length === 0 ? (
          <div
            style={{
              color: "var(--rct-text-light)",
              textAlign: "center",
              padding: "20px",
              fontSize: 14,
            }}
          >
            No clients yet. Acquire your first client!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sortedClients.map((client) => {
              const daysActive = Math.floor(
                (Date.now() - client.startDate) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={client.id}
                  style={{
                    backgroundColor: "rgba(139, 21, 56, 0.2)",
                    border: "1px solid var(--rct-border)",
                    borderRadius: 4,
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 13,
                        color: "var(--rct-text-light)",
                      }}
                    >
                      {client.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--rct-text-dark)",
                        marginTop: 2,
                      }}
                    >
                      Active: {daysActive} day{daysActive !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: 14,
                      color: "#4ade80",
                    }}
                  >
                    ${client.monthlyRevenue.toLocaleString()}/mo
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Acquire Button */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--rct-border)",
          }}
        >
          <button
            className="rct-button"
            onClick={handleAcquire}
            disabled={!canAffordMarketing || clients.length >= maxClients}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: 14,
              fontWeight: "bold",
              backgroundColor: canAffordMarketing ? "#16a34a" : "#6b7280",
              cursor: canAffordMarketing ? "pointer" : "not-allowed",
            }}
          >
            {clients.length >= maxClients
              ? "Maximum Clients Reached"
              : `Find New Client ($1,000) ${!canAffordMarketing ? "- Insufficient Funds" : ""}`}
          </button>

          {clients.length < maxClients && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "var(--rct-text-dark)",
                textAlign: "center",
              }}
            >
              Marketing cost: $1,000 | Monthly revenue: $2,000-$5,000 | Churn:
              5% (20% if understaffed)
            </div>
          )}

          {clients.length >= 5 && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "var(--rct-text-dark)",
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              💡 Tip: With 5+ employees, you'll passively acquire clients each
              month!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
