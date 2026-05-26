import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";

const SENHA_CORRETA = "Rota182121Am!#";
const CATEGORIAS = ["Hotel", "Ingresso", "Transfer", "Cruzeiro", "Outro"];
const STORAGE_KEY = "radar_concorrentes_dados";

function formatBRL(value) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, dia] = d.split("-");
  return `${dia}/${m}/${y}`;
}

function MargemBadge({ margem }) {
  const color = margem < 10 ? "#4ade80" : margem < 20 ? "#facc15" : "#f87171";
  const label = margem < 10 ? "Baixa" : margem < 20 ? "Média" : "Alta";
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 1,
    }}>
      {label} · {Number(margem).toFixed(1)}%
    </span>
  );
}

const inputStyle = {
  background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8,
  padding: "10px 12px", color: "#e2e8f0", fontSize: 13,
  fontFamily: "'DM Mono','Courier New',monospace",
  outline: "none", width: "100%", boxSizing: "border-box",
};
const statBox = { background: "#0f172a", borderRadius: 8, padding: "10px 12px" };
const statLabel = { fontSize: 10, color: "#475569", letterSpacing: 1, marginBottom: 4 };
const statVal = { fontSize: 14, fontWeight: 700, color: "#f1f5f9" };

function Login({ onSuccess }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);

  function tentar() {
    if (senha === SENHA_CORRETA) {
      onSuccess();
    } else {
      setErro(true);
      setSenha("");
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0f1a",
      fontFamily: "'DM Mono','Courier New',monospace",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#111827", border: "1px solid #1e293b", borderRadius: 20,
        padding: "40px 28px", width: "100%", maxWidth: 340, textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🔐</div>
        <div style={{ fontSize: 11, color: "#6366f1", letterSpacing: 3, marginBottom: 8 }}>
          SUNCOAST · ACESSO RESTRITO
        </div>
        <h2 style={{ color: "#f1f5f9", margin: "0 0 24px", fontSize: 18 }}>
          Radar de Concorrentes
        </h2>
        <input
          type="password"
          value={senha}
          onChange={e => { setSenha(e.target.value); setErro(false); }}
          onKeyDown={e => { if (e.key === "Enter") ten
