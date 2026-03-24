/**
 * Centralized Groq Model Configuration
 * Replaced decommissioned Llama 3.2 vision models with Llama 4 family.
 */
export const GROQ_MODELS = {
  // Vision-capable model (fast, lightweight replacement for llama-3.2-11b)
  VISION: "meta-llama/llama-4-scout-17b-16e-instruct",

  // High-performance vision model (replacement for llama-3.2-90b)
  VISION_PRO: "meta-llama/llama-4-maverick-17b-128e-instruct",

  // Stable text-only model
  TEXT: "llama3-70b-8192",
};

export default GROQ_MODELS;
