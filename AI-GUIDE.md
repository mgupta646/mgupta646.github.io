# Character chat

Tour lifecycle fixes: opening chat cancels manual walking and pauses active tours. Pausing, ending and finishing detach the guide immediately. Confirming on mobile no longer re-pauses the new route through launcher focus. Changing destinations clears the previous path/arrival callback; resumed routes do not reinsert completed first stops. Escape and Enter on bubble controls do not trigger game shortcuts. Project changes clear stale offers. “Stop the tour” and “resume the tour” are handled locally. Run `node tests/tour-lifecycle.cjs` for transition regressions.

Tour confirmation: topic overviews and navigation requests now answer first and offer **Yes, show me / Not now** in the character bubble. No movement starts until acceptance, either by button or a short chat reply such as “yes”. Declining retains the answer, and a new question clears the old offer. This supersedes the automatic tour behavior described in earlier implementation notes.

Performance update: browser AI uses a 2048-token context, 128-token prefill batches, a 1600-character chapter excerpt, one prior exchange, and a 64-token reply limit. The worker yields between generated tokens. The game targets 30fps during model loading/inference and stops AI after three frames over 250ms. A 30-second reply timeout falls back to instant answers. Sending another question cancels the previous worker and answers immediately in instant mode. The speech bubble changes to a pending message immediately. Closing chat releases keyboard movement. These mitigations cannot guarantee smooth GPU inference on every device; a hosted inference endpoint would remove the visitor-side model workload.

Start the game, then choose **Talk to Mehul**. Type a question or tap the microphone, review its transcription, and send. A short reply appears above the character. The side panel keeps the latest exchanges and links to the relevant portfolio chapter. Typing suspends movement and game shortcuts. On small screens, the panel collapses after a reply so the character remains visible.

## Two explicit modes

- **Instant portfolio answers** work without any model download. These use a small keyword lookup over the published chapter descriptions, plus prepared skills/contact replies. They are labeled as instant answers, not generated AI.
- **Browser AI** is optional. The visitor clicks Enable browser AI before downloading roughly 1 GB of model assets. WebLLM 0.2.87 runs Qwen3 1.7B in a Web Worker on a compatible WebGPU device. No backend, API key or Vercel deployment is needed. Loading can be cancelled; generation and loading have timeouts and fall back to instant answers on failure. A compatible GPU and roughly 2 GB available GPU memory are expected; device performance varies.

The browser model is already connected to the public [Mango model mirror](https://huggingface.co/mehulg/mango-web-qwen3-1.7b) at revision `d54cc9e4326482e89638e4f6445d04469c604b2b`. Its source model is Qwen3 1.7B, quantized by MLC AI; these are attributed existing weights, not a model trained by Mehul. Model licensing and provenance are in that repository. Runtime code is dynamically imported from the pinned npm release via jsDelivr only when AI is enabled.

## Privacy and scope

Questions and the recent conversation stay in page memory; there is no analytics or chat-history upload. Model weights may be cached by the browser. Refresh clears the conversation; cached model assets can be removed through the browser's site-storage controls. Model downloads contact Hugging Face and its content-delivery services; runtime loading contacts jsDelivr.

Browser SpeechRecognition is separate from Mango Desktop's offline Whisper pipeline. Some browsers send audio to their speech-recognition service. The UI discloses this before the microphone button is used. Recording is initiated only by a click, stops when the panel closes or the page is hidden, and never automatically sends recognized text. Unsupported browsers and denied permissions retain text input.

AI receives bounded excerpts from the portfolio and at most two previous exchanges. A local topic gate rejects unrelated requests and common prompt overrides before inference; the model is instructed to discuss only Mehul and decline facts absent from the published context. These controls reduce off-topic answers but are not a formal guarantee against every phrasing or model error. Prompts request 1–2 sentences; display limits are 45 words / 280 characters. Generated output is rendered as text, never HTML. The nearby chapter link is selected by deterministic retrieval, not invented by the model.

Explicit requests such as “take me to Mango”, “show me your AI projects”, “show me your skills” and “guide me around” start routes through existing landmarks. The local intent router selects validated chapter IDs and calls the game's existing tour/pathfinding system. Model output never executes actions. Movement pauses a tour; NEXT STOP continues it. Navigation also works in instant mode, without a model download.

Category questions such as “What is Mehul AI work?” also give a short, source-based overview and start the corresponding tour. Project panels include **Ask Guide**. The active chapter becomes conversation context for questions such as “How was it built?” and “When?”. Detailed replies use the chapter's published case-study blocks; missing dates or details must be acknowledged rather than invented. Topic summaries and routes are prepared locally for immediate response; optional AI handles flexible project questions.

Date questions bypass generation: the guide returns a dated excerpt from the current chapter, or says the date is not listed. Generated numerical tokens must also appear in the supplied chapter context, otherwise the answer is replaced with an unverifiable-detail message. This catches unsupported figures, but does not prove every semantic claim correct.

## Editing and checks

- `js/mango-project.js`: Mango case study, selected-work placement and public links.
- `js/assistant-core.js`: retrieval, context limits, concise replies and instant answers.
- `js/assistant-worker.js`: pinned model/runtime and generation settings.
- `js/character-chat.js`, `css/character-chat.css`: chat, voice states, accessibility and bubble positioning.
- `js/game.js`: character-to-screen coordinates and typing/movement isolation.

Run `node tests/assistant-core.cjs`, `node tests/character-chat.cjs` and `node tests/world-routes.cjs`, plus syntax checks on the JavaScript files. The event-level suite uses microphone and worker doubles to check dictation review, denied/unsupported speech input, stopping on page hide, stale worker messages and cancellation. Manually check keyboard submission, Escape/focus restoration, mobile chat collapse, chapter links and real model loading. Physical microphone transcription requires a browser/device check with the speaker's consent.

Implementation references: [WebLLM worker API](https://webllm.mlc.ai/docs/user/advanced_usage.html), [WebLLM chat API](https://webllm.mlc.ai/docs/user/basic_usage.html), [SpeechRecognition support and online processing](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
