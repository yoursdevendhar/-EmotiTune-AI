import { useState, useEffect, useRef, useCallback } from "react";

// ─── GROK API CONFIG ──────────────────────────────────────────────────────────
const GROK_API_KEY = "YOUR_GROK_API_KEY"; // 🔑 Replace with your xAI Grok API key
const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
const GROK_MODEL   = "grok-3";            // or "grok-3-mini" for faster/cheaper

// ─── Palette & Theme ─────────────────────────────────────────────────────────
const PALETTE = {
  bg: "#04050f",
  bgCard: "rgba(12,14,30,0.85)",
  bgGlass: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#7c5cfc",
  accentSoft: "#a78bfa",
  accentGlow: "#7c5cfc55",
  cyan: "#22d3ee",
  pink: "#f472b6",
  gold: "#fbbf24",
  green: "#34d399",
  text: "#f0f0ff",
  textMuted: "#8888aa",
};

const EMOTION_MAP = {
  happiness:  { color: "#fbbf24", glow: "#fbbf2466", emoji: "☀️", label: "Happiness" },
  sadness:    { color: "#60a5fa", glow: "#60a5fa55", emoji: "🌧️", label: "Sadness" },
  stress:     { color: "#f87171", glow: "#f8717155", emoji: "⚡", label: "Stress" },
  anxiety:    { color: "#fb923c", glow: "#fb923c55", emoji: "🌀", label: "Anxiety" },
  calmness:   { color: "#34d399", glow: "#34d39955", emoji: "🌿", label: "Calmness" },
  loneliness: { color: "#818cf8", glow: "#818cf855", emoji: "🌌", label: "Loneliness" },
  excitement: { color: "#f472b6", glow: "#f472b655", emoji: "🎉", label: "Excitement" },
  motivation: { color: "#22d3ee", glow: "#22d3ee55", emoji: "🚀", label: "Motivation" },
  anger:      { color: "#ef4444", glow: "#ef444455", emoji: "🔥", label: "Anger" },
};

const MODES = [
  { id: "focus",      icon: "🎯", label: "Focus",    color: "#22d3ee" },
  { id: "sleep",      icon: "🌙", label: "Sleep",    color: "#818cf8" },
  { id: "meditation", icon: "🧘", label: "Meditate", color: "#34d399" },
  { id: "workout",    icon: "💪", label: "Workout",  color: "#ef4444" },
  { id: "study",      icon: "📚", label: "Study",    color: "#fbbf24" },
  { id: "relax",      icon: "🌊", label: "Relax",    color: "#60a5fa" },
];

