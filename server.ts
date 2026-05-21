import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // API Route: Validate Gemini API Key
  app.post("/api/gemini/validate", async (req, res) => {
    const apiKey = req.headers["x-gemini-key"] as string || req.body.apiKey;

    if (!apiKey) {
      return res.status(400).json({ success: false, error: "API key is required" });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Quick test call to validate key
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Say 'Success' in Hinglish in 3 words or less.",
      });

      if (response && response.text) {
        return res.json({ success: true, message: response.text.trim() });
      } else {
        return res.status(400).json({ success: false, error: "No response from Gemini API" });
      }
    } catch (err: any) {
      console.error("Validation error:", err);
      const errStr = typeof err === "object" ? JSON.stringify(err) : String(err);
      const isQuotaExceeded = errStr.includes("429") || errStr.toLowerCase().includes("quota") || errStr.includes("resource_exhausted");
      return res.status(isQuotaExceeded ? 429 : 400).json({ 
        success: false, 
        quotaExceeded: isQuotaExceeded,
        error: isQuotaExceeded 
          ? "Gemini API daily/minutely quote limits exceeded (429 RESOURCE_EXHAUSTED). Free tier allows limited requests."
          : (err.message || "Invalid API key or network error.")
      });
    }
  });

  // API Route: Chat and discipline coaching
  app.post("/api/gemini/chat", async (req, res) => {
    const apiKey = req.headers["x-gemini-key"] as string;
    const { history, message } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "X-Gemini-Key authorization header is required." });
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Map roles to Google GenAI structure (user and model)
      // Any previous assistant role must be converted to 'model'
      const formattedHistory = (history || []).map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Append the latest user message
      formattedHistory.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedHistory,
        config: {
          systemInstruction: 
            "You are a calm, highly disciplined, and mature productivity coach for a NEET aspirant. " +
            "Speak in natural, realistic, and motivating Hinglish (mix of Hindi & English). " +
            "NEVER sound cringe, over-the-top, or like dramatic 'sigma male' comments. " +
            "Focus on night-study consistency, solving MCQs, deep focus, dopamine detox, sleep, " +
            "physical health (running, pushups, hydration), and keeping personal life in balance. " +
            "Always guide like a mature, wise, and highly focused direct mentor. Keep your answers " +
            "concise, hard-hitting, grounded in reality, and centered on prompt action.",
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        return res.json({ text: response.text });
      } else {
        return res.status(500).json({ error: "Empty response received from Gemini API." });
      }
    } catch (err: any) {
      console.error("Chat proxy error:", err);
      const errStr = typeof err === "object" ? JSON.stringify(err) : String(err);
      const isQuotaExceeded = errStr.includes("429") || errStr.toLowerCase().includes("quota") || errStr.includes("resource_exhausted");
      return res.status(isQuotaExceeded ? 429 : 500).json({ 
        error: isQuotaExceeded 
          ? "Gemini API rate/daily quota limit exhausted (429 RESOURCE_EXHAUSTED)."
          : (err.message || "Failed to communicate with Gemini API."),
        quotaExceeded: isQuotaExceeded
      });
    }
  });

  // Vite middleware setup for assets/app in dev / prod environments
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on port ${PORT}`);
  });
}

startServer();
