// Dashboard Component - Displays economy and business stats
// Positioned at top-left corner of the screen

"use client";

import { useState, useEffect } from "react";
import { GameEconomy, Employee, Client } from "../game/types";

interface DashboardProps {
  economy: GameEconomy;
  employees: Employee[];
  clients: Client[];
  goals: {
    employees: number;
    clients: number;
  };
  onAdvanceMonth?: () => void;
}

export default function Dashboard({
  economy,
  employees,
  clients,
  goals,
  onAdvanceMonth,
}: DashboardProps) {
  const profitLoss = economy.monthlyRevenue - economy.monthlyExpenses;
  const isProfitable = profitLoss >= 0;

  // State for real-time countdown
  const [timeUntilNextMonth, setTimeUntilNextMonth] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, 30000 - (Date.now() - economy.lastMonthTick));
      setTimeUntilNextMonth(Math.round(remaining / 1000));
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [economy.lastMonthTick]);

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 10,
        backgroundColor: "#8B1538",
        border: "2px solid #000",
        borderRadius: 4,
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: 14,
        color: "#fff",
        minWidth: 280,
        maxWidth: "calc(100vw - 20px)",
        zIndex: 100,
        boxShadow: "4px 4px 0px rgba(0,0,0,0.3)",
      }}
      className="mobile-responsive-dashboard"
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: 8,
          fontSize: 16,
          borderBottom: "1px solid #fff",
          paddingBottom: 4,
          textAlign: "center",
        }}
      >
        💼 Consultancy Dashboard
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Cash */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>💰 Cash:</span>
          <span
            style={{
              fontWeight: "bold",
              color: economy.cash < 0 ? "#ff6b6b" : "#4ade80",
            }}
          >
            ${economy.cash.toLocaleString()}
          </span>
        </div>

        {/* Revenue */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>📈 Revenue:</span>
          <span style={{ color: "#4ade80" }}>
            ${economy.monthlyRevenue.toLocaleString()}/mo
          </span>
        </div>

        {/* Expenses */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>📉 Expenses:</span>
          <span style={{ color: "#ff6b6b" }}>
            ${economy.monthlyExpenses.toLocaleString()}/mo
          </span>
        </div>

        {/* Profit/Loss */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.3)",
            paddingTop: 6,
            marginTop: 2,
          }}
        >
          <span>💵 Profit:</span>
          <span
            style={{
              fontWeight: "bold",
              color: isProfitable ? "#4ade80" : "#ff6b6b",
            }}
          >
            {isProfitable ? "+" : ""}${profitLoss.toLocaleString()}/mo
          </span>
        </div>

        {/* Employees */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>👔 Employees:</span>
          <span style={{ fontWeight: "bold" }}>
            {employees.length}/{goals.employees}
          </span>
        </div>

        {/* Clients */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>🤝 Clients:</span>
          <span style={{ fontWeight: "bold" }}>
            {clients.length}/{goals.clients}
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: "1px solid rgba(255,255,255,0.3)",
          fontSize: 11,
          textAlign: "center",
          color: "rgba(255,255,255,0.7)",
        }}
      >
        Next month: {timeUntilNextMonth}s
      </div>

      {/* Advance Month Button */}
      {onAdvanceMonth && (
        <button
          onClick={onAdvanceMonth}
          style={{
            marginTop: 6,
            width: "100%",
            padding: "6px 12px",
            backgroundColor: "#6CA6E8",
            border: "2px solid",
            borderColor: "#A3CDF9 #366BA8 #366BA8 #A3CDF9",
            borderRadius: 2,
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: "bold",
            color: "#000",
            transition: "filter 0.1s",
            boxShadow: "1px 1px 0px #244B7A",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.1)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          onMouseDown={(e) => {
            e.currentTarget.style.filter = "brightness(0.9)";
            e.currentTarget.style.borderColor =
              "#366BA8 #A3CDF9 #A3CDF9 #366BA8";
            e.currentTarget.style.transform = "translate(1px, 1px)";
            e.currentTarget.style.boxShadow = "inset 1px 1px 0px #244B7A";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
            e.currentTarget.style.borderColor =
              "#A3CDF9 #366BA8 #366BA8 #A3CDF9";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "1px 1px 0px #244B7A";
          }}
        >
          ⏭ Go to Next Month
        </button>
      )}
    </div>
  );
}
