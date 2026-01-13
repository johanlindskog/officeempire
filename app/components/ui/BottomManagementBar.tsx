// Bottom Management Bar - Persistent employee and client management panel

"use client";

import { useState } from "react";
import { Employee, Client, GameEconomy, EmployeeSkill } from "../game/types";
import { playClickSound, playDoubleClickSound } from "@/app/utils/sounds";

interface BottomManagementBarProps {
  employees: Employee[];
  clients: Client[];
  economy: GameEconomy;
  maxEmployees: number;
  maxClients: number;
  onHireEmployee: () => void;
  onFireEmployee: (employeeId: string) => void;
  onAcquireClient: () => void;
}

export default function BottomManagementBar({
  employees,
  clients,
  economy,
  maxEmployees,
  maxClients,
  onHireEmployee,
  onFireEmployee,
  onAcquireClient,
}: BottomManagementBarProps) {
  const canAffordHiring = economy.cash >= 5000;
  const canAffordMarketing = economy.cash >= 1000;
  const sortedEmployees = [...employees].sort((a, b) => b.hireDate - a.hireDate);
  const sortedClients = [...clients].sort((a, b) => b.startDate - a.startDate);
  const totalRevenue = clients.reduce((sum, c) => sum + c.monthlyRevenue, 0);

  // Mobile modal states - default both collapsed
  const [employeeExpanded, setEmployeeExpanded] = useState(true);
  const [clientExpanded, setClientExpanded] = useState(true);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  const handleFire = (employeeId: string) => {
    onFireEmployee(employeeId);
    playClickSound();
  };

  const handleHire = () => {
    onHireEmployee();
    playDoubleClickSound();
  };

  const handleAcquire = () => {
    onAcquireClient();
    playDoubleClickSound();
  };

  return (
    <>
      {/* Mobile Action Buttons - Only visible on mobile */}
      <div
        className="mobile-bottom-buttons"
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "8px",
          gap: "8px",
          backgroundColor: "var(--rct-frame-mid)",
          borderTop: "2px solid var(--rct-frame-dark)",
          zIndex: 2000,
        }}
      >
        <button
          onClick={() => setShowEmployeeModal(true)}
          className="rct-button"
          style={{
            flex: 1,
            padding: "16px",
            fontSize: 14,
            fontWeight: "bold",
            backgroundColor: "#8b1538",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 20 }}>👔</span>
          <span>Employees ({employees.length}/{maxEmployees})</span>
        </button>
        <button
          onClick={() => setShowClientModal(true)}
          className="rct-button"
          style={{
            flex: 1,
            padding: "16px",
            fontSize: 14,
            fontWeight: "bold",
            backgroundColor: "#8b1538",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 20 }}>🤝</span>
          <span>Clients ({clients.length}/{maxClients})</span>
        </button>
      </div>

      {/* Desktop Layout - Bottom Management Bar */}
      <div
        className="bottom-management-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 240,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          zIndex: 2000,
          userSelect: "none",
          pointerEvents: "auto",
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Panels container */}
        <div
          className="bottom-panels-container"
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
          }}
        >
      {/* EMPLOYEES PANEL - Left Half */}
      <div
        className="rct-frame"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--rct-frame-darker)",
        }}
      >
        {/* Employees Header */}
        <div
          className="rct-titlebar"
          style={{
            borderRadius: 0,
          }}
        >
          <span>👔 Employees ({employees.length}/{maxEmployees})</span>
        </div>

        {/* Employees Content */}
        {employeeExpanded && (
        <div
          className="rct-panel"
          style={{
            flex: 1,
            padding: "12px 16px",
            display: "flex",
            gap: 12,
            overflow: "hidden",
          }}
        >
          {/* Employee List - Scrollable */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              paddingRight: 8,
            }}
          >
            {employees.length === 0 ? (
              <div
                style={{
                  color: "var(--rct-text-light)",
                  textAlign: "center",
                  padding: "20px",
                  fontSize: 13,
                }}
              >
                No employees yet. Hire your first team member!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sortedEmployees.map((emp) => {
                  const primarySkill = (
                    Object.entries(emp.skills) as [EmployeeSkill, number][]
                  ).reduce((max, [skill, level]) =>
                    level > max[1] ? [skill, level] : max
                  );

                  return (
                    <div
                      key={emp.id}
                      style={{
                        backgroundColor: "rgba(139, 21, 56, 0.2)",
                        border: "1px solid var(--rct-border)",
                        borderRadius: 4,
                        padding: "6px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: 12,
                            color: "var(--rct-text-light)",
                            marginBottom: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {emp.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--rct-text-dark)",
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span>
                            💼 {primarySkill[0]}: {primarySkill[1]}
                          </span>
                          <span>💰 ${emp.salary.toLocaleString()}/mo</span>
                          <span>
                            {emp.assignedDeskId ? "✅ Assigned" : "⚠️ No Desk"}
                          </span>
                        </div>
                      </div>
                      <button
                        className="rct-button"
                        onClick={() => handleFire(emp.id)}
                        style={{
                          padding: "3px 8px",
                          fontSize: 11,
                          backgroundColor: "#dc2626",
                          flexShrink: 0,
                        }}
                      >
                        Fire
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Employee Actions - Fixed Width */}
          <div
            style={{
              width: 240,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              borderLeft: "1px solid var(--rct-border)",
              paddingLeft: 12,
            }}
          >
            <button
              className="rct-button"
              onClick={handleHire}
              disabled={!canAffordHiring || employees.length >= maxEmployees}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: 13,
                fontWeight: "bold",
                backgroundColor: canAffordHiring && employees.length < maxEmployees ? "#16a34a" : "#6b7280",
                cursor: canAffordHiring && employees.length < maxEmployees ? "pointer" : "not-allowed",
              }}
            >
              {employees.length >= maxEmployees
                ? "Max Employees"
                : `Hire ($5,000)`}
            </button>
            <div
              style={{
                fontSize: 10,
                color: "var(--rct-text-dark)",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              Cost: $5,000<br />
              Salary: $5,000/mo<br />
              Severance: 1 month
            </div>
          </div>
        </div>
        )}
      </div>

      {/* CLIENTS PANEL - Right Half */}
      <div
        className="rct-frame"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Clients Header */}
        <div
          className="rct-titlebar"
          style={{
            borderRadius: 0,
          }}
        >
          <span>🤝 Clients ({clients.length}/{maxClients})</span>
        </div>

        {/* Clients Content */}
        {clientExpanded && (
        <div
          className="rct-panel"
          style={{
            flex: 1,
            padding: "12px 16px",
            display: "flex",
            gap: 12,
            overflow: "hidden",
          }}
        >
          {/* Client List - Scrollable */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              paddingRight: 8,
            }}
          >
            {/* Revenue Summary */}
            <div
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.2)",
                border: "1px solid var(--rct-border)",
                borderRadius: 4,
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: 12 }}>
                Monthly Revenue:
              </span>
              <span
                style={{
                  fontWeight: "bold",
                  fontSize: 14,
                  color: "#4ade80",
                }}
              >
                ${totalRevenue.toLocaleString()}/mo
              </span>
            </div>

            {clients.length === 0 ? (
              <div
                style={{
                  color: "var(--rct-text-light)",
                  textAlign: "center",
                  padding: "20px",
                  fontSize: 13,
                }}
              >
                No clients yet. Acquire your first client!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                        padding: "6px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: 12,
                            color: "var(--rct-text-light)",
                          }}
                        >
                          {client.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
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
                          fontSize: 12,
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
          </div>

          {/* Client Actions - Fixed Width */}
          <div
            style={{
              width: 240,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              borderLeft: "1px solid var(--rct-border)",
              paddingLeft: 12,
            }}
          >
            <button
              className="rct-button"
              onClick={handleAcquire}
              disabled={!canAffordMarketing || clients.length >= maxClients}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: 13,
                fontWeight: "bold",
                backgroundColor: canAffordMarketing && clients.length < maxClients ? "#16a34a" : "#6b7280",
                cursor: canAffordMarketing && clients.length < maxClients ? "pointer" : "not-allowed",
              }}
            >
              {clients.length >= maxClients
                ? "Max Clients"
                : `Find Client ($1,000)`}
            </button>
            <div
              style={{
                fontSize: 10,
                color: "var(--rct-text-dark)",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              Cost: $1,000<br />
              Revenue: $2k-$5k/mo<br />
              Churn: 5% (20% low staff)
            </div>
            {employees.length >= 5 && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--rct-text-dark)",
                  textAlign: "center",
                  fontStyle: "italic",
                  marginTop: 4,
                }}
              >
                💡 5+ employees = passive client acquisition!
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      </div>
    </div>

    {/* Employee Modal - Mobile Only */}
    {showEmployeeModal && (
      <div
        className="mobile-modal-overlay"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 3000,
          padding: "8px",
          overflowY: "auto",
        }}
        onClick={() => setShowEmployeeModal(false)}
      >
        <div
          className="rct-frame"
          style={{
            maxWidth: "95%",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rct-titlebar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>👔 Employees ({employees.length}/{maxEmployees})</span>
            <button
              onClick={() => setShowEmployeeModal(false)}
              style={{
                background: "#dc2626",
                border: "1px solid #fff",
                borderRadius: 2,
                color: "#fff",
                padding: "4px 12px",
                fontSize: 14,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>
          <div className="rct-panel" style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
            {/* Employee List */}
            {employees.length === 0 ? (
              <div style={{ color: "var(--rct-text-light)", textAlign: "center", padding: "20px", fontSize: 14 }}>
                No employees yet. Hire your first team member!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sortedEmployees.map((emp) => {
                  const primarySkill = (Object.entries(emp.skills) as [EmployeeSkill, number][]).reduce((max, [skill, level]) =>
                    level > max[1] ? [skill, level] : max
                  );
                  return (
                    <div key={emp.id} style={{ backgroundColor: "rgba(139, 21, 56, 0.2)", border: "1px solid var(--rct-border)", borderRadius: 4, padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", fontSize: 14, color: "var(--rct-text-light)", marginBottom: 4 }}>{emp.name}</div>
                        <div style={{ fontSize: 12, color: "var(--rct-text-dark)", display: "flex", flexDirection: "column", gap: 2 }}>
                          <span>💼 {primarySkill[0]}: {primarySkill[1]}</span>
                          <span>💰 ${emp.salary.toLocaleString()}/mo</span>
                          <span>{emp.assignedDeskId ? "✅ Assigned" : "⚠️ No Desk"}</span>
                        </div>
                      </div>
                      <button className="rct-button" onClick={() => handleFire(emp.id)} style={{ padding: "8px 16px", fontSize: 12, backgroundColor: "#dc2626" }}>Fire</button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Hire Button */}
            <button
              className="rct-button"
              onClick={handleHire}
              disabled={!canAffordHiring || employees.length >= maxEmployees}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: 16,
                fontWeight: "bold",
                backgroundColor: canAffordHiring && employees.length < maxEmployees ? "#16a34a" : "#6b7280",
                cursor: canAffordHiring && employees.length < maxEmployees ? "pointer" : "not-allowed",
              }}
            >
              {employees.length >= maxEmployees ? "Max Employees" : `Hire ($5,000)`}
            </button>
            <div style={{ fontSize: 12, color: "var(--rct-text-dark)", textAlign: "center", lineHeight: 1.5 }}>
              Cost: $5,000<br />Salary: $5,000/mo<br />Severance: 1 month
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Client Modal - Mobile Only */}
    {showClientModal && (
      <div
        className="mobile-modal-overlay"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 3000,
          padding: "8px",
          overflowY: "auto",
        }}
        onClick={() => setShowClientModal(false)}
      >
        <div
          className="rct-frame"
          style={{
            maxWidth: "95%",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rct-titlebar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🤝 Clients ({clients.length}/{maxClients})</span>
            <button
              onClick={() => setShowClientModal(false)}
              style={{
                background: "#dc2626",
                border: "1px solid #fff",
                borderRadius: 2,
                color: "#fff",
                padding: "4px 12px",
                fontSize: 14,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>
          </div>
          <div className="rct-panel" style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
            {/* Revenue Summary */}
            <div style={{ backgroundColor: "rgba(34, 197, 94, 0.2)", border: "1px solid var(--rct-border)", borderRadius: 4, padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", fontSize: 14 }}>Monthly Revenue:</span>
              <span style={{ fontWeight: "bold", fontSize: 16, color: "#4ade80" }}>${totalRevenue.toLocaleString()}/mo</span>
            </div>
            {/* Client List */}
            {clients.length === 0 ? (
              <div style={{ color: "var(--rct-text-light)", textAlign: "center", padding: "20px", fontSize: 14 }}>
                No clients yet. Acquire your first client!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sortedClients.map((client) => {
                  const daysActive = Math.floor((Date.now() - client.startDate) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={client.id} style={{ backgroundColor: "rgba(139, 21, 56, 0.2)", border: "1px solid var(--rct-border)", borderRadius: 4, padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", fontSize: 14, color: "var(--rct-text-light)" }}>{client.name}</div>
                        <div style={{ fontSize: 12, color: "var(--rct-text-dark)", marginTop: 4 }}>Active: {daysActive} day{daysActive !== 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ fontWeight: "bold", fontSize: 14, color: "#4ade80" }}>${client.monthlyRevenue.toLocaleString()}/mo</div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Acquire Button */}
            <button
              className="rct-button"
              onClick={handleAcquire}
              disabled={!canAffordMarketing || clients.length >= maxClients}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: 16,
                fontWeight: "bold",
                backgroundColor: canAffordMarketing && clients.length < maxClients ? "#16a34a" : "#6b7280",
                cursor: canAffordMarketing && clients.length < maxClients ? "pointer" : "not-allowed",
              }}
            >
              {clients.length >= maxClients ? "Max Clients" : `Find Client ($1,000)`}
            </button>
            <div style={{ fontSize: 12, color: "var(--rct-text-dark)", textAlign: "center", lineHeight: 1.5 }}>
              Cost: $1,000<br />Revenue: $2k-$5k/mo<br />Churn: 5% (20% low staff)
            </div>
            {employees.length >= 5 && (
              <div style={{ fontSize: 12, color: "var(--rct-text-dark)", textAlign: "center", fontStyle: "italic" }}>
                💡 5+ employees = passive client acquisition!
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
