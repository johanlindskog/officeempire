// Dashboard Component - Displays economy and business stats
// Positioned at top-left corner of the screen

import { GameEconomy, Employee, Client } from "../game/types";

interface DashboardProps {
  economy: GameEconomy;
  employees: Employee[];
  clients: Client[];
  goals: {
    employees: number;
    clients: number;
  };
  onEmployeesClick: () => void;
  onClientsClick: () => void;
}

export default function Dashboard({
  economy,
  employees,
  clients,
  goals,
  onEmployeesClick,
  onClientsClick,
}: DashboardProps) {
  const profitLoss = economy.monthlyRevenue - economy.monthlyExpenses;
  const isProfitable = profitLoss >= 0;

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
        zIndex: 100,
        boxShadow: "4px 4px 0px rgba(0,0,0,0.3)",
      }}
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

        {/* Employees (clickable) */}
        <div
          onClick={onEmployeesClick}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            padding: "4px 6px",
            margin: "4px -6px 0",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 3,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
          }}
        >
          <span>👔 Employees:</span>
          <span style={{ fontWeight: "bold" }}>
            {employees.length}/{goals.employees}
          </span>
        </div>

        {/* Clients (clickable) */}
        <div
          onClick={onClientsClick}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            padding: "4px 6px",
            margin: "0 -6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 3,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
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
        Next month: {Math.round((30000 - (Date.now() - economy.lastMonthTick)) / 1000)}s
      </div>
    </div>
  );
}
