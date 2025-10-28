
# Wakeword App (React Native)

Minimal React Native CLI app implementing wake-word detection using `react-native-voice`.

## What this delivers
- Continuous listening for wake word ("hey thworks")
- After wake word detected, captures the next spoken phrase and displays it
- UI states: Idle / Listening / Awake / Processing / Result / Error
- Runnable on Android emulator and iOS simulator (instructions below)
- Files included: App.js, package.json, README.md, DECLARATION.md, notes.md

## Requirements
- Node 18.x or 20.x (tested on Node 18)
- React Native CLI (this is a bare React Native project, not Expo)
- Android Studio (for Android emulator) or Xcode (for iOS simulator)
- Java JDK 17 (you mentioned you already use JDK 17)

## Install
1. Clone repo
2. `cd wakeword-app`
3. `npm install` or `yarn`

## Android specific steps
1. Add microphone permission in `android/app/src/main/AndroidManifest.xml` (already documented below).
   ```
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   ```
2. Run metro:
   ```
   npx react-native start
   ```
3. In another terminal:
   ```
   npx react-native run-android
   ```

## iOS specific steps
1. Install pods:
   ```
   cd ios
   pod install
   cd ..
   ```
2. Add `NSMicrophoneUsageDescription` to Info.plist:
   ```
   <key>NSMicrophoneUsageDescription</key>
   <string>Needed to listen for wake word and capture voice commands</string>
   ```
3. Run:
   ```
   npx react-native run-ios
   ```

## Permissions
The app requests microphone permission using `react-native-permissions`. Ensure you accept the permission dialogs.

## Running notes
- The app uses a simple approach: it continuously feeds speech-to-text results and checks if the wake phrase (`"hey thworks"`) appears. When it does, the app considers itself "Awake" and the next phrase captured becomes the command.
- This is **not** a production-grade always-on wake-word engine (no DSP/keyword model), but it meets the assessment's simple approach requirement.

## Demo video
Record a 90–180 second screen recording showing:
- App launch
- Saying the wake word ("hey thworks")
- Giving a command
- Showing the captured text

You can use Android Studio's screen recorder or QuickTime on macOS for iOS simulator.

## Troubleshooting
- If the listener stops after the first recognition, press **Restart Listener**.
- On some emulators, microphone input may not forward—test on a physical device if needed.

"# SpeechToText" 
