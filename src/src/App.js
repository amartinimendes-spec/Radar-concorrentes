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
          onKeyDown={e => { if (e.key === "Enter") tentar(); }}
          placeholder="Digite a senha"
          style={{ ...inputStyle, textAlign: "center", marginBottom: 8, border: `1px solid ${erro ? "#f87171" : "#1e293b"}` }}
        />
        {erro && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>Senha incorreta.</div>}
        <button onClick={tentar} style={{
          marginTop: 8, width: "100%",
          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
          color: "#fff", border: "none", borderRadius: 10,
          padding: "12px 0", fontSize: 13, fontWeight: 700,
          cursor: "pointer", letterSpacing: 1, fontFamily: "inherit",
        }}>
          ENTRAR
        </button>
      </div>
    </div>
  );
}

function Principal({ onSair }) {
  const [registros, setRegistros] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({
    concorrente: "", item: "", categoria: "Hotel",
    dataInicio: "", dataFim: "", meuCusto: "", precoConc: "",
  });
  const [filtro, setFiltro] = useState("Todos");
  const [view, setView] = useState("lista");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
      setSalvando(true);
      setTimeout(() => setSalvando(false), 1200);
    } catch {}
  }, [registros]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleAdd() {
    const custo = parseFloat(form.meuCusto);
    const preco = parseFloat(form.precoConc);
    if (!form.item || !form.concorrente || isNaN(custo) || isNaN(preco)) return;
    const margem = ((preco - custo) / custo) * 100;
    const novo = { id: Date.now(), ...form, meuCusto: custo, precoConc: preco, margem };
    setRegistros(r => [novo, ...r]);
    setForm(f => ({ ...f, item: "", meuCusto: "", precoConc: "", concorrente: "", dataInicio: "", dataFim: "" }));
  }

  function handleDelete(id) {
    if (window.confirm("Remover esta cotação?")) {
      setRegistros(r => r.filter(x => x.id !== id));
    }
  }

  function exportCSV() {
    const header = ["Concorrente","Item","Categoria","Check-in / Início","Check-out / Fim","Meu Custo (R$)","Preço Deles (R$)","Margem (%)"];
    const rows = registros.map(r => [
      r.concorrente, r.item, r.categoria,
      r.dataInicio ? formatDate(r.dataInicio) : "",
      r.dataFim ? formatDate(r.dataFim) : "",
      r.meuCusto.toFixed(2).replace(".", ","),
      r.precoConc.toFixed(2).replace(".", ","),
      r.margem.toFixed(2).replace(".", ","),
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `radar-concorrentes-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportXLSX() {
    const dados = registros.map(r => ({
      "Concorrente": r.concorrente,
      "Item": r.item,
      "Categoria": r.categoria,
      "Check-in / Início": r.dataInicio ? formatDate(r.dataInicio) : "",
      "Check-out / Fim": r.dataFim ? formatDate(r.dataFim) : "",
      "Meu Custo (R$)": r.meuCusto,
      "Preço Deles (R$)": r.precoConc,
      "Margem (%)": parseFloat(r.margem.toFixed(2)),
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    ws["!cols"] = [20, 30, 12, 18, 18, 16, 18, 12].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Radar");
    XLSX.writeFile(wb, `radar-concorrentes-${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`);
  }

  const filtrados = useMemo(() =>
    filtro === "Todos" ? registros : registros.filter(r => r.categoria === filtro),
    [registros, filtro]
  );

  const resumo = useMemo(() => {
    const grupos = {};
    registros.forEach(r => {
      if (!grupos[r.concorrente]) grupos[r.concorrente] = [];
      grupos[r.concorrente].push(r.margem);
    });
    return Object.entries(grupos).map(([nome, margens]) => ({
      nome,
      media: margens.reduce((a, b) => a + b, 0) / margens.length,
      min: Math.min(...margens),
      max: Math.max(...margens),
      qtd: margens.length,
    }));
  }, [registros]);

  const previewMargem = form.meuCusto && form.precoConc
    ? ((parseFloat(form.precoConc) - parseFloat(form.meuCusto)) / parseFloat(form.meuCusto)) * 100
    : null;

  const labelData1 = form.categoria === "Hotel" ? "Check-in" : "Data início";
  const labelData2 = form.categoria === "Hotel" ? "Check-out" : "Data fim";

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0f1a",
      fontFamily: "'DM Mono','Courier New',monospace",
      color: "#e2e8f0", paddingBottom: 60,
    }}>
      <div style={{
        background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)",
        borderBottom: "1px solid #1e293b",
        padding: "28px 20px 20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color: "#6366f1", letterSpacing: 3, marginBottom: 6 }}>
              SUNCOAST · INTELIGÊNCIA COMPETITIVA
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>
              Radar de Concorrentes
            </h1>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
              Compare preços e margens do mercado
              {salvando && <span style={{ color: "#4ade80", fontSize: 10 }}>✓ salvo</span>}
            </div>
          </div>
          <button onClick={onSair} style={{
            background: "transparent", border: "1px solid #1e293b",
            color: "#475569", borderRadius: 8, padding: "6px 12px",
            fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}>🔒 Sair</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          {["lista", "resumo"].map(t => (
            <button key={t} onClick={() => setView(t)} style={{
              background: view === t ? "#6366f1" : "transparent",
              color: view === t ? "#fff" : "#64748b",
              border: `1px solid ${view === t ? "#6366f1" : "#1e293b"}`,
              borderRadius: 8, padding: "6px 16px", fontSize: 12,
              cursor: "pointer", letterSpacing: 1, fontFamily: "inherit",
            }}>
              {t === "lista" ? "📋 Cotações" : "📊 Resumo"}
            </button>
          ))}
        </div>

        {registros.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={exportXLSX} style={{
              background: "#14532d33", border: "1px solid #166534",
              color: "#4ade80", borderRadius: 8, padding: "6px 14px",
              fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            }}>📊 Exportar Excel</button>
            <button onClick={exportCSV} style={{
              background: "transparent", border: "1px solid #1e293b",
              color: "#94a3b8", borderRadius: 8, padding: "6px 14px",
              fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            }}>📄 Exportar CSV</button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 14px" }}>
        <div style={{
          background: "#111827", border: "1px solid #1e293b",
          borderRadius: 14, padding: 18, marginTop: 20,
        }}>
          <div style={{ fontSize: 10, color: "#6366f1", letterSpacing: 2, marginBottom: 14 }}>NOVA COTAÇÃO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input name="concorrente" value={form.concorrente} onChange={handleChange} placeholder="Concorrente" style={inputStyle} />
            <input name="item" value={form.item} onChange={handleChange} placeholder="Item (ex: Grand Floridian 7n)" style={inputStyle} />
            <select name="categoria" value={form.categoria} onChange={handleChange} style={{ ...inputStyle, color: "#94a3b8" }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div />
            <div>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>{labelData1}</div>
              <input name="dataInicio" value={form.dataInicio} onChange={handleChange} type="date" style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>{labelData2}</div>
              <input name="dataFim" value={form.dataFim} onChange={handleChange} type="date" style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
            <input name="meuCusto" value={form.meuCusto} onChange={handleChange} placeholder="Meu custo (R$)" type="number" style={inputStyle} />
            <input name="precoConc" value={form.precoConc} onChange={handleChange} placeholder="Preço deles (R$)" type="number" style={inputStyle} />
          </div>

          {previewMargem !== null && !isNaN(previewMargem) && (
            <div style={{
              marginTop: 12, padding: "10px 14px", background: "#0f172a",
              borderRadius: 8, border: "1px solid #1e293b", fontSize: 13, color: "#94a3b8",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>Margem estimada:</span>
              <MargemBadge margem={previewMargem} />
            </div>
          )}

          <button onClick={handleAdd} style={{
            marginTop: 14, width: "100%",
            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "12px 0", fontSize: 13, fontWeight: 700,
            cursor: "pointer", letterSpacing: 1, fontFamily: "inherit",
          }}>+ REGISTRAR COTAÇÃO</button>
        </div>

        {view === "lista" && (
          <div style={{ marginTop: 16 }}>
            {registros.length > 0 && (
              <div style={{ display: "flex", gap: 6, flex
