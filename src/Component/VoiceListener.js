// src/components/VoiceListener.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Speech from '../native/SpeechModule';

export default function VoiceListener() {
    const [status, setStatus] = useState('idle');
    const [text, setText] = useState('');

    useEffect(() => {
        const part = Speech.addListener('onPartialResult', e => {
            if (e?.value) setText(e.value);
        });
        const fin = Speech.addListener('onResult', e => {
            if (e?.value) {
                setText(e.value);
                handleWakeWord(e.value);
            }
        });
        const err = Speech.addListener('onError', e => {
            console.warn('speech error', e);
            setStatus('error');
        });
        const st = Speech.addListener('onStart', () => setStatus('listening'));
        const sp = Speech.addListener('onStop', () => setStatus('idle'));

        return () => {
            part.remove(); fin.remove(); err.remove(); st.remove(); sp.remove();
        };
    }, []);

    function handleWakeWord(transcript) {
        const normalized = transcript.toLowerCase();
        const wakeWords = ['hey app', 'okay app', 'hello app']; // change as desired
        for (const w of wakeWords) {
            if (normalized.includes(w)) {
                // Wake action: e.g., set a flag or open a dialog
                console.log('WAKE WORD DETECTED:', w);
                // Example: show listening UI / open voice command mode
                // You can also stop listening to do immediate speech-to-command
                // Speech.stop();
            }
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.status}>Status: {status}</Text>
            <Text style={styles.transcript}>{text}</Text>
            <View style={styles.row}>
                <Button title="Start" onPress={async () => {
                    try {
                        await Speech.start();
                        setStatus('listening');
                    } catch (e) { console.warn(e); setStatus('permission-denied'); }
                }} />
                <Button title="Stop" onPress={() => { Speech.stop(); setStatus('idle'); }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    status: { fontWeight: 'bold', marginBottom: 10 },
    transcript: { marginVertical: 20, minHeight: 40 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
});
