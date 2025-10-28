import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Voice from '@react-native-voice/voice';

const WAKE_WORD = 'hi speech';

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [resultText, setResultText] = useState('');
  const [state, setState] = useState('Idle'); // internal tracking only
  const wakeed = useRef(false);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    const initPermissions = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to recognize speech.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('🎤 Microphone permission granted');
          startListening(); // start background listening
        } else {
          console.log('🚫 Microphone permission denied');
          setState('Error');
        }

        const getService = await Voice.getSpeechRecognitionServices();
        console.log('Speech recognition services:', getService);
      }
    };

    initPermissions();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = () => {
    console.log('Recording started');
    setState('Listening');
  };

  const onSpeechEnd = () => {
    console.log('Recording ended');
    setIsListening(false);
    if (!wakeed.current) {
      // Restart listening automatically
      setTimeout(() => startListening(), 600);
    }
  };

  const onSpeechResults = (e) => {
    const results = e?.value || [];
    if (results.length === 0) return;

    const text = results.join(' ').toLowerCase();
    console.log('Speech Results:', text);
    setSearchText(results[0]);

    // If already awake, capture next command
    if (wakeed.current) {
      wakeed.current = false;
      setState('Processing');
      setResultText(results[0]);
      setState('Result');
      setTimeout(() => startListening(), 1000);
      return;
    }

    // Check for wake word
    if (text.includes(WAKE_WORD)) {
      wakeed.current = true;
      setState('Awake');
      console.log('✅ Wake word detected! Listening for next command...');
      return;
    }

    setState('Listening');
  };

  const onSpeechError = (error) => {
    console.log('onSpeechError:', error);
    setState('Error');
    setIsListening(false);
    setTimeout(() => startListening(), 1500);
  };

  const startListening = async () => {
    try {
      await Voice.start('en-US');
      setIsListening(true);
      setState('Listening');
    } catch (error) {
      console.log('Start Listening Error:', error);
      setState('Error');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      setState('Idle');
    } catch (error) {
      console.log('Stop Listening Error:', error);
      setState('Error');
    }
  };

  // ---------- UI ----------
  const styles = StyleSheet.create({
    maincontainer: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: 'white' },
    container: {
      flexDirection: 'row',
      backgroundColor: '#f1f1f1',
      borderRadius: 30,
      alignItems: 'center',
      paddingHorizontal: 15,
      margin: 20,
      elevation: 3,
    },
    input: { flex: 1, height: 45, fontSize: 16, color: '#000' },
    iconContainer: { marginLeft: 10 },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333', marginHorizontal: 2 },
    hint: { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 10 },
    resultText: {
      marginTop: 20,
      fontSize: 18,
      color: '#111',
      fontWeight: '600',
      textAlign: 'center',
      paddingHorizontal: 16,
    },
  });

  return (
    <View style={styles.maincontainer}>
      <View style={styles.container}>
        <TextInput
          placeholder="Tap mic or say wake word..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.input}
          placeholderTextColor="#888"
        />

        <TouchableOpacity
          onPress={() => {
            isListening ? stopListening() : startListening();
          }}
          style={styles.iconContainer}
        >
          {isListening ? (
            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          ) : (
            <Icon name="microphone" size={24} color="#333" />
          )}
        </TouchableOpacity>
      </View>

      {/* Hide hint when awake or processing */}
      {state !== 'Awake' && state !== 'Processing' && (
        <Text style={styles.hint}>
          Say: "{WAKE_WORD}" to wake the app, then speak a short command.
        </Text>
      )}

      {/* Show recognized command/result below */}
      {resultText ? (
        <Text style={styles.resultText}>You said: {resultText}</Text>
      ) : null}
    </View>
  );
};

export default App;
