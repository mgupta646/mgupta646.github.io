# Character chat

Start the game, then choose **Talk to Mehul**. Type a question or tap the microphone, review its transcription, and send. A short reply appears above the character. The side panel keeps the latest exchanges and links to the relevant portfolio chapter. Typing suspends movement and game shortcuts. On small screens, the panel collapses after a reply so the character remains visible.

## Two explicit modes

- **Instant portfolio answers** work without any model download. These use a small keyword lookup over the published chapter descriptions, plus prepared skills/contact replies. They are labeled as instant answers, not generated AI.
- **Browser AI** is optional. The visitor clicks Enable browser AI before downloading roughly 1 GB of model assets. WebLLM 0.2.87 runs Qwen3 1.7B in a Web Worker on a compatible WebGPU device. No backend, API key or Vercel deployment is needed. Loading can be cancelled; generation and loading have timeouts and fall back to instant answers on failure. A compatible GPU and roughly 2 GB available GPU memory are expected; device performance varies.

The browser model is already connected to the public [Mango model mirror](https://huggingface.co/mehulg/mango-web-qwen3-1.7b) at revision `d54cc9e4326482e89638e4f6445d04469c604b2b`. Its source model is Qwen3 1.7B, quantized by MLC AI; these are attributed existing weights, not a model trained by Mehul. Model licensing and provenance are in that repository. Runtime code is dynamically imported from the pinned npm release via jsDelivr only when AI is enabled.

## Privacy and scope

Questions and the recent conversation stay in page memory; there is no analytics or chat-history upload. Model weights may be cached by the browser. Refresh clears the conversation; cached model assets can be removed through the browser's site-storage controls. Model downloads contact Hugging Face and its content-delivery services; runtime loading contacts jsDelivr.

Browser SpeechRecognition is separate from Mango Desktop's offline Whisper pipeline. Some browsers send audio to their speech-recognition service. The UI discloses this before the microphone button is used. Recording is initiated only by a click, stops when the panel closes or the page is hidden, and never automatically sends recognized text. Unsupported browsers and denied permissions retain text input.

AI receives bounded excerpts from the portfolio and at most two previous exchanges. Prompts request 1–2 sentences; display limits are 45 words / 280 characters. Generated output is rendered as text, never HTML. Responses do not execute commands, navigate automatically, or edit the portfolio. The nearby chapter link is selected by deterministic retrieval, not invented by the model. Small-model answers can still be wrong; the linked chapter is the source of truth.

## Editing and checks

- `js/mango-project.js`: Mango case study, selected-work placement and public links.
- `js/assistant-core.js`: retrieval, context limits, concise replies and instant answers.
- `js/assistant-worker.js`: pinned model/runtime and generation settings.
- `js/character-chat.js`, `css/character-chat.css`: chat, voice states, accessibility and bubble positioning.
- `js/game.js`: character-to-screen coordinates and typing/movement isolation.

Run `node tests/assistant-core.cjs`, `node tests/character-chat.cjs` and `node tests/world-routes.cjs`, plus syntax checks on the JavaScript files. The event-level suite uses microphone and worker doubles to check dictation review, denied/unsupported speech input, stopping on page hide, stale worker messages and cancellation. Manually check keyboard submission, Escape/focus restoration, mobile chat collapse, chapter links and real model loading. Physical microphone transcription requires a browser/device check with the speaker's consent.

Implementation references: [WebLLM worker API](https://webllm.mlc.ai/docs/user/advanced_usage.html), [WebLLM chat API](https://webllm.mlc.ai/docs/user/basic_usage.html), [SpeechRecognition support and online processing](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
