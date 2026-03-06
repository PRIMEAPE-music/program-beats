import { getClient } from "./ai-provider";

const SYSTEM_PROMPT = `You are an expert music producer and live-coding musician who generates Strudel (TidalCycles for the browser) patterns. You deeply understand music theory — scales, chords, rhythm, arrangement — and you translate musical ideas into valid Strudel mini-notation code.

## RULES
1. ONLY output valid Strudel code. Every pattern must be runnable in Strudel without modification.
2. Respond ONLY with JSON. No markdown fences, no explanation text outside JSON.
3. Your JSON response must have this exact shape:
   {
     "patterns": [
       {
         "trackType": "drums" | "bass" | "melody" | "chords" | "fx" | "custom",
         "pattern": "<valid Strudel code>",
         "description": "<short musical description>"
       }
     ]
   }

## STRUDEL SYNTAX REFERENCE

### Drums
Use \`s()\` with sample names. Common drum samples: bd (kick), sd (snare), hh (hihat), oh (open hat), cp (clap), cb (cowbell), rim (rimshot), lt/mt/ht (toms), cr (crash), ride.

Examples:
- Basic beat: \`s("bd sd bd sd")\`
- Four-on-the-floor: \`s("bd*4, ~ sd ~ sd, hh*8")\`
- Complex beat: \`stack(s("bd*2 bd, sd:1 ~ sd:0 ~, hh*8").gain(0.8))\`
- Breakbeat: \`s("bd ~ bd ~, ~ sd ~ sd:2, hh*8 oh").gain(0.8)\`
- With variation: \`s("bd [~ bd] ~ bd, sd ~ sd ~, [hh hh] hh [hh oh] hh").gain(0.7)\`

### Bass
Use \`note()\` with .sound() for synth type. Use lowercase note names with octave numbers.

Examples:
- Simple bass: \`note("c2 c2 eb2 f2").sound("sawtooth").lpf(800)\`
- Sub bass: \`note("<c1 f1 g1 ab1>").sound("sine").gain(0.9)\`
- Synth bass: \`note("<c2 eb2 f2 g2>*2").sound("sawtooth").lpf(800)\`
- Acid bass: \`note("c2 c3 eb2 g2").sound("sawtooth").lpf(sine.range(200, 2000)).lpq(8)\`

### Melody
Use \`note()\` with .sound() and optional effects.

Examples:
- Simple melody: \`note("c4 eb4 g4 bb4").sound("triangle").delay(0.3)\`
- Arp melody: \`note("c4 [eb4 g4] bb4 g4").sound("triangle").delay(0.2).room(0.4)\`
- Lead: \`note("c5 ~ eb5 g5 ~ bb5 g5 ~").sound("sawtooth").lpf(3000).gain(0.5)\`

### Chords
Use \`note()\` with chord names or stacked notes.

Examples:
- Chord progression: \`note("<Cm7 Fm7 Gm7 Cm7>").sound("piano").gain(0.5)\`
- Pad chords: \`note("<Cm7 Ab7 Fm7 G7>").sound("sawtooth").lpf(1200).gain(0.4).room(0.5)\`
- Stabs: \`note("<Cm Fm Gm Cm>/4").sound("piano").gain(0.6)\`

### FX / Textures
- Noise sweep: \`s("hh*16").gain(sine.range(0, 0.3)).lpf(sine.range(200, 8000))\`
- Ambient: \`note("c5 g5 eb6").sound("sine").delay(0.6).room(0.8).gain(0.2)\`
- Riser: \`note("c3").sound("sawtooth").lpf(sine.slow(4).range(200, 8000)).gain(0.3)\`

## STRUDEL OPERATORS & MODIFIERS
- \`*N\` — repeat N times per cycle
- \`/N\` — play once every N cycles
- \`<a b c>\` — alternate each cycle (slow sequence)
- \`[a b]\` — subdivide within a step
- \`~\` — rest / silence
- \`,\` — layer (play simultaneously in a stack)
- \`.gain(n)\` — volume 0-1
- \`.lpf(n)\` — low-pass filter frequency
- \`.hpf(n)\` — high-pass filter frequency
- \`.delay(n)\` — delay amount 0-1
- \`.room(n)\` — reverb amount 0-1
- \`.pan(n)\` — stereo panning 0-1
- \`.speed(n)\` — playback speed
- \`.lpq(n)\` — filter resonance
- \`stack()\` — layer multiple patterns

## MUSIC THEORY GUIDELINES
- Stay in key. If a key is implied or requested, ensure all notes belong to that scale.
- For minor keys use natural minor (aeolian) unless otherwise requested.
- Common minor chords: Cm, Dm, Em, Fm, Gm, Am, Bm (and 7th variants).
- Keep bass in octaves 1-2, melody in 4-5, chords in 3-4.
- Rhythmically complement other tracks — don't have everything play on beat 1.

When given context about existing tracks, generate patterns that musically complement them (same key, compatible rhythm, good counterpoint).`;

interface GenerateContext {
  bpm: number;
  existingTracks: { name: string; type: string; pattern: string }[];
  genre?: string;
}

interface PatternResult {
  patterns: {
    trackType: string;
    pattern: string;
    description: string;
  }[];
}

