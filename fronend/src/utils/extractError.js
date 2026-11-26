// Standardized helper to unwrap Axios/API errors into a readable string.
export function extractError(err, fallback = "Request failed.") {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  const data = err?.response?.data;
  const baseMessage =
    (typeof data?.message === "string" && data.message.trim()) ||
    (typeof data === "string" && data.trim()) ||
    (typeof err?.message === "string" && err.message.trim()) ||
    fallback;

  if (Array.isArray(data?.details) && data.details.length > 0) {
    const first = data.details.find((item) => typeof item?.message === "string" && item.message.trim());
    if (first && first.message !== baseMessage) {
      return first.field ? `${baseMessage} (${first.field}: ${first.message})` : `${baseMessage} (${first.message})`;
    }
  }

  return baseMessage;
}
