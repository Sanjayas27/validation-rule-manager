const express = require("express");
const cors = require("cors");
const axios = require("axios");
const session = require("express-session");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://validation-rule-manager.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

function requireAuth(req, res, next) {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

app.get("/", (req, res) => {
  res.json({ status: "Validation Rule Manager API is running" });
});

app.get("/auth/login", (req, res) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SF_CLIENT_ID,
    redirect_uri: process.env.SF_CALLBACK_URL,
    scope: "api full refresh_token",
  });
  const authUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize?${params}`;
  res.redirect(authUrl);
});

app.get("/oauth/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }

  try {
    const tokenRes = await axios.post(
      `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.SF_CLIENT_ID,
        client_secret: process.env.SF_CLIENT_SECRET,
        redirect_uri: process.env.SF_CALLBACK_URL,
        code,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, instance_url, id } = tokenRes.data;

    req.session.accessToken = access_token;
    req.session.refreshToken = refresh_token;
    req.session.instanceUrl = instance_url;

    const userRes = await axios.get(id, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    req.session.userInfo = {
      name: userRes.data.display_name,
      email: userRes.data.email,
      username: userRes.data.username,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect(`${process.env.FRONTEND_URL}?error=session_error`);
      }
      res.redirect(`${process.env.FRONTEND_URL}?login=success`);
    });
  } catch (err) {
    console.error("OAuth error:", err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
  }
});

app.get("/auth/status", (req, res) => {
  if (req.session.accessToken) {
    res.json({ authenticated: true, user: req.session.userInfo, instanceUrl: req.session.instanceUrl });
  } else {
    res.json({ authenticated: false });
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/validation-rules", requireAuth, async (req, res) => {
  try {
    const query = `SELECT Id, ValidationName, Active, Description, EntityDefinitionId FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = 'Account'`;
    const response = await axios.get(
      `${req.session.instanceUrl}/services/data/v59.0/tooling/query`,
      { params: { q: query }, headers: { Authorization: `Bearer ${req.session.accessToken}` } }
    );
    const rules = response.data.records.map((rule) => ({
      id: rule.Id, name: rule.ValidationName, active: rule.Active, description: rule.Description || "",
    }));
    res.json({ rules });
  } catch (err) {
    console.error("Fetch rules error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch validation rules" });
  }
});

app.patch("/api/validation-rules/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    const getRes = await axios.get(
      `${req.session.instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${id}`,
      { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
    );
    await axios.patch(
      `${req.session.instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${id}`,
      { Metadata: { ...getRes.data.Metadata, active } },
      { headers: { Authorization: `Bearer ${req.session.accessToken}`, "Content-Type": "application/json" } }
    );
    res.json({ success: true, id, active });
  } catch (err) {
    console.error("Toggle rule error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to update validation rule" });
  }
});

app.patch("/api/validation-rules", requireAuth, async (req, res) => {
  const { active, ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });
  const results = [];
  for (const id of ids) {
    try {
      const getRes = await axios.get(
        `${req.session.instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${id}`,
        { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
      );
      await axios.patch(
        `${req.session.instanceUrl}/services/data/v59.0/tooling/sobjects/ValidationRule/${id}`,
        { Metadata: { ...getRes.data.Metadata, active } },
        { headers: { Authorization: `Bearer ${req.session.accessToken}`, "Content-Type": "application/json" } }
      );
      results.push({ id, success: true, active });
    } catch (err) {
      results.push({ id, success: false, error: err.response?.data || err.message });
    }
  }
  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});