function buildContextBlock(context?: GenerateContext): string {
  if (!context) return "";

  let block = `\n\nCurrent project context:`;
  block += `\n- BPM: ${context.bpm}`;
  if (context.genre) {
    block += `\n- Genre: ${context.genre}`;
  }
  if (context.existingTracks && context.existingTracks.length > 0) {
    block += `\n- Existing tracks:`;
    for (const t of context.existingTracks) {
      block += `\n  - ${t.name} (${t.type}): ${t.pattern}`;
    }
  }
  return block;
}

function parseResponse(text: string): PatternResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in AI response");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.patterns || !Array.isArray(parsed.patterns)) {
    throw new Error("Response missing 'patterns' array");
  }
  return parsed as PatternResult;
}

export async function generatePatterns(
  prompt: string,
  context?: GenerateContext
): Promise<PatternResult> {
  const contextBlock = buildContextBlock(context);
  const client = getClient();

  const response = await client.generate({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${prompt}${contextBlock}`,
    maxTokens: 1024,
  });

  return parseResponse(response.text);
}

export async function refinePattern(
  prompt: string,
  currentPattern: string,
  trackType: string
): Promise<PatternResult> {
  const client = getClient();

  const response = await client.generate({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `I have an existing ${trackType} pattern:\n\`${currentPattern}\`\n\nPlease refine it with this request: ${prompt}\n\nReturn the refined version as JSON with a single pattern in the patterns array, keeping trackType as "${trackType}".`,
    maxTokens: 1024,
  });

  return parseResponse(response.text);
}

export interface FullSongConfig {
  bpm: number;
  totalBars: number;
  sectionNames: string[];
  scaleRoot?: string;
  scaleName?: string;
}

export interface FullSongResult {
  sections: Array<{
    name: string;
    patterns: Array<{
      trackType: string;
      pattern: string;
      description: string;
    }>;
  }>;
}

export async function generateFullSong(
  prompt: string,
  config: FullSongConfig
): Promise<FullSongResult> {
  const scaleInfo = config.scaleRoot && config.scaleName
    ? `${config.scaleRoot} ${config.scaleName}`
    : "your choice of key";

  const client = getClient();

  const response = await client.generate({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Generate a FULL SONG with the following specifications:

Prompt: ${prompt}
BPM: ${config.bpm}
Key: ${scaleInfo}
Total bars: ${config.totalBars}
Sections: ${config.sectionNames.join(", ")}

For EACH section, generate patterns for these track types: drums, bass, melody, chords, fx.
Each section should have DISTINCT variations — for example, the verse should be sparser than the chorus, the intro should build up, the bridge should contrast, and the outro should wind down.

IMPORTANT: Respond ONLY with JSON in this exact shape:
{
  "sections": [
    {
      "name": "Section Name",
      "patterns": [
        {
          "trackType": "drums" | "bass" | "melody" | "chords" | "fx",
          "pattern": "<valid Strudel code>",
          "description": "<short musical description>"
        }
      ]
    }
  ]
}

Make sure every pattern is valid Strudel code. Create musically cohesive patterns that work together and vary meaningfully across sections.`,
    maxTokens: 4096,
  });

  const jsonMatch = response.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in AI response");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error("Response missing 'sections' array");
  }
  return parsed as FullSongResult;
}

export interface MixingSuggestionsResult {
  suggestions: Array<{
    trackName: string;
    issue: string;
    fix: string;
    fixPattern?: string;
  }>;
}

export async function getMixingSuggestions(
  tracks: Array<{ name: string; type: string; pattern: string; effects: any }>
): Promise<MixingSuggestionsResult> {
  const trackList = tracks
    .map(
      (t) =>
        `- ${t.name} (${t.type}): pattern="${t.pattern}", effects=${JSON.stringify(t.effects)}`
    )
    .join("\n");

  const client = getClient();

  const response = await client.generate({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Analyze the following mix and suggest improvements. Look for issues like:
- Frequency clashes between tracks
- Missing frequency ranges
- Patterns that don't complement each other rhythmically
- Effects that could be improved
- Volume/gain balancing issues
- Suggestions for additional patterns or variations

Current tracks:
${trackList}

IMPORTANT: Respond ONLY with JSON in this exact shape:
{
  "suggestions": [
    {
      "trackName": "<name of the track>",
      "issue": "<description of the issue>",
      "fix": "<description of the suggested fix>",
      "fixPattern": "<optional: a corrected Strudel pattern if applicable>"
    }
  ]
}

Provide 3-6 actionable suggestions. If you include a fixPattern, it must be valid Strudel code.`,
    maxTokens: 2048,
  });

  const jsonMatch = response.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in AI response");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
    throw new Error("Response missing 'suggestions' array");
  }
  return parsed as MixingSuggestionsResult;
}

export async function suggestArrangement(
  tracks: { name: string; type: string; pattern: string }[],
  sections: string[]
): Promise<PatternResult> {
  const trackList = tracks
    .map((t) => `- ${t.name} (${t.type}): ${t.pattern}`)
    .join("\n");

  const client = getClient();

  const response = await client.generate({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `I have these tracks:\n${trackList}\n\nI need arrangement suggestions for these sections: ${sections.join(", ")}.\n\nFor each section, suggest pattern variations for each track. Return JSON where the patterns array contains one entry per track per section, with the description indicating which section it belongs to. For example, a description might be "Verse - muted kick, hihats only" or "Chorus - full beat with fills".`,
    maxTokens: 2048,
  });

  return parseResponse(response.text);
}
