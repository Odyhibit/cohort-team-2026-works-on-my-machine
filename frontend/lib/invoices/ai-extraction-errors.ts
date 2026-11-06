const messages = {
  invalid_key: "Google rejected the Gemini API key. Check GEMINI_API_KEY and restart or redeploy the app.",
  permission: "Gemini access is denied. Check the API key's project, API restrictions, and billing setup.",
  quota: "Gemini's quota or rate limit was reached. Check usage and billing in Google AI Studio, then try again.",
  model: "The configured Gemini model is unavailable. Check GEMINI_EXTRACTION_MODEL for this API key.",
  request: "Gemini rejected the document request. Check the extraction service configuration and file format.",
  unavailable: "Gemini is temporarily unavailable. Try extraction again later.",
  timeout: "Gemini took too long to read the document. Try extraction again or enter the details manually.",
  network: "Could not connect to Gemini. Try extraction again later.",
  output: "Gemini did not return usable invoice details. Try another scan or enter the details manually.",
};

// Only fixed messages cross into the UI. Never forward raw provider messages.
export class AiExtractionError extends Error {
  constructor(readonly code: keyof typeof messages) {
    super(messages[code]);
    this.name = "AiExtractionError";
  }
}

export function geminiRequestError(status: number, body: unknown) {
  const error = body && typeof body === "object" && "error" in body ? body.error : null;
  const details = error && typeof error === "object" && "details" in error ? error.details : null;
  const reasons = Array.isArray(details) ? details.flatMap((item: unknown) =>
    item && typeof item === "object" && "reason" in item && typeof item.reason === "string" ? [item.reason] : [],
  ) : [];
  if (reasons.includes("API_KEY_INVALID") || reasons.includes("API_KEY_EXPIRED") || status === 401) return new AiExtractionError("invalid_key");
  if (status === 403) return new AiExtractionError("permission");
  if (status === 429) return new AiExtractionError("quota");
  if (status === 404) return new AiExtractionError("model");
  return new AiExtractionError(status >= 500 ? "unavailable" : "request");
}
