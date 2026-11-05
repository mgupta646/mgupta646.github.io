/* Verified against mgupta646/mango-voice-agent, November 5, 2026. */
SECTIONS.push({
  id: 'mango', cat: 'build', icon: 'robot', title: 'Mango Voice Agent',
  subtitle: 'Local AI · Desktop companion · Voice interface',
  blurb: 'Meet Mango: a Windows desktop voice companion with local Whisper recognition, an Ollama language model, editable memory and short, timed captions.',
  blocks: [
    { type: 'p', text: 'An independent personal-assistant prototype built around a small desktop robot. Speak to Mango, hear its reply, and follow compact captions; open its control room for the conversation, source links, voice settings and editable memory.' },
    { type: 'flow', steps: [{t:'Listen',d:'Local Whisper speech recognition'},{t:'Route',d:'Prepared replies, tools or local model'},{t:'Reason',d:'Granite 4 Micro through Ollama'},{t:'Respond',d:'Windows voice + timed captions'}], caption: 'Local speech and model inference, with optional internet tools.' },
    { type: 'h', text: 'The engineering decisions' },
    { type: 'p', text: 'Use prepared responses and local tools for fast paths. Keep speech recognition and model inference on the computer. Normalize web searches, include source links, and run a limited check for unsupported numbers before speaking web answers. Let the user review saved facts instead of silently treating every generated answer as memory.' },
    { type: 'img', src: 'assets/shots/mango-control-room.png', cap: 'Mango control room, using demonstration conversations. These examples illustrate the interface, not current-information accuracy.' },
    { type: 'h', text: 'Scope and limits' },
    { type: 'p', text: 'A working Windows prototype with Electron, Node.js and Python. Offline recognition uses Whisper; local reasoning uses Granite 4 Micro via Ollama. Optional web tools send search topics or cities to external providers. Generated answers can be wrong. Mango does not control arbitrary apps, send messages or create real reminders.' },
    { type: 'p', text: 'The browser model hosted for this portfolio is a separate Qwen3 1.7B / WebLLM runtime. It is an attributed mirror of existing model weights, not a model trained by Mehul. The desktop project and this browser guide share the compact conversational design.' },
    { type: 'links', items: [{ label:'Source & setup', url:'https://github.com/mgupta646/mango-voice-agent' },{ label:'Architecture', url:'https://github.com/mgupta646/mango-voice-agent/blob/main/docs/ARCHITECTURE.md' },{ label:'Browser model', url:'https://huggingface.co/mehulg/mango-web-qwen3-1.7b' }] },
    { type: 'tags', items: ['Electron','Node.js','Python','Whisper','Ollama','Voice UX','WebLLM'] },
  ],
});
WORK_NOTES.mango = { eyebrow:'Independent build · Voice AI', status:'Working prototype', title:'A local voice assistant with a desktop presence.', text:'Built a compact robot companion with local speech recognition, on-device reasoning, editable memory and captions timed to its voice. Optional web tools add sourced answers.', proof:'Local Whisper + Ollama · Public source', image:'assets/shots/mango-control-room.png', result:'Electron · Node.js · Python · Voice UX' };
WORK_TRACKS.find(t=>t.id==='build').ids = ['mango','aviation','apps'];
WORK_TRACKS.find(t=>t.id==='ai').ids.push('mango');
CASE_BRIEFS.mango = { role:'Independent personal-assistant project', problem:'Make voice interaction available in a small desktop companion without requiring cloud model calls.', decision:'Separate local speech, routing, model inference and captions; expose memory for explicit review.', evidence:'Public code, architecture documentation and regression tests for routing, memory, speech capture and captions.', boundary:'A personal-assistant prototype. Performance depends on hardware; search checks do not guarantee factual accuracy.', links:[{label:'Inspect Mango',url:'https://github.com/mgupta646/mango-voice-agent'}] };
