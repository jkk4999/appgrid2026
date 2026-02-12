export async function onRequestGet() {
  return new Response(
    JSON.stringify({ content: "Hello from Cloudflare API" }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*"
      }
    }
  );
}