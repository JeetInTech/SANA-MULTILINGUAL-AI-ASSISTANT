<div align="center">
<img width="1200" height="475" alt="SANA Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# SANA — The Futuristic AI Butler

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-Native_Audio-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**A real-time, voice-first AI assistant powered by Google Gemini's native audio model with a futuristic holographic face visualizer.**

[Report Bug](https://github.com/JeetInTech/SANA-MULTILINGUAL-AI-ASSISTANT/issues) · [Request Feature](https://github.com/JeetInTech/SANA-MULTILINGUAL-AI-ASSISTANT/issues)

</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Usage](#usage)
- [Knowledge Domains](#knowledge-domains)
- [Contributing](#contributing)
- [License](#license)

---

## About

**SANA** (Smart Adaptive Neural Assistant) is a high-fidelity, voice-interactive AI butler built with React, TypeScript, and Google's Gemini 2.5 Flash native audio model. It features a real-time holographic face visualizer rendered on an HTML5 Canvas — complete with blinking eyes, gaze micro-movements, and a dynamically animated talking mouth that responds to audio output.

SANA supports **English and Hindi** voice interaction with sub-second latency using the Gemini Live API's bidirectional audio streaming. It connects to Google Search and Google Maps as grounding tools to deliver factual, up-to-date responses.

---

## Features

| Feature | Description |
|---|---|
| **Real-Time Voice Chat** | Bidirectional audio streaming via Gemini Live API — speak and hear responses instantly |
| **Holographic Face Visualizer** | Canvas-rendered face with animated eyes (blink + gaze) and a mouth that follows speech cadence |
| **Multilingual Support** | Supports English and Hindi via a single voice interface |
| **Grounded Responses** | Integrated Google Search and Google Maps tools for real-time, factual data |
| **State-Aware UI** | Visual states for `IDLE`, `LISTENING`, `THINKING`, and `SPEAKING` with distinct color themes |
| **Mute Control** | Toggle microphone on/off without ending the session |
| **Futuristic UI** | Dark-mode Orbitron-themed interface with ambient glow effects and a knowledge panel |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       Browser                            │
│                                                          │
│  ┌──────────┐    ┌───────────────┐    ┌───────────────┐  │
│  │ Mic Input │───▶│  App.tsx       │───▶│ Gemini Live   │  │
│  │ (16kHz)   │    │  (State Mgmt) │    │ API Session   │  │
│  └──────────┘    └───────┬───────┘    └──────┬────────┘  │
│                          │                    │           │
│                          ▼                    ▼           │
│              ┌───────────────────┐  ┌─────────────────┐  │
│              │ VoiceVisualizer   │  │  Audio Playback  │  │
│              │ (Canvas Avatar)   │  │  (24kHz Output)  │  │
│              └───────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Gemini 2.5 Flash      │
              │   Native Audio Model    │
              │   + Google Search       │
              │   + Google Maps         │
              └─────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 5.8 |
| **Build Tool** | Vite 6.2 |
| **AI Model** | Gemini 2.5 Flash Native Audio (`gemini-2.5-flash-native-audio-preview`) |
| **AI SDK** | `@google/genai` (Live API with bidirectional audio streaming) |
| **Visualization** | HTML5 Canvas (custom wave-based face renderer) |
| **Styling** | Tailwind CSS (CDN), Google Fonts (Inter + Orbitron) |
| **Audio** | Web Audio API (ScriptProcessor for capture, AudioBufferSource for playback) |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A **Google Gemini API key** — get one free at [Google AI Studio](https://aistudio.google.com/apikey)
- A modern browser with **microphone access** (Chrome/Edge recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JeetInTech/SANA-MULTILINGUAL-AI-ASSISTANT.git
   cd SANA-MULTILINGUAL-AI-ASSISTANT
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create your environment file:**
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and add your Gemini API key:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at **http://localhost:3000**.

5. **Build for production:**
   ```bash
   npm run build
   npm run preview
   ```

---

## Project Structure

```
sana-butler/
├── index.html              # Entry HTML with Tailwind CDN & font imports
├── index.tsx               # React DOM root mount
├── App.tsx                 # Main application — session management, audio I/O, UI
├── types.ts                # TypeScript enums & interfaces (ButlerState, TranscriptionEntry)
├── metadata.json           # App metadata and permission declarations
├── vite.config.ts          # Vite config — env injection, dev server, aliases
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies & scripts
├── .env                    # API key (not committed)
├── components/
│   └── Avatar.tsx          # Canvas-based holographic face visualizer
├── services/
│   └── audioUtils.ts       # PCM encode/decode + AudioBuffer conversion
├── src/
│   ├── App.css             # Additional app styles
│   ├── App.tsx             # Alternate app entry (src variant)
│   ├── index.css           # Global CSS
│   ├── main.tsx            # Alternate main entry (src variant)
│   └── assets/             # Static assets
└── public/                 # Public static files
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `API_KEY` | **Yes** | Your Google Gemini API key |

The key is injected at build time via Vite's `define` config and accessed as `process.env.API_KEY`.

### Audio Settings

| Setting | Value | Description |
|---|---|---|
| Input Sample Rate | 16,000 Hz | Microphone capture rate |
| Output Sample Rate | 24,000 Hz | Gemini audio response playback rate |
| Input Format | PCM Int16 | Raw audio sent to Gemini |
| Voice | Zephyr | Gemini TTS voice preset |

---

## Usage

1. **Click "INITIALIZE"** to start a session. The app will request microphone access.
2. **Speak naturally** — SANA listens in real-time and streams audio responses.
3. **Watch the face** — the holographic avatar reacts: cyan while listening, purple while thinking, amber while speaking.
4. Use the **MIC ACTIVE / MIC MUTED** toggle to mute your microphone without ending the session.
5. Click **TERMINATE** to end the session and release all resources.

### Butler States

| State | Color | Description |
|---|---|---|
| `IDLE` | — | Waiting to be initialized |
| `LISTENING` | Cyan (`#22d3ee`) | Capturing user audio, eyes gently animate |
| `THINKING` | Purple (`#a855f7`) | Processing query, fast eye vibration |
| `SPEAKING` | Amber (`#fbbf24`) | Streaming audio response, mouth animates with speech |

---

## Knowledge Domains

SANA's system prompt instructs it to leverage Google Search across **15 knowledge domains**:

| # | Domain | Example Sources |
|---|---|---|
| 1 | General & Encyclopedic | Wikipedia, Wikidata, DBpedia |
| 2 | Government & Economic | World Bank, IMF, UN Data, FRED |
| 3 | Science & Research | NASA, USGS, NOAA, PubChem |
| 4 | Mapping & Transport | OpenStreetMap, GTFS |
| 5 | Weather & Environment | OpenWeatherMap, EPA, AQICN |
| 6 | Finance & Crypto | Alpha Vantage, CoinGecko |
| 7 | Books & Media | Open Library, TMDB, OMDb |
| 8 | Languages & Text | Wordnik, Wiktionary, ConceptNet |
| 9 | Tech & Code | GitHub, Stack Exchange, npm, PyPI |
| 10 | Social & Trends | Reddit, YouTube, Google Trends |
| 11 | Education | arXiv, OECD Education Stats |
| 12 | Health & Biology | OpenFDA, ClinicalTrials.gov, UniProt |
| 13 | Images & GIS | Unsplash, Pexels, Mapbox |
| 14 | AI & ML | Hugging Face, TensorFlow |
| 15 | Open Data Portals | Kaggle, CKAN, DataHub.io |

---

## Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "Add amazing feature"`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please ensure your code follows the existing style and includes appropriate TypeScript types.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with Ai by [JeetInTech](https://github.com/JeetInTech)**

*Powered by Google Gemini 2.5 Flash Native Audio*

</div>
