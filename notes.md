
Design choices and notes
-----------------------

Why these choices:
- React Native CLI (bare) chosen because `react-native-voice` requires native modules and is easier to integrate in the CLI/bare workflow.
- Simple wake-word detection implemented by checking speech-to-text output for a chosen phrase ("hey thworks"). This avoids the complexity of integrating a keyword detection ML model (PocketSphinx, Snowboy, Porcupine) within the time constraints.
- react-native-permissions used to centralize permission request flow.

Trade-offs:
- Pros: Fast to implement, cross-platform speech-to-text behavior via a single library.
- Cons: More latency, higher data usage (if cloud STT is used by the platform), and less robust than an offline keyword engine.

Known issues / limitations:
- Not an offline keyword engine — detection depends on platform speech recognition behaviour.
- On some emulators microphone input is unsupported.
- Continuous listening may be throttled by the OS or the STT provider.

All third-party packages used:
- react-native-voice — speech-to-text event stream.
- react-native-permissions — handle microphone permissions cleanly.

