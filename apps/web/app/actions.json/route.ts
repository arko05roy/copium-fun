import { actionCorsHeaders } from "@/lib/action-cors";

export async function GET() {
  return Response.json(
    {
      rules: [
        {
          pathPattern: "/pulse/*",
          apiPath: "/api/actions/pulse-pick/*",
        },
        {
          pathPattern: "/agent/*",
          apiPath: "/api/actions/copy-agent/*",
        },
        {
          pathPattern: "/fade/*",
          apiPath: "/api/actions/fade-agent/*",
        },
        {
          pathPattern: "/room/*",
          apiPath: "/api/actions/join-room/*",
        },
      ],
    },
    { headers: actionCorsHeaders() },
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: actionCorsHeaders() });
}