// ─── Web Audio / Tone.js Config ───────────────────────────────────────────────
const EMOTION_SONGS = {
  happiness: {
    bpm: 118, key: "C", scale: "major",
    label: "Upbeat Pop Piano",
    chords:   [["C4","E4","G4"],["F4","A4","C5"],["G4","B4","D5"],["A4","C5","E5"]],
    melody:   ["E5","G5","A5","G5","E5","C5","D5","E5","C5","A4","B4","C5"],
    bass:     ["C2","F2","G2","A2"],
    melodyDur:["8n","8n","4n","8n","8n","4n","8n","8n","4n","8n","8n","2n"],
    chordDur: "2n", padWave: "triangle",
    drumPattern: { kick:[0,8], snare:[4,12], hihat:[0,2,4,6,8,10,12,14] },
    reverb: 1.5, hasStrings: true, hasDrums: true,
  },
  sadness: {
    bpm: 54, key: "A", scale: "minor",
    label: "Emotional Piano Ballad",
    chords:   [["A3","C4","E4"],["F3","A3","C4"],["G3","B3","D4"],["E3","G3","B3"]],
    melody:   ["A4","G4","E4","D4","C4","E4","A4","B4","A4","G4","F4","E4"],
    bass:     ["A2","F2","G2","E2"],
    melodyDur:["4n","4n","2n","4n","4n","2n","4n","4n","2n","4n","4n","1n"],
    chordDur: "1n", padWave: "sine",
    drumPattern: { kick:[0], snare:[], hihat:[0,4,8,12] },
    reverb: 4.0, hasStrings: true, hasDrums: false,
  },
  calmness: {
    bpm: 62, key: "F", scale: "major",
    label: "Peaceful Ambient Guitar",
    chords:   [["F3","A3","C4"],["C4","E4","G4"],["G3","B3","D4"],["F3","A3","C4"]],
    melody:   ["C5","A4","F4","G4","A4","C5","F5","E5","D5","C5","A4","F4"],
    bass:     ["F2","C2","G2","F2"],
    melodyDur:["4n","4n","2n","4n","4n","2n","4n","4n","2n","4n","4n","1n"],
    chordDur: "1n", padWave: "sine",
    drumPattern: { kick:[0], snare:[], hihat:[0,4,8,12] },
    reverb: 5.0, hasStrings: true, hasDrums: false,
  },
  anxiety: {
    bpm: 138, key: "D", scale: "minor",
    label: "Tense Electronic Pulse",
    chords:   [["D3","F3","A3"],["Bb2","D3","F3"],["A2","C3","E3"],["G2","Bb2","D3"]],
    melody:   ["D4","F4","A4","Bb4","A4","G4","F4","E4","D4","C4","D4","F4"],
    bass:     ["D2","Bb1","A1","G1"],
    melodyDur:["16n","16n","8n","16n","16n","8n","16n","16n","8n","8n","8n","4n"],
    chordDur: "4n", padWave: "sawtooth",
    drumPattern: { kick:[0,4,6,8,12,14], snare:[4,12], hihat:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
    reverb: 0.8, hasStrings: false, hasDrums: true,
  },
  stress: {
    bpm: 155, key: "E", scale: "minor",
    label: "Driving Rock Beat",
    chords:   [["E3","G3","B3"],["D3","F3","A3"],["C3","E3","G3"],["B2","D3","F3"]],
    melody:   ["E5","B4","G4","A4","B4","E5","D5","B4","G4","A4","G4","E4"],
    bass:     ["E2","D2","C2","B1"],
    melodyDur:["8n","8n","8n","8n","4n","8n","8n","8n","8n","4n","8n","4n"],
    chordDur: "4n", padWave: "square",
    drumPattern: { kick:[0,3,6,8,11,14], snare:[4,12], hihat:[0,2,4,6,8,10,12,14] },
    reverb: 0.5, hasStrings: false, hasDrums: true,
  },
  loneliness: {
    bpm: 46, key: "G", scale: "minor",
    label: "Cinematic String Elegy",
    chords:   [["G3","Bb3","D4"],["Eb3","G3","Bb3"],["F3","A3","C4"],["D3","F3","A3"]],
    melody:   ["G4","F4","Eb4","D4","C4","D4","G4","Bb4","A4","G4","F4","Eb4"],
    bass:     ["G2","Eb2","F2","D2"],
    melodyDur:["2n","2n","1n","2n","2n","1n","2n","2n","1n","2n","2n","1n"],
    chordDur: "1n", padWave: "sine",
    drumPattern: { kick:[0], snare:[], hihat:[] },
    reverb: 6.0, hasStrings: true, hasDrums: false,
  },
  excitement: {
    bpm: 148, key: "E", scale: "major",
    label: "Festival EDM Drop",
    chords:   [["E3","G#3","B3"],["A3","C#4","E4"],["B3","D#4","F#4"],["C#4","E4","G#4"]],
    melody:   ["E5","F#5","G#5","B5","A5","G#5","F#5","E5","B4","C#5","D#5","E5"],
    bass:     ["E2","A2","B2","C#2"],
    melodyDur:["8n","8n","8n","4n","8n","8n","8n","4n","8n","8n","8n","4n"],
    chordDur: "4n", padWave: "sawtooth",
    drumPattern: { kick:[0,4,8,12], snare:[4,12], hihat:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
    reverb: 2.0, hasStrings: false, hasDrums: true,
  },
  motivation: {
    bpm: 126, key: "C", scale: "major",
    label: "Epic Orchestral Anthem",
    chords:   [["C4","E4","G4"],["A3","C4","E4"],["F3","A3","C4"],["G3","B3","D4"]],
    melody:   ["C5","E5","G5","A5","G5","E5","F5","G5","E5","C5","D5","E5"],
    bass:     ["C2","A1","F1","G1"],
    melodyDur:["4n","4n","4n","2n","4n","4n","4n","2n","4n","4n","4n","2n"],
    chordDur: "2n", padWave: "triangle",
    drumPattern: { kick:[0,6,8,14], snare:[4,12], hihat:[0,2,4,6,8,10,12,14] },
    reverb: 3.0, hasStrings: true, hasDrums: true,
  },
  anger: {
    bpm: 168, key: "D", scale: "minor",
    label: "Heavy Metal Riff",
    chords:   [["D3","F3","A3"],["C3","Eb3","G3"],["Bb2","D3","F3"],["A2","C3","E3"]],
    melody:   ["D4","D4","F4","D4","C4","Bb3","A3","Bb3","C4","D4","F4","A4"],
    bass:     ["D2","C2","Bb1","A1"],
    melodyDur:["8n","16n","8n","16n","8n","8n","4n","8n","8n","8n","8n","4n"],
    chordDur: "4n", padWave: "sawtooth",
    drumPattern: { kick:[0,2,4,6,8,9,10,12,14,15], snare:[4,12], hihat:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
    reverb: 0.3, hasStrings: false, hasDrums: true,
  },
};

let Tone = null;
async function loadTone() {
  if (Tone) return Tone;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js";
    s.onload = () => { Tone = window.Tone; resolve(Tone); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

class EmotionSoundEngine {
  constructor() {
    this.parts = []; this.synths = []; this.running = false; this.analyser = null;
  }
  async start(emotion) {
    await this.stop();
    await loadTone();
    await Tone.start();
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    const song = EMOTION_SONGS[emotion] || EMOTION_SONGS.calmness;
    Tone.getTransport().bpm.value = song.bpm;
    const reverb = new Tone.Reverb({ decay: song.reverb, wet: Math.min(song.reverb / 8, 0.65) }).toDestination();
    await reverb.generate();
    const master = new Tone.Volume(-6).connect(reverb);
    this.synths.push(reverb, master);
    this.analyser = new Tone.Analyser("waveform", 128);
    master.connect(this.analyser);
    const piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 1.4 }, volume: -8,
    }).connect(master);
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: song.padWave === "sawtooth" ? "sawtooth" : "sine" },
      envelope: { attack: 0.6, decay: 0.8, sustain: 0.7, release: 2.5 }, volume: -18,
    }).connect(master);
    const bass = new Tone.MonoSynth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.8 },
      filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8, baseFrequency: 80, octaves: 3 }, volume: -10,
    }).connect(master);
    let strings = null;
    if (song.hasStrings) {
      strings = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 1.2, decay: 0.5, sustain: 0.8, release: 2.0 }, volume: -22,
      });
      const strFilter = new Tone.Filter(1200, "lowpass").connect(master);
      strings.connect(strFilter);
      this.synths.push(strings, strFilter);
    }
    this.synths.push(piano, pad, bass);
    let kick = null, snare = null, hihat = null;
    if (song.hasDrums) {
      const drumDist = new Tone.Distortion(0.15).connect(master);
      kick = new Tone.MembraneSynth({ pitchDecay: 0.07, octaves: 8, volume: -10, envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.1 } }).connect(drumDist);
      snare = new Tone.NoiseSynth({ noise: { type: "white" }, volume: -16, envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.08 } }).connect(drumDist);
      hihat = new Tone.MetalSynth({ frequency: 400, harmonicity: 5.1, modulationIndex: 32, volume: -28, envelope: { attack: 0.001, decay: 0.06, release: 0.01 } }).connect(drumDist);
      this.synths.push(kick, snare, hihat, drumDist);
    }
    let melodyTime = 0;
    const melPart = new Tone.Part((time, note) => { piano.triggerAttackRelease(note.pitch, note.dur, time); },
      song.melody.map((pitch, i) => ({
        time: melodyTime += (i === 0 ? 0 : Tone.Time(song.melodyDur[i - 1] || "4n").toSeconds()), pitch, dur: song.melodyDur[i] || "4n",
      })));
    melPart.loop = true; melPart.loopEnd = "8m"; melPart.start(0);
    this.parts.push(melPart);
    const chordPart = new Tone.Sequence((time, chord) => {
      if (chord) { pad.triggerAttackRelease(chord, song.chordDur, time); if (strings) strings.triggerAttackRelease(chord, song.chordDur, time); }
    }, song.chords, "2m");
    chordPart.loop = true; chordPart.start(0); this.parts.push(chordPart);
    const bassPart = new Tone.Sequence((time, note) => { if (note) bass.triggerAttackRelease(note, "4n", time); }, song.bass, "2m");
    bassPart.loop = true; bassPart.start(0); this.parts.push(bassPart);
    if (song.hasDrums && kick && snare && hihat) {
      const steps = 16;
      const kickSeq = new Tone.Sequence((time, step) => { if (song.drumPattern.kick.includes(step)) kick.triggerAttackRelease("C1", "8n", time); }, Array.from({ length: steps }, (_, i) => i), "8n");
      const snareSeq = new Tone.Sequence((time, step) => { if (song.drumPattern.snare.includes(step)) snare.triggerAttackRelease("8n", time); }, Array.from({ length: steps }, (_, i) => i), "8n");
      const hihatSeq = new Tone.Sequence((time, step) => { if (song.drumPattern.hihat.includes(step)) hihat.triggerAttackRelease("C6", "32n", time); }, Array.from({ length: steps }, (_, i) => i), "8n");
      kickSeq.start(0); snareSeq.start(0); hihatSeq.start(0);
      this.parts.push(kickSeq, snareSeq, hihatSeq);
    }
    Tone.getTransport().start();
    this.running = true;
  }
  async stop() {
    if (Tone) { Tone.getTransport().stop(); Tone.getTransport().cancel(); }
    this.parts.forEach(p => { try { p.stop(); p.dispose(); } catch (_) {} });
    this.synths.forEach(s => { try { s.dispose(); } catch (_) {} });
    this.parts = []; this.synths = []; this.analyser = null; this.running = false;
  }
  setVolume(pct) { if (!Tone || !this.running) return; Tone.getDestination().volume.rampTo(Tone.gainToDb(pct / 100), 0.1); }
  getWaveform() { if (!this.analyser) return new Float32Array(128).fill(0); return this.analyser.getValue(); }
}

