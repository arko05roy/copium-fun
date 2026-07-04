const ACTION_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Content-Encoding, Accept-Encoding, Solana-Client, Solana-Client-Version",
} as const;

export function actionCorsHeaders(extra?: Record<string, string>): HeadersInit {
  return { ...ACTION_CORS, ...extra };
}

export function actionJson(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> },
): Response {
  return Response.json(body, {
    status: init?.status ?? 200,
    headers: actionCorsHeaders(init?.headers),
  });
}

export function actionOptions(): Response {
  return new Response(null, { status: 204, headers: actionCorsHeaders() });
}
