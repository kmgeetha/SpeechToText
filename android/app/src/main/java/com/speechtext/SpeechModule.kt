package com.speechtext

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.*

class SpeechModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun getName(): String = "SpeechModule"

    @ReactMethod
    fun startContinuousListening() {
        mainHandler.post {
            if (speechRecognizer == null) {
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        sendEvent("STATE", "READY")
                    }

                    override fun onBeginningOfSpeech() {
                        sendEvent("STATE", "STARTED")
                    }

                    override fun onPartialResults(bundle: Bundle?) {
                        val results = bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = results?.getOrNull(0)
                        if (!text.isNullOrEmpty()) sendEvent("PARTIAL", text)
                    }

                    override fun onResults(bundle: Bundle?) {
                        val results = bundle?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = results?.getOrNull(0)
                        if (!text.isNullOrEmpty()) sendEvent("RESULT", text)
                        restartListening()
                    }

                    override fun onError(error: Int) {
                        sendEvent("STATE", "ERROR_$error")
                        restartListening()
                    }

                    override fun onEndOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }
            startListening()
        }
    }

    private fun startListening() {
        if (isListening) return
        isListening = true

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, reactContext.packageName)
        }

        mainHandler.post {
            try {
                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                sendEvent("STATE", "ERROR_${e.message}")
                restartListening()
            }
        }
    }

    private fun restartListening() {
        isListening = false
        mainHandler.postDelayed({
            startListening()
        }, 800)
    }

    @ReactMethod
    fun stopListening() {
        mainHandler.post {
            try {
                speechRecognizer?.stopListening()
                speechRecognizer?.cancel()
            } catch (_: Exception) {}
            isListening = false
        }
    }

    private fun sendEvent(type: String, data: String) {
        if (reactContext.hasActiveCatalystInstance()) {
            val params = Arguments.createMap().apply {
                putString("type", type)
                putString("data", data)
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("SpeechEvent", params)
        }
    }

    override fun onCatalystInstanceDestroy() {
        mainHandler.post {
            speechRecognizer?.destroy()
            speechRecognizer = null
        }
    }
}