const audioEngine = new EmotionSoundEngine();

// ─── GROK API Helper ──────────────────────────────────────────────────────────
// Grok uses an OpenAI-compatible API format (chat/completions endpoint)
async function callGrok(messages, systemPrompt) {
  const res = await fetch(GROK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROK_API_KEY}`,   // xAI Bearer token auth
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },  // System prompt as first message
        ...messages,                                 // Followed by conversation history
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  // Grok/OpenAI format: choices[0].message.content
  return data.choices?.[0]?.message?.content || "";
}

// ─── AI Feature Helpers (same logic, now via Grok) ────────────────────────────
async function analyzeEmotion(text) {
  const raw = await callGrok(
    [{ role: "user", content: `Analyze the emotion in this text: "${text}"` }],
    `You are an emotion analysis AI. Respond ONLY with valid JSON (no markdown, no backticks):
{"primary":"<one of: happiness,sadness,stress,anxiety,calmness,loneliness,excitement,motivation,anger>","secondary":"<emotion or null>","intensity":<0-100>,"energy":<0-100>,"sentiment":<-1 to 1>,"balance":<0-100>,"description":"<1 sentence poetic description>","genre":"<music genre>","tempo":"<Slow/Medium/Fast>","instruments":["<instrument1>","<instrument2>","<instrument3>"],"atmosphere":"<1 vivid sentence describing the sonic mood>"}`
  );
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { primary:"calmness",secondary:null,intensity:50,energy:50,sentiment:0,balance:70,
      description:"A gentle emotional state.",genre:"Ambient",tempo:"Medium",
      instruments:["Piano","Strings","Flute"],atmosphere:"Soft and peaceful sonic landscape." };
  }
}

const SONG_TYPES = [
  { id:"pop",       label:"Pop Song",         icon:"🎤", color:"#f472b6", structure:"[Verse 1] → [Pre-Chorus] → [Chorus] → [Verse 2] → [Pre-Chorus] → [Chorus] → [Bridge] → [Chorus]", description:"Catchy hooks, radio-ready" },
  { id:"rap",       label:"Rap / Hip-Hop",    icon:"🎧", color:"#fbbf24", structure:"[Intro] → [Verse 1] → [Hook] → [Verse 2] → [Hook] → [Outro]", description:"Bars, flow, and punch" },
  { id:"rnb",       label:"R&B / Soul",       icon:"🎷", color:"#a78bfa", structure:"[Verse 1] → [Chorus] → [Verse 2] → [Chorus] → [Bridge] → [Chorus]", description:"Soulful grooves and emotion" },
  { id:"ballad",    label:"Ballad",           icon:"🎹", color:"#60a5fa", structure:"[Verse 1] → [Chorus] → [Verse 2] → [Chorus] → [Bridge] → [Final Chorus]", description:"Slow, emotional, cinematic" },
  { id:"lofi",      label:"Lo-Fi / Chill",   icon:"🌙", color:"#34d399", structure:"[Intro] → [Verse 1] → [Verse 2] → [Outro]", description:"Mellow, rainy day vibes" },
  { id:"edm",       label:"EDM / Dance",      icon:"⚡", color:"#22d3ee", structure:"[Intro] → [Build] → [Drop] → [Break] → [Build] → [Drop] → [Outro]", description:"Euphoric drops and energy" },
  { id:"rock",      label:"Rock / Alt",       icon:"🎸", color:"#ef4444", structure:"[Intro] → [Verse 1] → [Chorus] → [Verse 2] → [Chorus] → [Guitar Solo] → [Chorus] → [Outro]", description:"Raw, loud, anthemic" },
  { id:"cinematic", label:"Cinematic / Epic", icon:"🎬", color:"#fb923c", structure:"[Opening Theme] → [Rising Action] → [Climax] → [Emotional Peak] → [Resolution]", description:"Orchestral, movie-score feel" },
];

async function generateLyrics(emotion, songTypeId, mode) {
  const songType = SONG_TYPES.find(s => s.id === songTypeId) || SONG_TYPES[0];
  return callGrok(
    [{ role: "user", content: `Write a complete ${songType.label} song about the emotion: "${emotion}"${mode ? ` in ${mode} mode` : ""}.` }],
    `You are a Grammy-winning songwriter and lyricist. Write a FULL, COMPLETE song with EVERY section labeled.
Song Type: ${songType.label} | Emotion: ${emotion}${mode ? ` | Mode: ${mode}` : ""}
Structure: ${songType.structure}
RULES: Label every section [like this]. Write 4-8 lines per section (rap: 8-16 lines). Make the chorus/hook incredibly catchy. Include title as: 🎵 TITLE: "Your Song Title Here". Add: Genre: ${songType.label} | Emotion: ${emotion} | BPM hint: (suggest BPM). Return ONLY the song — no explanations.`
  );
}

async function chatWithCompanion(messages, emotion) {
  return callGrok(messages,
    `You are EmotiTune AI — a warm, emotionally intelligent music companion. The user is currently feeling: ${emotion}. Respond with empathy, offer gentle support, suggest music or activities. Keep responses concise (2-4 sentences). Be human, poetic, and uplifting.`
  );
}

async function analyzeMemory(text) {
  const raw = await callGrok(
    [{ role: "user", content: `Analyze this memory/journal entry: "${text}"` }],
    `You are an empathetic AI that reads diary entries. Respond ONLY with valid JSON:
{"emotion":"<primary emotion>","mood":"<evocative mood>","soundtrack":["<style1>","<style2>","<style3>"],"visual":"<cinematic scene>","message":"<warm 1-2 sentence response>"}`
  );
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { emotion:"loneliness",mood:"Bittersweet",soundtrack:["Soft Piano","Rain Ambience","Cello"],
      visual:"Golden hour through a window",message:"Your memories hold so much warmth." };
  }
}

// ─── UI Components ────────────────────────────────────────────────────────────
function LiveWaveform({ isPlaying, emotion, engine }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const em = EMOTION_MAP[emotion] || EMOTION_MAP.calmness;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      if (isPlaying && engine.analyser) {
        const raw = engine.getWaveform();
        ctx.beginPath(); ctx.strokeStyle = em.color; ctx.lineWidth = 2.5; ctx.shadowColor = em.color; ctx.shadowBlur = 14;
        const sliceW = W / raw.length;
        for (let i = 0; i < raw.length; i++) { const v = (raw[i] + 1) / 2; const y = v * H; i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * sliceW, y); }
        ctx.stroke();
        ctx.beginPath(); ctx.strokeStyle = em.color + "44"; ctx.lineWidth = 1; ctx.shadowBlur = 6;
        for (let i = 0; i < raw.length; i++) { const v = (raw[i] + 1) / 2; const y = H - v * H; i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * sliceW, y); }
        ctx.stroke();
      } else {
        const t = Date.now() / 1000;
        ctx.beginPath(); ctx.strokeStyle = em.color + "55"; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
        for (let x = 0; x < W; x++) { const y = H / 2 + Math.sin((x / W) * Math.PI * 5 + t * 1.2) * 5; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, emotion]);
  return <canvas ref={canvasRef} style={{ width: "100%", height: 80, display: "block", borderRadius: 8 }} />;
}

function AIOrb({ emotion, pulse }) {
  const em = EMOTION_MAP[emotion] || EMOTION_MAP.calmness;
  return (
    <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
      <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: `radial-gradient(circle, ${em.glow} 0%, transparent 70%)`, animation: pulse ? "orbPulse 1.5s ease-in-out infinite" : "orbFloat 3s ease-in-out infinite" }} />
      <div style={{ width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(135deg, ${em.color}cc 0%, ${em.color}44 40%, #1a1a3a 100%)`, border: `2px solid ${em.color}88`, boxShadow: `0 0 40px ${em.glow}, 0 0 80px ${em.glow}44, inset 0 0 30px ${em.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, animation: "orbFloat 3s ease-in-out infinite" }}>
        {em.emoji}
      </div>
    </div>
  );
}

function ParticleField({ emotion }) {
  const canvasRef = useRef(null);
  const em = EMOTION_MAP[emotion] || EMOTION_MAP.calmness;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;
    const particles = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, r: Math.random() * 3 + 1, alpha: Math.random() * 0.6 + 0.2 }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = em.color + Math.floor(p.alpha * 255).toString(16).padStart(2, "0"); ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [emotion]);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

function StatBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: PALETTE.textMuted }}>{label}</span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: "width 1s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 8px ${color}88` }} />
      </div>
    </div>
  );
}

