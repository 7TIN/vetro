import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

// Validation - at least one API key must be present
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GEMINI_API_KEY && !DEEPSEEK_API_KEY && !GROQ_API_KEY) {
  throw new Error(
    "At least one API key is required: GEMINI_API_KEY, DEEPSEEK_API_KEY, or GROQ_API_KEY"
  );
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "1mb" }));
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean); // removes undefined

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, health checks
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);


// Initialize AI clients
let geminiClient: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// Types
interface ChatRequest {
  message: string;
  model?: "gemini" | "deepseek" | "groq";
}

interface ChatResponse {
  message: string;
  model: string;
  tokensUsed?: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface AvailableModelsResponse {
  available: string[];
  default: string;
}

// Helper function to call Gemini
async function callGemini(message: string): Promise<ChatResponse> {
  if (!geminiClient) {
    throw new Error("Gemini API key not configured");
  }

  const response = await geminiClient.models.generateContent({
    model: "gemini-2.5-flash",
    contents: message,
  });

  const text = response.text || "";

  return {
    message: text,
    model: "gemini-2.5-flash",
  };
}

// Helper function to call DeepSeek
async function callDeepSeek(message: string): Promise<ChatResponse> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DeepSeek API key not configured");
  }

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "DeepSeek API request failed");
  }

  const data = await response.json();
  return {
    message: data.choices[0].message.content,
    model: "deepseek-chat",
    tokensUsed: data.usage?.total_tokens,
  };
}

// Helper function to call Groq
async function callGroq(message: string): Promise<ChatResponse> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile", // Free tier model
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Groq API request failed");
  }

  const data = await response.json();
  return {
    message: data.choices[0].message.content,
    model: "llama-3.3-70b-versatile",
    tokensUsed: data.usage?.total_tokens,
  };
}

// Validation middleware
const validateChatRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { message, model } = req.body as ChatRequest;

  if (!message || typeof message !== "string") {
    res.status(400).json({
      error: "Invalid request",
      details: "Message must be a non-empty string",
    } as ErrorResponse);
    return;
  }

  if (message.trim().length === 0) {
    res.status(400).json({
      error: "Invalid request",
      details: "Message cannot be empty",
    } as ErrorResponse);
    return;
  }

  if (message.length > 10000) {
    res.status(400).json({
      error: "Invalid request",
      details: "Message is too long (max 10000 characters)",
    } as ErrorResponse);
    return;
  }

  if (model && !["gemini", "deepseek", "groq"].includes(model)) {
    res.status(400).json({
      error: "Invalid request",
      details: "Model must be one of: gemini, deepseek, groq",
    } as ErrorResponse);
    return;
  }

  next();
};

// Get available models endpoint
app.get("/api/models", (_req: Request, res: Response) => {
  const available: string[] = [];
  if (GEMINI_API_KEY) available.push("gemini");
  if (DEEPSEEK_API_KEY) available.push("deepseek");
  if (GROQ_API_KEY) available.push("groq");

  res.json({
    available,
    default: available[0],
  } as AvailableModelsResponse);
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    models: {
      gemini: !!GEMINI_API_KEY,
      deepseek: !!DEEPSEEK_API_KEY,
      groq: !!GROQ_API_KEY,
    },
  });
});

// Chat endpoint with model selection and auto-fallback
app.post(
  "/api/chat",
  validateChatRequest,
  async (req: Request, res: Response): Promise<void> => {
    const { message, model } = req.body as ChatRequest;

    // Determine which model to use
    let preferredModel = model;
    if (!preferredModel) {
      // Auto-select first available model
      if (GEMINI_API_KEY) preferredModel = "gemini";
      else if (DEEPSEEK_API_KEY) preferredModel = "deepseek";
      else if (GROQ_API_KEY) preferredModel = "groq";
    }

    const tryModels = [preferredModel];

    // Add fallback models
    if (preferredModel === "gemini") {
      if (DEEPSEEK_API_KEY) tryModels.push("deepseek");
      if (GROQ_API_KEY) tryModels.push("groq");
    } else if (preferredModel === "deepseek") {
      if (GEMINI_API_KEY) tryModels.push("gemini");
      if (GROQ_API_KEY) tryModels.push("groq");
    } else if (preferredModel === "groq") {
      if (GEMINI_API_KEY) tryModels.push("gemini");
      if (DEEPSEEK_API_KEY) tryModels.push("deepseek");
    }

    let lastError: any = null;

    // Try each model in order
    for (const modelToTry of tryModels) {
      try {
        let result: ChatResponse;

        switch (modelToTry) {
          case "gemini":
            result = await callGemini(message);
            break;
          case "deepseek":
            result = await callDeepSeek(message);
            break;
          case "groq":
            result = await callGroq(message);
            break;
          default:
            continue;
        }

        res.json(result);
        return;
      } catch (error: any) {
        console.error(`${modelToTry} API Error:`, {
          message: error.message,
          status: error.status,
        });
        lastError = error;

        // If rate limited, try next model
        if (error.status === 429 || error.message?.includes("rate limit")) {
          console.log(`${modelToTry} rate limited, trying fallback...`);
          continue;
        }

        // For other errors, stop trying
        break;
      }
    }

    // All models failed
    console.error("All models failed:", lastError);

    if (lastError?.status === 429 || lastError?.message?.includes("rate limit")) {
      res.status(429).json({
        error: "Rate limit exceeded on all models",
        details: "Please try again later",
      } as ErrorResponse);
      return;
    }

    res.status(500).json({
      error: "AI response failed",
      details:
        process.env.NODE_ENV === "development"
          ? lastError?.message
          : "An unexpected error occurred",
    } as ErrorResponse);
  }
);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    details: "The requested endpoint does not exist",
  } as ErrorResponse);
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    details:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
  } as ErrorResponse);
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Available models: http://localhost:${port}/api/models`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("Configured models:");
  if (GEMINI_API_KEY) console.log("Using Gemini");
  if (DEEPSEEK_API_KEY) console.log("Using DeepSeek");
  if (GROQ_API_KEY) console.log("Using Groq");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});