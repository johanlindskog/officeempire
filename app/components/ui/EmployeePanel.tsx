// Employee Panel Component - Manages hiring, firing, and viewing employees

"use client";

import { useState, useRef, useCallback, MouseEvent } from "react";
import { Employee, EmployeeSkill, GameEconomy } from "../game/types";
import { playClickSound, playDoubleClickSound } from "@/app/utils/sounds";

interface EmployeePanelProps {
  isVisible: boolean;
  employees: Employee[];
  economy: GameEconomy;
  maxEmployees: number;
  onClose: () => void;
  onHire: () => void;
  onFire: (employeeId: string) => void;
}

export default function EmployeePanel({
  isVisible,
  employees,
  economy,
  maxEmployees,
  onClose,
  onHire,
  onFire,
}: EmployeePanelProps) {
  const [position, setPosition] = useState({
    x: typeof window !== "undefined" ? window.innerWidth / 2 - 610 : 100,
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

  const handleHire = () => {
    onHire();
    playDoubleClickSound();
  };

  const handleFire = (employeeId: string) => {
    onFire(employeeId);
    playClickSound();
  };

  if (!isVisible) return null;

  const canAffordHiring = economy.cash >= 5000;
  const sortedEmployees = [...employees].sort((a, b) => b.hireDate - a.hireDate);

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
        <span>👔 Employee Management ({employees.length}/{maxEmployees})</span>
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
        {/* Employee List */}
        {employees.length === 0 ? (
          <div
            style={{
              color: "var(--rct-text-light)",
              textAlign: "center",
              padding: "20px",
              fontSize: 14,
            }}
          >
            No employees yet. Hire your first team member!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 14,
                        color: "var(--rct-text-light)",
                        marginBottom: 4,
                      }}
                    >
                      {emp.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--rct-text-dark)",
                        display: "flex",
                        gap: 12,
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
                      padding: "4px 12px",
                      fontSize: 12,
                      backgroundColor: "#dc2626",
                    }}
                  >
                    Fire
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Hire Button */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--rct-border)",
          }}
        >
          <button
            className="rct-button"
            onClick={handleHire}
            disabled={!canAffordHiring || employees.length >= maxEmployees}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: 14,
              fontWeight: "bold",
              backgroundColor: canAffordHiring ? "#16a34a" : "#6b7280",
              cursor: canAffordHiring ? "pointer" : "not-allowed",
            }}
          >
            {employees.length >= maxEmployees
              ? "Maximum Employees Reached"
              : `Hire New Employee ($5,000) ${!canAffordHiring ? "- Insufficient Funds" : ""}`}
          </button>

          {employees.length < 50 && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: "var(--rct-text-dark)",
                textAlign: "center",
              }}
            >
              Hiring cost: $5,000 | Monthly salary: $5,000 | Severance: 1 month
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
