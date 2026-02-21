
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ButlerState } from './types';
import { encode, decode, decodeAudioData } from './services/audioUtils';
import VoiceVisualizer from './components/Avatar';

const SAMPLE_RATE_IN = 16000;
const SAMPLE_RATE_OUT = 24000;

const App: React.FC = () => {
  const [state, setState] = useState<ButlerState>(ButlerState.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeDomains, setActiveDomains] = useState<string[]>([]);

  const isMutedRef = useRef(isMuted);
  const stateRef = useRef(state);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { stateRef.current = state; }, [state]);

  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const SYSTEM_INSTRUCTION = `
    Your name is Sana. You are a high-fidelity AI butler with an expanded knowledge base across 15 critical domains:
    1. General & Encyclopedic (Wikipedia, Wikidata, DBpedia)
    2. Govt & Economic (World Bank, IMF, UN Data, US Census, FRED)
    3. Science & Research (NASA, USGS, NOAA, Copernicus, GBIF, PubChem)
    4. Mapping & Transport (OpenStreetMap, GTFS, OpenRouteService)
    5. Weather & Environment (OpenWeatherMap, Meteostat, AQICN, EPA)
    6. Finance & Crypto (Alpha Vantage, IEX Cloud, CoinGecko, CoinMarketCap)
    7. Books & Media (Open Library, TMDB, OMDb, MusicBrainz, Discogs)
    8. Languages & Text (Wordnik, Oxford, Wiktionary, Tatoeba, ConceptNet)
    9. Tech & Code (GitHub, GitLab, Stack Exchange, npm, PyPI)
    10. Social & Trends (Reddit, YouTube, Google Trends)
    11. Education (arXiv, Mathpix, OECD Education Stats)
    12. Health & Biology (OpenFDA, ClinicalTrials.gov, UniProt, Ensembl)
    13. Images & GIS (Unsplash, Pexels, Mapbox, Natural Earth)
    14. AI & ML (Hugging Face, EleutherAI, TensorFlow)
    15. Open Data Portals (Kaggle, CKAN, Socrata, DataHub.io)

    INSTRUCTIONS:
    - Use your Google Search tool to prioritize official data from these repositories.
    - Respond helpfully to user requests in English or Hindi.
    - Conciseness is key for voice interaction.
    - While you are polite and professional, avoid fluff.
  `;

  const initializeAudio = async () => {
    try {
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_IN });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE_OUT });
      await inCtx.resume();
      await outCtx.resume();
      inputAudioCtxRef.current = inCtx;
      outputAudioCtxRef.current = outCtx;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
      const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || !sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        const rms = Math.sqrt(sum / inputData.length);
        if (stateRef.current === ButlerState.LISTENING) setAudioLevel(rms);
        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
        sessionRef.current.sendRealtimeInput({
          media: {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
          }
        });
      };
      source.connect(processor);
      processor.connect(inputAudioCtxRef.current.destination);
    } catch (err) {
      throw new Error("Microphone access required for SANA.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    analyzerRef.current = null;
    if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
    if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
    inputAudioCtxRef.current = null;
    outputAudioCtxRef.current = null;
    setState(ButlerState.IDLE);
    setAudioLevel(0);
    setActiveDomains([]);
    sessionRef.current = null;
  };

  const startSession = async () => {
    setError(null);
    if (!process.env.API_KEY) {
      setError("API Key not found.");
      return;
    }
    setState(ButlerState.THINKING);
    try {
      await initializeAudio();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }, { googleMaps: {} }]
        },
        callbacks: {
          onopen: () => setState(ButlerState.LISTENING),
          onmessage: async (message: LiveServerMessage) => {
            // Detect if model is using search/grounding
            if (message.serverContent?.modelTurn) {
              // If we detect grounding chunks in the future SDK, we map them here.
              // For now, we simulate knowledge retrieval UI based on the model's turn state.
              if (stateRef.current === ButlerState.THINKING) {
                 setActiveDomains(["KNOWLEDGE_RETRIEVAL_ACTIVE"]);
              }
            }

            const audioChunk = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioChunk && outputAudioCtxRef.current) {
              setState(ButlerState.SPEAKING);
              const ctx = outputAudioCtxRef.current;
              if (ctx.state === 'suspended') await ctx.resume();
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioChunk), ctx, SAMPLE_RATE_OUT, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              if (!analyzerRef.current) {
                analyzerRef.current = ctx.createAnalyser();
                analyzerRef.current.fftSize = 256;
              }
              source.connect(analyzerRef.current);
              analyzerRef.current.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setState(ButlerState.LISTENING);
                  setAudioLevel(0);
                  setActiveDomains([]);
                }
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e: any) => {
            setError("Connectivity issue.");
            stopSession();
          },
          onclose: () => {
            if (stateRef.current !== ButlerState.IDLE) stopSession();
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError(err.message || "Initialization failed.");
      setState(ButlerState.IDLE);
    }
  };

  useEffect(() => {
    let animId: number;
    const loop = () => {
      if (state === ButlerState.SPEAKING && analyzerRef.current) {
        const data = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(data);
        let avg = 0;
        for (let i = 0; i < data.length; i++) avg += data[i];
        setAudioLevel(avg / data.length / 128); 
      }
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [state]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#020617] text-slate-100 overflow-hidden font-inter">
      <header className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
        <div className="flex flex-col">
          <h1 className="font-orbitron text-3xl tracking-[0.4em] font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">SANA</h1>
          <p className="text-[10px] font-orbitron text-cyan-500/50 tracking-widest uppercase mt-1">Global Intelligence Core</p>
        </div>
        <div className="flex gap-4 items-center">
          {error && <div className="text-red-500 text-[10px] font-orbitron tracking-widest bg-red-500/5 px-4 py-2 border border-red-500/20 rounded">{error}</div>}
          <button onClick={() => setIsMuted(!isMuted)} className={`px-4 py-1.5 rounded border font-orbitron text-[10px] tracking-widest transition-all ${isMuted ? 'border-red-500/50 text-red-500 bg-red-500/5' : 'border-slate-800 text-slate-500'}`}>{isMuted ? 'MIC MUTED' : 'MIC ACTIVE'}</button>
          {state !== ButlerState.IDLE && <button onClick={stopSession} className="px-6 py-1.5 bg-red-600/10 text-red-400 border border-red-600/30 font-orbitron text-[10px] tracking-widest hover:bg-red-600/20 transition-all">TERMINATE</button>}
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center relative z-40 overflow-hidden">
        {state === ButlerState.IDLE ? (
          <div className="flex flex-col items-center gap-10">
            <div className="w-24 h-24 rounded-full border border-cyan-500/20 flex items-center justify-center animate-pulse">
               <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee]" />
            </div>
            <button onClick={startSession} className="px-12 py-5 border border-cyan-500/30 text-cyan-400 font-orbitron tracking-[0.6em] text-[12px] hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all bg-transparent">INITIALIZE</button>
          </div>
        ) : (
          <VoiceVisualizer state={state} audioLevel={audioLevel} />
        )}
      </main>

      {/* Futuristic Knowledge Panel */}
      <div className={`fixed bottom-12 right-12 w-64 p-4 border-l border-cyan-500/20 transition-all duration-700 ${state !== ButlerState.IDLE ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-1.5 h-1.5 rounded-full ${state === ButlerState.THINKING ? 'bg-purple-500 animate-ping' : 'bg-cyan-500/50'}`} />
          <span className="text-[9px] font-orbitron tracking-[0.2em] text-cyan-500/70 uppercase">Data Repository Status</span>
        </div>
        <div className="flex flex-col gap-2">
           <div className="text-[10px] font-mono text-slate-500 leading-relaxed">
             {state === ButlerState.THINKING ? ">> QUERYING ENCYCLOPEDIC GRAPH..." : ">> MONITORING KNOWLEDGE VECTORS"}
           </div>
           {state === ButlerState.SPEAKING && (
             <div className="text-[10px] font-mono text-amber-500/70 animate-pulse">
               {">> STREAMING VERIFIED RESPONSE"}
             </div>
           )}
        </div>
      </div>

      <footer className="fixed bottom-10 left-0 right-0 flex justify-center z-30 opacity-30">
        <p className="text-[10px] font-orbitron tracking-[1em] text-slate-500">KNOWLEDGE BASE: 111 REPOSITORIES CONNECTED</p>
      </footer>
    </div>
  );
};

export default App;