function GlassCard({ children, style = {}, glow }) {
  return (
    <div style={{ background: PALETTE.bgCard, border: `1px solid ${glow ? glow + "44" : PALETTE.border}`, borderRadius: 20, padding: 24, backdropFilter: "blur(20px)", boxShadow: glow ? `0 0 30px ${glow}22, 0 4px 40px rgba(0,0,0,0.4)` : "0 4px 40px rgba(0,0,0,0.3)", position: "relative", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function Nav({ page, setPage }) {
  const items = [
    { id: "studio", icon: "🎵", label: "Studio" },
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "chat", icon: "🤖", label: "Companion" },
    { id: "memory", icon: "📖", label: "Memories" },
    { id: "lyrics", icon: "✍️", label: "Lyrics" },
  ];
  return (
    <nav style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "rgba(10,10,25,0.9)", border: `1px solid ${PALETTE.border}`, borderRadius: 40, padding: "10px 16px", backdropFilter: "blur(24px)", display: "flex", gap: 4, zIndex: 100, boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)" }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setPage(it.id)} style={{ background: page === it.id ? `linear-gradient(135deg, ${PALETTE.accent}, #a855f7)` : "transparent", border: "none", borderRadius: 30, padding: "8px 16px", color: page === it.id ? "#fff" : PALETTE.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s ease", boxShadow: page === it.id ? `0 0 20px ${PALETTE.accentGlow}` : "none" }}>
          <span>{it.icon}</span><span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Landing({ onEnter }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse at 30% 20%, #1a0a3a 0%, ${PALETTE.bg} 60%), radial-gradient(ellipse at 80% 80%, #0a2a1a 0%, transparent 50%)`, textAlign: "center", padding: 32 }}>
      <div style={{ marginBottom: 32, animation: "orbFloat 3s ease-in-out infinite" }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", margin: "0 auto", background: "radial-gradient(135deg, #a855f7 0%, #7c5cfc 40%, #1a1a3a 100%)", boxShadow: "0 0 60px #7c5cfc88, 0 0 120px #7c5cfc33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42 }}>🎵</div>
      </div>
      <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", fontWeight: 900, background: "linear-gradient(135deg, #fff 0%, #a78bfa 50%, #22d3ee 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-2px", marginBottom: 16, lineHeight: 1.1, fontFamily: "'Georgia', serif" }}>EmotiTune AI</h1>
      <p style={{ fontSize: "clamp(1rem, 3vw, 1.35rem)", color: PALETTE.textMuted, maxWidth: 560, lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>Transform your emotions into cinematic music, immersive visuals, and intelligent emotional experiences.</p>
      {/* Grok badge */}
      <div style={{ marginBottom: 32, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 16px" }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        <span style={{ fontSize: 13, color: PALETTE.textMuted }}>Powered by <strong style={{ color: PALETTE.text }}>Grok AI</strong> (xAI)</span>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
        {["🧠 AI Emotion Detection","🎸 Live Audio Synthesis","✨ Visual Immersion","💬 AI Companion"].map(f => (
          <span key={f} style={{ background: PALETTE.bgGlass, border: `1px solid ${PALETTE.border}`, borderRadius: 24, padding: "8px 18px", fontSize: 13, color: PALETTE.textMuted }}>{f}</span>
        ))}
      </div>
      <button onClick={onEnter} style={{ background: `linear-gradient(135deg, ${PALETTE.accent}, #a855f7, #22d3ee)`, border: "none", borderRadius: 50, padding: "18px 48px", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: `0 0 40px ${PALETTE.accentGlow}, 0 8px 32px rgba(0,0,0,0.4)`, letterSpacing: 1, transition: "transform 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        Enter the Experience ✦
      </button>
    </div>
  );
}

function EmotionStudio({ emotionData, setEmotionData, activeMode, setActiveMode }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [toneLoading, setToneLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!text.trim()) return;
    if (isPlaying) { await audioEngine.stop(); setIsPlaying(false); }
    setLoading(true); setError("");
    try {
      const data = await analyzeEmotion(text);
      setEmotionData(data);
    } catch (e) {
      setError("Grok API error. Check your API key in the GROK_API_KEY constant.");
      console.error(e);
    }
    setLoading(false);
  };

  const togglePlay = async () => {
    if (isPlaying) { await audioEngine.stop(); setIsPlaying(false); return; }
    if (!emotionData) return;
    setToneLoading(true);
    try { await audioEngine.start(emotionData.primary); audioEngine.setVolume(volume); setIsPlaying(true); }
    catch (e) { console.error("Audio start error:", e); }
    setToneLoading(false);
  };

  useEffect(() => { audioEngine.setVolume(volume); }, [volume]);
  useEffect(() => () => { audioEngine.stop(); }, []);

  const em = emotionData ? (EMOTION_MAP[emotionData.primary] || EMOTION_MAP.calmness) : EMOTION_MAP.calmness;

  return (
    <div style={{ padding: "0 0 120px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: PALETTE.text, marginBottom: 6 }}>🎵 Emotion Studio</h2>
        <p style={{ color: PALETTE.textMuted, fontSize: 14 }}>Tell me how you feel — I'll compose your real-time soundtrack</p>
        <p style={{ color: "#22d3ee", fontSize: 12, marginTop: 4 }}>⚡ Powered by Grok AI</p>
      </div>
      <div style={{ position: "relative", height: 180, marginBottom: 32 }}>
        <AIOrb emotion={emotionData?.primary || "calmness"} pulse={loading} />
        {emotionData && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ background: em.color + "22", border: `1px solid ${em.color}55`, borderRadius: 20, padding: "4px 16px", fontSize: 13, color: em.color, fontWeight: 700 }}>{em.emoji} {em.label}</span>
            {emotionData.secondary && <span style={{ marginLeft: 8, color: PALETTE.textMuted, fontSize: 12 }}>+ {emotionData.secondary}</span>}
          </div>
        )}
      </div>
      <GlassCard style={{ marginBottom: 16 }}>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="How are you feeling right now? Describe your emotions, day, or thoughts..."
          style={{ width: "100%", minHeight: 100, background: "rgba(255,255,255,0.03)", border: `1px solid ${PALETTE.border}`, borderRadius: 12, color: PALETTE.text, fontSize: 15, padding: 16, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
          onKeyDown={e => e.key === "Enter" && e.ctrlKey && analyze()} />
        {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>⚠️ {error}</p>}
        <button onClick={analyze} disabled={loading || !text.trim()} style={{ marginTop: 12, width: "100%", background: loading ? "rgba(124,92,252,0.3)" : `linear-gradient(135deg, ${PALETTE.accent}, #a855f7)`, border: "none", borderRadius: 12, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", boxShadow: loading ? "none" : `0 0 24px ${PALETTE.accentGlow}`, transition: "all 0.2s" }}>
          {loading ? "🔮 Grok is analyzing your emotions..." : "✦ Analyze & Generate Music"}
        </button>
      </GlassCard>
      {emotionData && (
        <GlassCard style={{ marginBottom: 16 }} glow={em.color}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: PALETTE.textMuted }}>🎼 LIVE MUSIC PLAYER</p>
            {isPlaying && <span style={{ background: "#34d39922", border: "1px solid #34d39944", borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#34d399", animation: "orbPulse 1.5s ease-in-out infinite" }}>● PLAYING</span>}
          </div>
          <LiveWaveform isPlaying={isPlaying} emotion={emotionData.primary} engine={audioEngine} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <button onClick={togglePlay} disabled={toneLoading} style={{ width: 52, height: 52, borderRadius: "50%", border: "none", cursor: toneLoading ? "wait" : "pointer", background: isPlaying ? `linear-gradient(135deg, #ef4444, #dc2626)` : toneLoading ? `rgba(255,255,255,0.1)` : `linear-gradient(135deg, ${em.color}, ${em.color}aa)`, color: "#fff", fontSize: toneLoading ? 14 : 20, flexShrink: 0, boxShadow: isPlaying ? "0 0 20px #ef444488" : toneLoading ? "none" : `0 0 20px ${em.glow}`, transition: "all 0.2s" }}>
              {toneLoading ? "⏳" : isPlaying ? "⏹" : "▶"}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: PALETTE.textMuted }}>{toneLoading ? "🎹 Loading instruments..." : isPlaying ? `♪ ${EMOTION_SONGS[emotionData.primary]?.label || emotionData.genre} · ${emotionData.tempo} · ${EMOTION_SONGS[emotionData.primary]?.bpm || "~"}bpm` : "Press ▶ to hear your emotion as music"}</span>
                <span style={{ fontSize: 11, color: PALETTE.textMuted }}>🔊 {volume}%</span>
              </div>
              <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} style={{ width: "100%", height: 4, accentColor: em.color, cursor: "pointer", background: `linear-gradient(90deg, ${em.color} ${volume}%, rgba(255,255,255,0.1) ${volume}%)`, border: "none", borderRadius: 2, outline: "none" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {emotionData.instruments?.map(inst => <span key={inst} style={{ background: em.color + "22", border: `1px solid ${em.color}44`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: em.color }}>♪ {inst}</span>)}
          </div>
          <p style={{ fontSize: 13, color: PALETTE.textMuted, fontStyle: "italic", lineHeight: 1.6, marginTop: 12 }}>"{emotionData.atmosphere}"</p>
        </GlassCard>
      )}
      {emotionData && (
        <GlassCard style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 16 }}>📊 EMOTIONAL METRICS</p>
          <StatBar label="Intensity" value={emotionData.intensity} color={em.color} />
          <StatBar label="Energy Level" value={emotionData.energy} color={PALETTE.cyan} />
          <StatBar label="Emotional Balance" value={emotionData.balance} color={PALETTE.green} />
          <StatBar label="Sentiment" value={Math.round((emotionData.sentiment + 1) * 50)} color={PALETTE.accentSoft} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            {[{ label: "Genre", value: emotionData.genre }, { label: "Tempo", value: emotionData.tempo }].map(({ label, value }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12, border: `1px solid ${PALETTE.border}` }}>
                <div style={{ fontSize: 11, color: PALETTE.textMuted }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: em.color }}>{value}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: PALETTE.textMuted, fontStyle: "italic", marginTop: 12 }}>"{emotionData.description}"</p>
        </GlassCard>
      )}
      <GlassCard>
        <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 16 }}>⚡ SMART MODES</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setActiveMode(activeMode === m.id ? null : m.id)} style={{ background: activeMode === m.id ? m.color + "22" : "rgba(255,255,255,0.03)", border: `1px solid ${activeMode === m.id ? m.color : PALETTE.border}`, borderRadius: 12, padding: "12px 8px", cursor: "pointer", color: activeMode === m.id ? m.color : PALETTE.textMuted, fontSize: 12, fontWeight: 600, transition: "all 0.2s", boxShadow: activeMode === m.id ? `0 0 16px ${m.color}44` : "none" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>{m.label}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function Dashboard({ emotionHistory }) {
  const counts = {};
  emotionHistory.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return (
    <div style={{ padding: "0 0 100px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: PALETTE.text, marginBottom: 6 }}>📊 Mood Analytics</h2>
        <p style={{ color: PALETTE.textMuted, fontSize: 14 }}>Your emotional journey over time</p>
      </div>
      {emotionHistory.length === 0 ? (
        <GlassCard style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
          <p style={{ color: PALETTE.textMuted }}>No mood data yet. Analyze your emotions in the Studio!</p>
        </GlassCard>
      ) : (
        <>
          {dominant && (
            <GlassCard style={{ marginBottom: 16 }} glow={EMOTION_MAP[dominant[0]]?.color}>
              <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 8 }}>🏆 DOMINANT EMOTION</p>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: EMOTION_MAP[dominant[0]]?.color + "33", border: `2px solid ${EMOTION_MAP[dominant[0]]?.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{EMOTION_MAP[dominant[0]]?.emoji}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: EMOTION_MAP[dominant[0]]?.color }}>{EMOTION_MAP[dominant[0]]?.label}</div>
                  <div style={{ fontSize: 13, color: PALETTE.textMuted }}>Detected {dominant[1]} time{dominant[1] > 1 ? "s" : ""}</div>
                </div>
              </div>
            </GlassCard>
          )}
          <GlassCard style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 16 }}>📈 EMOTION DISTRIBUTION</p>
            {Object.entries(counts).map(([em, count]) => {
              const pct = Math.round((count / emotionHistory.length) * 100);
              const info = EMOTION_MAP[em] || {};
              return (
                <div key={em} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 18, width: 28 }}>{info.emoji}</span>
                  <div style={{ flex: 1 }}><StatBar label={info.label || em} value={pct} color={info.color || PALETTE.accent} /></div>
                  <span style={{ fontSize: 12, color: PALETTE.textMuted, width: 24 }}>{count}x</span>
                </div>
              );
            })}
          </GlassCard>
          <GlassCard>
            <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 16 }}>🕐 RECENT EMOTIONS</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[...emotionHistory].reverse().slice(0, 12).map((em, i) => {
                const info = EMOTION_MAP[em] || {};
                return <span key={i} style={{ background: info.color + "22", border: `1px solid ${info.color}44`, borderRadius: 20, padding: "6px 14px", fontSize: 13, color: info.color }}>{info.emoji} {info.label}</span>;
              })}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}

function CompanionChat({ currentEmotion }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hello, I'm your EmotiTune AI companion 🎵 Tell me — how are you feeling today? I'll help find the perfect soundtrack for your soul." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated); setInput(""); setLoading(true);
    try {
      const reply = await chatWithCompanion(updated, currentEmotion || "unknown");
      setMessages([...updated, { role: "assistant", content: reply }]);
    } catch { setMessages([...updated, { role: "assistant", content: "I felt a connection break for a moment. Try again?" }]); }
    setLoading(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", padding: "0 0 100px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: PALETTE.text, marginBottom: 6 }}>🤖 AI Companion</h2>
        <p style={{ color: PALETTE.textMuted, fontSize: 14 }}>Your empathetic emotional music guide · <span style={{ color: "#22d3ee" }}>⚡ Grok AI</span></p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 16, gap: 10, alignItems: "flex-end" }}>
            {m.role === "assistant" && <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${PALETTE.accent}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 0 16px ${PALETTE.accentGlow}` }}>🎵</div>}
            <div style={{ maxWidth: "75%", background: m.role === "user" ? `linear-gradient(135deg, ${PALETTE.accent}cc, #a855f7cc)` : "rgba(255,255,255,0.06)", border: `1px solid ${m.role === "user" ? PALETTE.accent + "44" : PALETTE.border}`, borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "12px 16px", fontSize: 14, color: PALETTE.text, lineHeight: 1.7 }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${PALETTE.accent}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎵</div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "18px 18px 18px 4px", padding: "14px 20px" }}><span style={{ color: PALETTE.textMuted, fontSize: 20, letterSpacing: 4 }}>···</span></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Share what's on your mind..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${PALETTE.border}`, borderRadius: 50, padding: "14px 20px", color: PALETTE.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
        <button onClick={send} disabled={loading} style={{ background: `linear-gradient(135deg, ${PALETTE.accent}, #a855f7)`, border: "none", borderRadius: "50%", width: 48, height: 48, color: "#fff", fontSize: 18, cursor: "pointer", boxShadow: `0 0 20px ${PALETTE.accentGlow}`, flexShrink: 0 }}>↑</button>
      </div>
    </div>
  );
}

function MemoryStudio() {
  const [memory, setMemory] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const analyze = async () => {
    if (!memory.trim()) return;
    setLoading(true); setError("");
    try { setResult(await analyzeMemory(memory)); }
    catch (e) { setError("Grok API error. Check your API key."); setResult(null); }
    setLoading(false);
  };
  const emInfo = result ? (EMOTION_MAP[result.emotion] || EMOTION_MAP.calmness) : null;
  return (
    <div style={{ padding: "0 0 100px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: PALETTE.text, marginBottom: 6 }}>📖 Memory Studio</h2>
        <p style={{ color: PALETTE.textMuted, fontSize: 14 }}>Pour your memories — receive a cinematic soundtrack</p>
      </div>
      <GlassCard style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 12 }}>📝 YOUR DIARY / JOURNAL / MEMORY</p>
        <textarea value={memory} onChange={e => setMemory(e.target.value)} placeholder="Paste a journal entry, diary page, or describe a memory..." style={{ width: "100%", minHeight: 150, background: "rgba(255,255,255,0.03)", border: `1px solid ${PALETTE.border}`, borderRadius: 12, color: PALETTE.text, fontSize: 14, padding: 16, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.7, boxSizing: "border-box" }} />
        {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>⚠️ {error}</p>}
        <button onClick={analyze} disabled={loading || !memory.trim()} style={{ marginTop: 12, width: "100%", background: loading ? "rgba(251,191,36,0.2)" : "linear-gradient(135deg, #fbbf24, #f59e0b)", border: "none", borderRadius: 12, padding: "14px 0", color: "#000", fontSize: 15, fontWeight: 800, cursor: loading ? "wait" : "pointer", boxShadow: loading ? "none" : "0 0 24px #fbbf2444" }}>
          {loading ? "🔮 Grok is reading your memory..." : "🎬 Create My Soundtrack"}
        </button>
      </GlassCard>
      {result && emInfo && (
        <>
          <GlassCard style={{ marginBottom: 16 }} glow={emInfo.color}>
            <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 12 }}>💌 EMOTIONAL RESPONSE</p>
            <div style={{ background: emInfo.color + "11", border: `1px solid ${emInfo.color}33`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <p style={{ color: PALETTE.text, fontSize: 14, lineHeight: 1.7, fontStyle: "italic" }}>"{result.message}"</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ background: emInfo.color + "22", border: `1px solid ${emInfo.color}44`, borderRadius: 20, padding: "6px 16px", fontSize: 13, color: emInfo.color }}>{emInfo.emoji} {emInfo.label}</span>
              <span style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${PALETTE.border}`, borderRadius: 20, padding: "6px 16px", fontSize: 13, color: PALETTE.textMuted }}>🎭 {result.mood}</span>
            </div>
          </GlassCard>
          <GlassCard style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 12 }}>🎵 SUGGESTED SOUNDTRACK</p>
            {result.soundtrack?.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < result.soundtrack.length - 1 ? `1px solid ${PALETTE.border}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${emInfo.color}44, ${emInfo.color}22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>♪</div>
                <span style={{ color: PALETTE.text, fontSize: 14 }}>{s}</span>
              </div>
            ))}
          </GlassCard>
          <GlassCard>
            <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 12 }}>🎬 CINEMATIC VISUAL</p>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, border: `1px solid ${PALETTE.border}` }}>
              <p style={{ color: PALETTE.textMuted, fontSize: 14, fontStyle: "italic", lineHeight: 1.7 }}>🌅 {result.visual}</p>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}

function LyricsGenerator({ currentEmotion, activeMode }) {
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState(currentEmotion || "happiness");
  const [selectedSongType, setSelectedSongType] = useState("pop");
  const [songMeta, setSongMeta] = useState(null);

  const parseMeta = (raw) => {
    const titleMatch = raw.match(/🎵\s*TITLE:\s*"?([^"\n]+)"?/i);
    const genreMatch = raw.match(/Genre:\s*([^|]+)/i);
    const bpmMatch = raw.match(/BPM hint:\s*([^\n]+)/i);
    return { title: titleMatch ? titleMatch[1].trim() : null, genre: genreMatch ? genreMatch[1].trim() : null, bpm: bpmMatch ? bpmMatch[1].trim() : null };
  };

  const generate = async () => {
    setLoading(true); setSongMeta(null); setLyrics("");
    try {
      const raw = await generateLyrics(selectedEmotion, selectedSongType, activeMode);
      setSongMeta(parseMeta(raw)); setLyrics(raw);
    } catch { setLyrics("The words couldn't find their way just now. Try again."); }
    setLoading(false);
  };

  const em = EMOTION_MAP[selectedEmotion] || EMOTION_MAP.happiness;
  const st = SONG_TYPES.find(s => s.id === selectedSongType) || SONG_TYPES[0];

  const parseSections = (text) => {
    if (!text) return [];
    const lines = text.split("\n");
    const sections = [];
    let current = null;
    lines.forEach(line => {
      const m = line.match(/^\[([^\]]+)\]/);
      if (m) { if (current) sections.push(current); current = { label: m[1], lines: [] }; }
      else if (current) current.lines.push(line);
      else if (line.trim()) { if (!current) current = { label: "__meta__", lines: [] }; current.lines.push(line); }
    });
    if (current) sections.push(current);
    return sections;
  };

  const sections = parseSections(lyrics);
  const SECTION_COLORS = { "verse 1": em.color, "verse 2": em.color, "verse 3": em.color, "chorus": "#f472b6", "final chorus": "#f472b6", "hook": "#f472b6", "bridge": "#22d3ee", "pre-chorus": "#a78bfa", "intro": "#fbbf24", "outro": "#60a5fa", "drop": "#ef4444", "build": "#fb923c", "guitar solo": "#fbbf24", "opening theme": "#a78bfa", "rising action": "#fb923c", "climax": "#ef4444", "emotional peak": "#f472b6", "resolution": "#34d399", "break": "#22d3ee" };
  const getSectionColor = (label) => SECTION_COLORS[label.toLowerCase()] || em.color;

  return (
    <div style={{ padding: "0 0 120px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: PALETTE.text, marginBottom: 6 }}>✍️ Song Lyrics Generator</h2>
        <p style={{ color: PALETTE.textMuted, fontSize: 14 }}>Pick an emotion + song type → get a full professional song · <span style={{ color: "#22d3ee" }}>⚡ Grok AI</span></p>
      </div>
      <GlassCard style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 14 }}>🎵 SONG TYPE</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {SONG_TYPES.map(s => (
            <button key={s.id} onClick={() => setSelectedSongType(s.id)} style={{ background: selectedSongType === s.id ? s.color + "22" : "rgba(255,255,255,0.03)", border: `1px solid ${selectedSongType === s.id ? s.color : PALETTE.border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left", transition: "all 0.15s", boxShadow: selectedSongType === s.id ? `0 0 16px ${s.color}33` : "none" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedSongType === s.id ? s.color : PALETTE.text }}>{s.label}</div>
                <div style={{ fontSize: 11, color: PALETTE.textMuted, marginTop: 2 }}>{s.description}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", border: `1px solid ${st.color}33` }}>
          <span style={{ fontSize: 11, color: PALETTE.textMuted }}>Structure: </span>
          <span style={{ fontSize: 11, color: st.color }}>{st.structure}</span>
        </div>
      </GlassCard>
      <GlassCard style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: PALETTE.textMuted, marginBottom: 12 }}>🎭 EMOTION</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(EMOTION_MAP).map(([key, val]) => (
            <button key={key} onClick={() => setSelectedEmotion(key)} style={{ background: selectedEmotion === key ? val.color + "33" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedEmotion === key ? val.color : PALETTE.border}`, borderRadius: 20, padding: "7px 15px", cursor: "pointer", color: selectedEmotion === key ? val.color : PALETTE.textMuted, fontSize: 12, fontWeight: selectedEmotion === key ? 700 : 400, transition: "all 0.15s" }}>{val.emoji} {val.label}</button>
          ))}
        </div>
        {activeMode && <div style={{ marginTop: 10, fontSize: 12, color: PALETTE.textMuted }}>Mode: <span style={{ color: PALETTE.accentSoft }}>⚡ {activeMode}</span></div>}
      </GlassCard>
      <button onClick={generate} disabled={loading} style={{ width: "100%", marginBottom: 20, background: loading ? `${st.color}33` : `linear-gradient(135deg, ${st.color}, ${em.color})`, border: "none", borderRadius: 14, padding: "16px 0", color: "#fff", fontSize: 16, fontWeight: 800, cursor: loading ? "wait" : "pointer", boxShadow: loading ? "none" : `0 0 30px ${st.color}44`, transition: "all 0.2s", letterSpacing: 0.5 }}>
        {loading ? `${st.icon} Grok is writing your ${st.label}...` : `${st.icon} Generate ${st.label} — ${em.emoji} ${em.label}`}
      </button>
      {lyrics && sections.length > 0 && (
        <>
          {songMeta?.title && (
            <GlassCard style={{ marginBottom: 16, textAlign: "center" }} glow={st.color}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{st.icon}</div>
              <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, background: `linear-gradient(135deg, ${st.color}, ${em.color})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>"{songMeta.title}"</h3>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {[{ label: songMeta.genre || st.label, icon: "🎵" }, { label: em.label, icon: em.emoji }, ...(songMeta.bpm ? [{ label: songMeta.bpm, icon: "🥁" }] : [])].map((tag, i) => (
                  <span key={i} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${PALETTE.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: PALETTE.textMuted }}>{tag.icon} {tag.label}</span>
                ))}
              </div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
                <button onClick={() => navigator.clipboard?.writeText(lyrics)} style={{ background: `${st.color}22`, border: `1px solid ${st.color}44`, borderRadius: 20, padding: "6px 20px", color: st.color, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>📋 Copy Full Song</button>
              </div>
            </GlassCard>
          )}
          {sections.filter(s => s.label !== "__meta__").map((section, si) => {
            const sc = getSectionColor(section.label);
            const isChorus = section.label.toLowerCase().includes("chorus") || section.label.toLowerCase().includes("hook") || section.label.toLowerCase() === "drop";
            return (
              <div key={si} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${sc}55)` }} />
                  <span style={{ background: sc + "22", border: `1px solid ${sc}55`, borderRadius: 20, padding: "3px 14px", fontSize: 11, fontWeight: 800, color: sc, letterSpacing: 1, textTransform: "uppercase" }}>{section.label}</span>
                  <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${sc}55, transparent)` }} />
                </div>
                <div style={{ background: isChorus ? `${sc}0d` : "rgba(255,255,255,0.02)", borderRadius: 12, padding: "14px 18px", border: `1px solid ${isChorus ? sc + "33" : PALETTE.border}`, borderLeft: `3px solid ${sc}`, boxShadow: isChorus ? `0 0 20px ${sc}11` : "none" }}>
                  {section.lines.filter(l => l.trim()).map((line, li) => (
                    <p key={li} style={{ fontSize: isChorus ? 16 : 14, fontWeight: isChorus ? 600 : 400, color: isChorus ? PALETTE.text : PALETTE.text + "dd", lineHeight: 1.85, marginBottom: li < section.lines.length - 1 ? 2 : 0, fontStyle: "italic", letterSpacing: isChorus ? 0.3 : 0 }}>{line}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default function EmotiTuneAI() {
  const [landed, setLanded] = useState(false);
  const [page, setPage] = useState("studio");
  const [emotionData, setEmotionData] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [activeMode, setActiveMode] = useState(null);

  const handleSetEmotionData = useCallback((data) => {
    setEmotionData(data);
    if (data?.primary) setEmotionHistory(prev => [...prev, data.primary]);
  }, []);

  const em = emotionData ? (EMOTION_MAP[emotionData.primary] || EMOTION_MAP.calmness) : null;
  if (!landed) return <Landing onEnter={() => setLanded(true)} />;

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, color: PALETTE.text, fontFamily: "'Segoe UI', system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes orbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes orbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.05)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range] { -webkit-appearance: none; appearance: none; border-radius: 2px; height: 4px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: white; cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", background: em ? `radial-gradient(ellipse, ${em.glow} 0%, transparent 60%)` : "radial-gradient(ellipse, #7c5cfc22 0%, transparent 60%)", transition: "background 2s ease" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "50%", height: "50%", background: "radial-gradient(ellipse, #22d3ee11 0%, transparent 60%)" }} />
        <ParticleField emotion={emotionData?.primary || "calmness"} />
      </div>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #7c5cfc, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 16px #7c5cfc55" }}>🎵</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>EmotiTune AI</span>
            <span style={{ fontSize: 11, color: "#22d3ee", background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 10, padding: "2px 8px" }}>⚡ Grok</span>
          </div>
          {activeMode && <span style={{ background: MODES.find(m => m.id === activeMode)?.color + "22", border: `1px solid ${MODES.find(m => m.id === activeMode)?.color}44`, borderRadius: 20, padding: "4px 14px", fontSize: 12, color: MODES.find(m => m.id === activeMode)?.color }}>{MODES.find(m => m.id === activeMode)?.icon} {activeMode} mode</span>}
        </div>
        {page === "studio"    && <EmotionStudio emotionData={emotionData} setEmotionData={handleSetEmotionData} activeMode={activeMode} setActiveMode={setActiveMode} />}
        {page === "dashboard" && <Dashboard emotionHistory={emotionHistory} />}
        {page === "chat"      && <CompanionChat currentEmotion={emotionData?.primary} />}
        {page === "memory"    && <MemoryStudio />}
        {page === "lyrics"    && <LyricsGenerator currentEmotion={emotionData?.primary} activeMode={activeMode} />}
      </div>
      <Nav page={page} setPage={setPage} />
    </div>
  );
}
