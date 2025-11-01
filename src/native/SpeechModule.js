// src/native/SpeechModule.js
import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';
const { SpeechModule } = NativeModules;

const emitter = new NativeEventEmitter(SpeechModule);

export default {
    requestPermissionAndroid: async () => {
        if (Platform.OS !== 'android') return true;
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
                title: 'Microphone Permission',
                message: 'This app needs access to your microphone for speech recognition.',
                buttonPositive: 'OK',
            },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    },

    start: async () => {
        const ok = await module.exports.requestPermissionAndroid();
        if (!ok) throw new Error('Microphone permission denied');
        return SpeechModule.startListening();
    },

    stop: () => SpeechModule.stopListening(),

    addListener: (event, handler) => emitter.addListener(event, handler),
    removeAllListeners: () => emitter.removeAllListeners(),
};
