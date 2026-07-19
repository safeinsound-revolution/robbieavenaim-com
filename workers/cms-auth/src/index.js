/**
 * Minimal GitHub OAuth handshake for Sveltia CMS (github.com/sveltia/sveltia-cms).
 * Two routes:
 *   GET /auth      — redirect to GitHub's authorize screen
 *   GET /callback  — exchange the returned code for an access token and
 *                    hand it back to the CMS popup via postMessage
 */

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

function randomState() {
  return crypto.randomUUID();
}

function renderCallbackPage({ provider, status, payload }) {
  const message = `authorization:${provider}:${status}:${JSON.stringify(payload)}`;
  return `<!doctype html>
<html>
  <body>
    <script>
      (function () {
        function receiveMessage(e) {
          window.opener.postMessage(${JSON.stringify(message)}, e.origin);
          window.removeEventListener("message", receiveMessage, false);
        }
        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:${provider}", "*");
      })();
    </script>
  </body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN || "*";

    if (url.pathname === "/auth") {
      const state = randomState();
      const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
      authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authorizeUrl.searchParams.set("redirect_uri", `${url.origin}/callback`);
      authorizeUrl.searchParams.set("scope", "repo,user");
      authorizeUrl.searchParams.set("state", state);

      const response = Response.redirect(authorizeUrl.toString(), 302);
      const headers = new Headers(response.headers);
      headers.append("Set-Cookie", `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
      return new Response(null, { status: 302, headers });
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");

      if (!code) {
        return new Response("Missing code", { status: 400 });
      }

      const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${url.origin}/callback`,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error || !tokenData.access_token) {
        return new Response(
          renderCallbackPage({
            provider: "github",
            status: "error",
            payload: { message: tokenData.error_description || "OAuth exchange failed" },
          }),
          { headers: { "Content-Type": "text/html", "Access-Control-Allow-Origin": allowedOrigin } }
        );
      }

      return new Response(
        renderCallbackPage({
          provider: "github",
          status: "success",
          payload: { token: tokenData.access_token, provider: "github" },
        }),
        { headers: { "Content-Type": "text/html", "Access-Control-Allow-Origin": allowedOrigin } }
      );
    }

    return new Response("Not found", { status: 404 });
  },
};
