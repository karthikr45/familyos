/** Collect an async text stream into a single string. */
export async function collectStream(stream: AsyncIterable<string>): Promise<string> {
  let result = '';
  for await (const chunk of stream) {
    result += chunk;
  }
  return result;
}

/**
 * Adapt a text stream into Server-Sent Events frames. Each chunk becomes a
 * `data:` line; a terminal `[DONE]` frame signals completion. Used by the API's
 * SSE tutor endpoint.
 */
export async function* toSseFrames(
  stream: AsyncIterable<string>,
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of stream) {
    yield `data: ${JSON.stringify({ delta: chunk })}\n\n`;
  }
  yield 'data: [DONE]\n\n';
}

/** Run a callback on each chunk while passing chunks through unchanged. */
export async function* tapStream(
  stream: AsyncIterable<string>,
  onChunk: (chunk: string) => void,
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of stream) {
    onChunk(chunk);
    yield chunk;
  }
}
