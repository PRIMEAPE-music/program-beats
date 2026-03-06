import { Router, Request, Response } from "express";
import { generatePatterns, refinePattern, suggestArrangement, generateFullSong, getMixingSuggestions } from "./claude";

const router = Router();

router.post("/api/generate", async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "prompt is required and must be a string" });
      return;
    }

    const result = await generatePatterns(prompt, context);
    res.json(result);
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Failed to generate patterns" });
  }
});

router.post("/api/refine", async (req: Request, res: Response) => {
  try {
    const { prompt, currentPattern, trackType } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "prompt is required and must be a string" });
      return;
    }
    if (!currentPattern || typeof currentPattern !== "string") {
      res.status(400).json({ error: "currentPattern is required and must be a string" });
      return;
    }
    if (!trackType || typeof trackType !== "string") {
      res.status(400).json({ error: "trackType is required and must be a string" });
      return;
    }

    const result = await refinePattern(prompt, currentPattern, trackType);
    res.json(result);
  } catch (err) {
    console.error("Refine error:", err);
    res.status(500).json({ error: "Failed to refine pattern" });
  }
});

router.post("/api/suggest-arrangement", async (req: Request, res: Response) => {
  try {
    const { tracks, sections } = req.body;

    if (!tracks || !Array.isArray(tracks)) {
      res.status(400).json({ error: "tracks is required and must be an array" });
      return;
    }
    if (!sections || !Array.isArray(sections)) {
      res.status(400).json({ error: "sections is required and must be an array" });
      return;
    }

    const result = await suggestArrangement(tracks, sections);
    res.json(result);
  } catch (err) {
    console.error("Suggest arrangement error:", err);
    res.status(500).json({ error: "Failed to suggest arrangement" });
  }
});

router.post("/api/generate-song", async (req: Request, res: Response) => {
  try {
    const { prompt, config } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "prompt is required and must be a string" });
      return;
    }
    if (!config || typeof config !== "object") {
      res.status(400).json({ error: "config is required and must be an object" });
      return;
    }
    if (!config.bpm || typeof config.bpm !== "number") {
      res.status(400).json({ error: "config.bpm is required and must be a number" });
      return;
    }
    if (!config.sectionNames || !Array.isArray(config.sectionNames)) {
      res.status(400).json({ error: "config.sectionNames is required and must be an array" });
      return;
    }

    const result = await generateFullSong(prompt, config);
    res.json(result);
  } catch (err) {
    console.error("Generate song error:", err);
    res.status(500).json({ error: "Failed to generate full song" });
  }
});

router.post("/api/mixing-suggestions", async (req: Request, res: Response) => {
  try {
    const { tracks } = req.body;

    if (!tracks || !Array.isArray(tracks)) {
      res.status(400).json({ error: "tracks is required and must be an array" });
      return;
    }

    const result = await getMixingSuggestions(tracks);
    res.json(result);
  } catch (err) {
    console.error("Mixing suggestions error:", err);
    res.status(500).json({ error: "Failed to get mixing suggestions" });
  }
});

export default router;
