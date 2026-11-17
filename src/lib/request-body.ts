// Bound memory even when a client omits or forges Content-Length.
export async function limitedBody(
  request: Request,
  maxBytes: number,
): Promise<Buffer> {
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("Pedido demasiado grande.");
      }
      parts.push(value);
    }
    return Buffer.concat(parts, size);
  } finally {
    reader.releaseLock();
  }
}
