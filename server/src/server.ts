import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
  })
);

app.use(express.json());

app.post("/auth/github/exchange", async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Authorization code is required",
      });
    }

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("GitHub token exchange failed:", data);

      return res.status(400).json({
        error: data.error_description || "Token exchange failed",
      });
    }

    return res.json({
      access_token: data.access_token,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Solohub auth server running on port ${PORT}`);
});