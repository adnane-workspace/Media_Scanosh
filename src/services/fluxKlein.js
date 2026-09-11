/**
 * NVIDIA API — FLUX.2 [klein] 4B
 * Auth: Authorization: Bearer <NVIDIA_API_KEY>  (nvapi-...)
 */

const NVIDIA_BASE =
  process.env.NVIDIA_API_BASE || "https://ai.api.nvidia.com/v1/genai";

export const FLUX_MODELS = {
  "klein-4b": "black-forest-labs/flux.2-klein-4b",
};

function getApiKey() {
  const key = process.env.NVIDIA_API_KEY || process.env.BFL_API_KEY;
  if (!key) {
    const err = new Error(
      "NVIDIA_API_KEY is missing in .env (https://build.nvidia.com)"
    );
    err.status = 500;
    throw err;
  }
  return key;
}

/**
 * Generate an image with Flux.2 Klein via NVIDIA.
 * Returns a data URI ready for Cloudinary upload.
 */
export async function generateFluxImage({
  prompt,
  model = "klein-4b",
  seed,
  steps = 4,
} = {}) {
  if (!prompt?.trim()) {
    const err = new Error("prompt is required");
    err.status = 400;
    throw err;
  }

  const modelPath = FLUX_MODELS[model] || FLUX_MODELS["klein-4b"];
  const key = getApiKey();

  const body = {
    prompt: prompt.trim(),
    height: 1024,
    width: 1024,
    steps: Math.min(Math.max(Number(steps) || 4, 1), 4),
  };
  if (typeof seed === "number" && seed >= 1) body.seed = seed;
  else body.seed = Math.floor(Math.random() * 1_000_000) + 1;

  const res = await fetch(`${NVIDIA_BASE}/${modelPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    const msg = Array.isArray(detail)
      ? detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
      : detail || data?.title || data?.message || `NVIDIA error ${res.status}`;
    const err = new Error(typeof msg === "string" ? msg : String(msg));
    err.status = res.status;
    throw err;
  }

  const b64 = data?.artifacts?.[0]?.base64;
  const finishReason = data?.artifacts?.[0]?.finishReason;
  if (!b64 || typeof b64 !== "string") {
    const err = new Error(
      finishReason === "CONTENT_FILTERED"
        ? "NVIDIA content filter blocked this prompt"
        : `NVIDIA response missing image (${finishReason || "empty"})`
    );
    err.status = 502;
    throw err;
  }

  const dataUri = `data:image/jpeg;base64,${b64}`;

  return {
    id: `nvidia-${Date.now()}`,
    url: dataUri,
    dataUri,
    model: modelPath,
    prompt: prompt.trim(),
    width: 1024,
    height: 1024,
  };
}
