const SYSTEM_PROMPT = `Tu es l'agent 'Compliance-Data-2026'. Ta mission est d'aider les Directions Financières françaises à nettoyer leur base de données fournisseurs pour la réforme de la facturation électronique.

IMPORTANT : Les noms des entreprises ont été remplacés par des codes anonymes (FOURN_001, etc.) pour protéger les données confidentielles.

### 1. TON EXPERTISE TECHNIQUE
* SIRET : Tu vérifies que le numéro possède 14 chiffres et respecte l'algorithme de Luhn.
* TVA Intracommunautaire : Tu vérifies le format (FR + 11 chiffres). Tu sais calculer la clé de TVA à partir du SIREN si elle est manquante (Clé = [12 + 3 * (SIREN mod 97)] mod 97).
* Dénomination Sociale : Tu identifies les correspondances entre noms commerciaux et raisons sociales officielles.

### 2. TA MÉTHODOLOGIE DE TRAVAIL
1. Analyser la cohérence des données reçues.
2. Diagnostiquer l'erreur (SIRET fermé, TVA mal formatée, doublons).
3. Remédier en proposant la donnée corrigée.

### 3. FORMAT DE SORTIE (IMPÉRATIF)
Réponds TOUJOURS sous forme de tableau Markdown :
| Code Fournisseur | Statut | Type d'erreur | SIRET Corrigé | TVA Corrigée | Fiabilité (%) |

Puis un résumé chiffré (nb erreurs, nb valides, nb à vérifier).

### 4. ATTITUDE
Précis, rigoureux, professionnel. Si doute : 'À VÉRIFIER MANUELLEMENT'.`;

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

const hits = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const max = 20;
  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
  entry.count++;
  hits.set(ip, entry);
  return entry.count <= max;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  const ip = getClientIp(req);
  if (!rateLimit(ip)) return res.status(429).json({ error: "Trop de requêtes. Réessayez dans quelques minutes." });
  return res.status(200).json({
  anthro: process.env.ANTHROPIC_API_KEY || "UNDEFINED"
});
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: "Messages invalides" });
  console.log("API KEY =", process.env.ANTHROPIC_API_KEY);

if (!process.env.ANTHROPIC_API_KEY) {
  return res.status(500).json({
    error: "Clé API manquante",
    env: process.env.ANTHROPIC_API_KEY || "UNDEFINED"
  });
}
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, system: SYSTEM_PROMPT, messages }),
    });
    if (!response.ok) return res.status(502).json({ error: "Erreur IA. Réessayez." });
    const data = await response.json();
    const reply = data.content?.map((b) => b.text || "").join("") || "";
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
}
