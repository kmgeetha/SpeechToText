import Foundation
import AVFoundation
import Speech

@objc(SpeechModule)
class SpeechModule: RCTEventEmitter {
  private let audioEngine = AVAudioEngine()
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private let speechRecognizer = SFSpeechRecognizer()

  override static func requiresMainQueueSetup() -> Bool { return true }

  override func supportedEvents() -> [String]! {
    return ["onStart", "onPartialResult", "onResult", "onError", "onStop"]
  }

  @objc
  func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    SFSpeechRecognizer.requestAuthorization { status in
      switch status {
      case .authorized:
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
          DispatchQueue.main.async { resolve(granted) }
        }
      default:
        DispatchQueue.main.async { resolve(false) }
      }
    }
  }

  @objc
  func startListening() {
    if audioEngine.isRunning { return }
    let audioSession = AVAudioSession.sharedInstance()
    do {
      try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      sendEvent(withName: "onError", body: ["error": "audio session error"])
      return
    }

    recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    guard let recognitionRequest = recognitionRequest else { return }
    recognitionRequest.shouldReportPartialResults = true

    let inputNode = audioEngine.inputNode

    recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
      if let result = result {
        self.sendEvent(withName: "onPartialResult", body: ["value": result.bestTranscription.formattedString])
        if result.isFinal {
          self.sendEvent(withName: "onResult", body: ["value": result.bestTranscription.formattedString])
        }
      }
      if let error = error {
        self.stopListeningInternal()
        self.sendEvent(withName: "onError", body: ["error": error.localizedDescription])
      }
    }

    let recordingFormat = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { (buffer, when) in
      recognitionRequest.append(buffer)
    }

    audioEngine.prepare()
    do {
      try audioEngine.start()
    } catch {
      sendEvent(withName: "onError", body: ["error": "audioEngine start error"])
    }

    sendEvent(withName: "onStart", body: nil)
  }

  private func stopListeningInternal() {
    audioEngine.stop()
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    recognitionTask = nil
    recognitionRequest = nil
    let inputNode = audioEngine.inputNode
    inputNode.removeTap(onBus: 0)
    sendEvent(withName: "onStop", body: nil)
  }

  @objc
  func stopListening() {
    stopListeningInternal()
  }
}
