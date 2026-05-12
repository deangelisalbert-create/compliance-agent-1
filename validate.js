const MAX_MESSAGES = 20;
const MAX_MSG_LENGTH = 50000;
const MAX_TOTAL_LENGTH = 200000;

export function validateMessages(messages) {
  if (!Array.isArray(messages)) return { valid: false, error: "Format invalide" };
  if (messages.length > MAX_MESSAGES) return { valid: false, error: "Conversation trop longue (max 20 échanges)" };
  let totalLength = 0;
  for (const msg of messages) {
    if (!["user", "assistant"].includes(msg.role)) return { valid: false, error: "Rôle invalide" };
    if (typeof msg.content !== "string") return { valid: false, error: "Contenu invalide" };
    if (msg.content.length > MAX_MSG_LENGTH) return { valid: false, error: "Message trop long. Réduisez le nombre de lignes à analyser." };
    totalLength += msg.content.length;
  }
  if (totalLength > MAX_TOTAL_LENGTH) return { valid: false, error: "Conversation trop volumineuse." };
  return { valid: true };
}
