import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import Head from "next/head";

function buildAnonymizedText(headers, dataRows, nameColIndex) {
  const mapping = {};
  const anonRows = dataRows.map((row, i) => {
    const code = `FOURN_${String(i + 1).padStart(3, "0")}`;
    mapping[code] = String(row[nameColIndex] || "").trim();
    return row.map((cell, j) => (j === nameColIndex ? code : String(cell).trim()));
  });
  let text = headers.join(" | ") + "\n";
  anonRows.forEach((row) => { text += row.join(" | ") + "\n"; });
  return { text, mapping };
}

function parseMarkdownTable(text) {
  const lines = text.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return null;
  const headers = lines[0].split("|").map((h) => h.trim()).filter(Boolean);
  const rows = lines.slice(2).map((l) => l.split("|").map((c) => c.trim()).filter(Boolean)).filter((r) => r.length === headers.length);
  return { headers, rows };
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase() || "";
  let color = "#4ade80", bg = "#052e16";
  if (s.includes("erreur") || s.includes("invalide") || s.includes("fermé")) { color = "#f87171"; bg = "#1e0a0a"; }
  else if (s.includes("vérifier") || s.includes("warning") || s.includes("manquant")) { color = "#fbbf24"; bg = "#1a1000"; }
  return <span style={{ background: bg, color, border: `1px solid ${color}33`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{status}</span>;
}

function MarkdownTable({ text, mapping }) {
  const parsed = parseMarkdownTable(text);
  if (!parsed) return null;
  const codeColIdx = parsed.headers.findIndex((h) => h.toLowerCase().includes("code") || h.toLowerCase().includes("fournisseur") || h.toLowerCase().includes("nom"));
  return (
    <div style={{ overflowX: "auto", margin: "12px 0" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead><tr>{parsed.headers.map((h, i) => <th key={i} style={{ background: "#0f172a", color: "#94a3b8", padding: "8px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1e293b" }}>{h}</th>)}</tr></thead>
        <tbody>
          {parsed.rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#070f1a" : "#0a1525" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "8px 12px", color: "#cbd5e1", borderBottom: "1px solid #1e293b12" }}>
                  {j === 1 ? <StatusBadge status={cell} /> : (j === codeColIdx && mapping?.[cell]) ? <span title={`Code : ${cell}`} style={{ cursor: "help", borderBottom: "1px dashed #475569" }}>{mapping[cell]}</span> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {mapping && Object.keys(mapping).length > 0 && <div style={{ fontSize: 10, color: "#334155", marginTop: 6, fontStyle: "italic" }}>🔒 Noms réels réaffichés localement — seuls les codes ont transité.</div>}
    </div>
  );
}

function renderMessage(content, mapping) {
  const parts = [];
  const tableRegex = /(\|.+\|[\s\S]*?)(?=\n[^|]|$)/g;
  let last = 0, match;
  while ((match = tableRegex.exec(content)) !== null) {
    if (match.index > last) parts.push({ type: "text", value: content.slice(last, match.index) });
    parts.push({ type: "table", value: match[1] });
    last = match.index + match[1].length;
  }
  if (last < content.length) parts.push({ type: "text", value: content.slice(last) });
  return parts.map((p, i) => p.type === "table" ? <MarkdownTable key={i} text={p.value} mapping={mapping} /> : <span key={i} style={{ whiteSpace: "pre-wrap" }}>{p.value}</span>);
}

function ConsentModal({ onAccept, onRefuse }) {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000dd", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#070f1a", border: "1px solid #0ea5e940", borderRadius: 14, maxWidth: 520, width: "100%", padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>🔒</span>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>PROTECTION DES DONNÉES</div>
            <div style={{ color: "#64748b", fontSize: 11 }}>Conformité RGPD — À lire avant de continuer</div>
          </div>
        </div>
        <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
          <p style={{ margin: "0 0 12px" }}>Avant l'envoi, votre fichier est <strong style={{ color: "#0ea5e9" }}>automatiquement anonymisé dans votre navigateur</strong> :</p>
          <ul style={{ margin: "0 0 16px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Les <strong style={{ color: "#e2e8f0" }}>raisons sociales</strong> sont remplacées par des codes (FOURN_001…)</li>
            <li>Seuls <strong style={{ color: "#e2e8f0" }}>SIRET et TVA</strong> transitent vers notre serveur sécurisé</li>
            <li>Les noms réels restent <strong style={{ color: "#e2e8f0" }}>uniquement dans votre navigateur</strong></li>
            <li>Aucune donnée n'est <strong style={{ color: "#e2e8f0" }}>stockée</strong> sur nos serveurs</li>
          </ul>
          <div style={{ background: "#0a1525", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#64748b" }}>
            <strong style={{ color: "#94a3b8" }}>Base légale :</strong> Traitement basé sur votre consentement explicite (art. 6.1.a RGPD).
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 20, color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: "#0ea5e9", flexShrink: 0 }} />
          J'accepte que mes données (anonymisées) soient analysées par l'IA dans le cadre de l'audit e-Invoicing 2026.
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onRefuse} style={{ flex: 1, background: "transparent", border: "1px solid #1e293b", borderRadius: 8, color: "#64748b", padding: "10px", cursor: "pointer", fontSize: 13 }}>Annuler</button>
          <button onClick={onAccept} disabled={!checked} style={{ flex: 2, background: checked ? "linear-gradient(135deg, #0ea5e9, #6366f1)" : "#1e293b", border: "none", borderRadius: 8, color: checked ? "#fff" : "#475569", padding: "10px", cursor: checked ? "pointer" : "default", fontSize: 13, fontWeight: 700, transition: "all .2s" }}>✓ Lancer l'audit</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Bonjour. Je suis Compliance-Data-2026, votre agent de mise en conformité fournisseurs pour la réforme e-Invoicing 2026.\n\n🔒 Vos données sont anonymisées dans votre navigateur avant tout envoi. Importez votre fichier Excel ou CSV pour démarrer l'audit.", mapping: null }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [consent, setConsent] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [currentMapping, setCurrentMapping] = useState({});
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);
  const historyRef = useRef([]);

  function parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          if (rows.length === 0) return reject("Fichier vide");
          const headers = rows[0].map((h) => String(h).trim());
          const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== ""));
          const nameColIndex = Math.max(0, headers.findIndex((h) => /nom|name|raison|société|company|fournisseur/i.test(h)));
          const { text, mapping } = buildAnonymizedText(headers, dataRows, nameColIndex);
          resolve({ text, mapping, count: dataRows.length });
        } catch (err) { reject("Impossible de lire le fichier : " + err.message); }
      };
      reader.onerror = () => reject("Erreur de lecture");
      reader.readAsArrayBuffer(file);
    });
  }

  async function processFile(file) {
    setFileName(file.name); setError(null);
    try {
      const { text, mapping, count } = await parseFile(file);
      setCurrentMapping(mapping);
      const fullText = `Voici les données fournisseurs anonymisées à auditer (fichier: ${file.name}, ${count} lignes) :\n\n${text}`;
      const display = `📂 ${file.name} — ${count} fournisseurs\n🔒 Anonymisé avant envoi`;
      await sendMessage(fullText, display, mapping);
    } catch (err) { setFileName(null); setError(String(err)); }
  }

  async function handleFile(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) { setError("Format accepté : Excel (.xlsx, .xls) ou CSV (.csv)"); return; }
    if (!consent) { setPendingFile(file); } else { await processFile(file); }
  }

  async function handleConsentAccept() { setConsent(true); const file = pendingFile; setPendingFile(null); if (file) await processFile(file); }
  function onFileInput(e) { handleFile(e.target.files[0]); e.target.value = ""; }
  function onDrop(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }

  async function sendMessage(text, displayOverride, mapping) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput(""); setError(null);
    const displayContent = displayOverride || userMsg;
    const newHistory = [...historyRef.current, { role: "user", content: userMsg }];
    historyRef.current = newHistory;
    setMessages((prev) => [...prev, { role: "user", content: displayContent, mapping: null }]);
    setLoading(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: newHistory }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur serveur"); setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${data.error}`, mapping: null }]); return; }
      const reply = data.reply || "Réponse vide.";
      historyRef.current = [...newHistory, { role: "assistant", content: reply }];
      setMessages((prev) => [...prev, { role: "assistant", content: reply, mapping: mapping || currentMapping }]);
    } catch { setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Erreur de connexion.", mapping: null }]); }
    finally { setLoading(false); setFileName(null); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }
  }

  return (
    <>
      <Head><title>Compliance-Data-2026 | Audit e-Invoicing</title><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="robots" content="noindex, nofollow" /></Head>
      <div style={{ minHeight: "100vh", background: "#030b15", fontFamily: "'DM Mono', 'Courier New', monospace", display: "flex", flexDirection: "column" }} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
        {pendingFile && <ConsentModal onAccept={handleConsentAccept} onRefuse={() => setPendingFile(null)} />}
        {dragOver && <div style={{ position: "fixed", inset: 0, background: "#0ea5e912", border: "2px dashed #0ea5e9", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}><div style={{ color: "#0ea5e9", fontSize: 22, fontWeight: 700, textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>DÉPOSEZ LE FICHIER ICI</div></div>}
        <div style={{ background: "#050e1c", borderBottom: "1px solid #0ea5e920", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #0ea5e9, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖️</div>
          <div><div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15, letterSpacing: 2, textTransform: "uppercase" }}>Compliance-Data-2026</div><div style={{ color: "#0ea5e9", fontSize: 11, letterSpacing: 1 }}>Agent IA · e-Invoicing · Serveur sécurisé</div></div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#0a1525", border: "1px solid #1e3a5f", borderRadius: 6, padding: "4px 10px" }}><span style={{ fontSize: 12 }}>🔒</span><span style={{ color: "#64748b", fontSize: 10, letterSpacing: 1 }}>ANONYMISÉ · RGPD</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} /><span style={{ color: "#4ade80", fontSize: 11, letterSpacing: 1 }}>ACTIF</span></div>
          </div>
        </div>
        {error && <div style={{ background: "#1e0a0a", borderBottom: "1px solid #f8717130", padding: "10px 24px", color: "#f87171", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}><span>⚠️</span> {error}<button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14 }}>✕</button></div>}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, flexShrink: 0, background: msg.role === "user" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "linear-gradient(135deg, #0ea5e9, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{msg.role === "user" ? "👤" : "🤖"}</div>
                <div style={{ background: msg.role === "user" ? "#0f1f3a" : "#070f1a", border: `1px solid ${msg.role === "user" ? "#6366f118" : "#0ea5e918"}`, borderRadius: 10, padding: "12px 16px", maxWidth: "85%", color: "#cbd5e1", fontSize: 13.5, lineHeight: 1.7 }}>{renderMessage(msg.content, msg.mapping)}</div>
              </div>
            ))}
            {loading && <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><div style={{ width: 32, height: 32, borderRadius: 6, background: "linear-gradient(135deg, #0ea5e9, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div><div style={{ background: "#070f1a", border: "1px solid #0ea5e918", borderRadius: 10, padding: "14px 18px" }}><div style={{ display: "flex", gap: 6, alignItems: "center" }}>{[0,1,2].map((j) => <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: "#0ea5e9", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${j * 0.2}s` }} />)}<span style={{ color: "#475569", fontSize: 12, marginLeft: 6 }}>{fileName ? `Analyse de ${fileName}…` : "Analyse en cours…"}</span></div></div></div>}
            <div ref={bottomRef} />
          </div>
        </div>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 20px 10px", width: "100%", boxSizing: "border-box" }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={onFileInput} />
          <button onClick={() => fileRef.current?.click()} disabled={loading} style={{ width: "100%", background: "#070f1a", border: "1.5px dashed #0ea5e945", borderRadius: 10, color: "#64748b", padding: "13px 20px", cursor: loading ? "default" : "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 12, transition: "all .2s" }} onMouseOver={(e) => { if (!loading) { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.color = "#0ea5e9"; e.currentTarget.style.background = "#0a1828"; } }} onMouseOut={(e) => { e.currentTarget.style.borderColor = "#0ea5e945"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "#070f1a"; }}>
            <span style={{ fontSize: 22 }}>📂</span>
            <div style={{ textAlign: "left" }}><div style={{ fontWeight: 700, letterSpacing: 1, fontSize: 12 }}>IMPORTER LE FICHIER FOURNISSEURS</div><div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Excel / CSV · Glisser-déposer · Noms anonymisés avant envoi</div></div>
            <span style={{ marginLeft: "auto", fontSize: 18 }}>🔒</span>
          </button>
        </div>
        <div style={{ background: "#050e1c", borderTop: "1px solid #0ea5e915", padding: "14px 20px" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", gap: 10 }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Ou collez vos données ici (Nom | SIRET | TVA)…" rows={2} style={{ flex: 1, background: "#070f1a", border: "1px solid #0ea5e925", borderRadius: 8, color: "#e2e8f0", padding: "10px 14px", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }} />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ background: loading || !input.trim() ? "#0a1525" : "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none", borderRadius: 8, color: "#fff", padding: "0 20px", cursor: loading || !input.trim() ? "default" : "pointer", fontSize: 18, transition: "all .2s", opacity: loading || !input.trim() ? 0.4 : 1 }}>▶</button>
          </div>
          <div style={{ maxWidth: 820, margin: "5px auto 0", color: "#1e3a5f", fontSize: 11, textAlign: "right" }}>Entrée pour envoyer · Shift+Entrée pour nouvelle ligne</div>
        </div>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: #030b15; } @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #050e1c; } ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }`}</style>
      </div>
    </>
  );
}
