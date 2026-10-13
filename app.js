const express = require("express");
const { GoogleAuth } = require("google-auth-library");

const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => res.type('html').send(html));
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/version", (req, res) => res.json({ version: "1.1.0" }));
app.get("/gcp-check", async (req, res) => {
  const provider = process.env.GCP_WORKLOAD_IDENTITY_PROVIDER;
  const tokenFile = process.env.GCP_IDENTITY_TOKEN_FILE;
  const bucketName = process.env.GCP_BUCKET_NAME;

  if (!provider || !tokenFile || !bucketName) {
    return res.status(503).json({
      ok: false,
      error: "GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_IDENTITY_TOKEN_FILE, and GCP_BUCKET_NAME must be set"
    });
  }

  try {
    const providerResource = provider
      .replace(/^https:\/\/iam\.googleapis\.com\//, "")
      .replace(/^\/\/iam\.googleapis\.com\//, "");
    const credentials = {
      type: "external_account",
      audience: `//iam.googleapis.com/${providerResource}`,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      credential_source: {
        file: tokenFile,
        format: { type: "text" }
      }
    };
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/devstorage.read_only"]
    });
    const client = await auth.getClient();
    const response = await client.request({
      url: `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucketName)}`,
      method: "GET"
    });

    return res.json({
      ok: true,
      bucket: response.data.id,
      location: response.data.location
    });
  } catch (error) {
    console.error("GCP access check failed:", error.message);
    return res.status(502).json({
      ok: false,
      error: "GCP access check failed"
    });
  }
});

const server = app.listen(port, "0.0.0.0", () => console.log(`Example app is listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Express on Render</title>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
    <script>
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      }, 500);
    </script>
    <style>
      @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
      @font-face {
        font-family: "neo-sans";
        src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
        font-style: normal;
        font-weight: 700;
      }
      html {
        font-family: neo-sans;
        font-weight: 700;
        font-size: calc(62rem / 16);
      }
      body {
        background: white;
      }
      section {
        border-radius: 1em;
        padding: 1em;
        position: absolute;
        top: 50%;
        left: 50%;
        margin-right: -50%;
        transform: translate(-50%, -50%);
      }
    </style>
  </head>
  <body>
    <section>
      Express on Render
    </section>
  </body>
</html>
`
