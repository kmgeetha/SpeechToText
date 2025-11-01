import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import { NativeModules, NativeEventEmitter } from 'react-native';

const { SpeechModule } = NativeModules;
const speechEmitter = new NativeEventEmitter(SpeechModule);

const WAKE_WORD = 'Hello';

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [resultText, setResultText] = useState('');
  const [state, setState] = useState('Idle');
  const [commands, setCommands] = useState([]);
  const wakeed = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to recognize speech.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('🚫 Microphone permission denied');
          setState('Error');
          return;
        }
      }

      const online = await NetInfo.fetch();
      if (!online.isConnected) {
        setState('Offline');
        console.log('⚠️ No internet connection');
        return;
      }

      console.log('🎤 Starting continuous listening...');
      SpeechModule.startContinuousListening();
      setIsListening(true);
    };

    init();

    const sub = speechEmitter.addListener('SpeechEvent', ({ type, data }) => {
      if (!data) return;

      const spoken = data.toLowerCase().trim();

      // show partial updates
      if (type === 'PARTIAL') {
        setPartialText(spoken);
      }

      // handle results
      if (type === 'RESULT') {
        console.log('🗣 Heard:', spoken);

        if (!wakeed.current && spoken.includes(WAKE_WORD)) {
          wakeed.current = true;
          setState('Awake');
          setResultText('✅ Wake word detected! Listening to you now...');
          setPartialText('');
          return;
        }

        // after wake word → continuously collect
        if (wakeed.current) {
          setCommands(prev => [...prev, spoken]);
          setResultText(`🎤 You said: ${spoken}`);
          setState('Listening...');
        }
      }

      if (type.startsWith('ERROR')) {
        console.log('Speech error:', data);
        setState('Error');
      }

      if (type === 'STATE') setState(data);
    });

    return () => {
      sub.remove();
      SpeechModule.stopListening();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      SpeechModule.stopListening();
      setIsListening(false);
      setState('Idle');
      wakeed.current = false;
    } else {
      SpeechModule.startContinuousListening();
      setIsListening(true);
      setState('Listening for Wake Word');
    }
  };

  // ---------- UI (unchanged) ----------
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
    stateText: { marginTop: 8, fontSize: 14, color: '#666' },
    commandList: { marginTop: 20, width: '100%', paddingHorizontal: 20 },
    commandItem: {
      fontSize: 16,
      color: '#333',
      paddingVertical: 6,
      borderBottomWidth: 0.5,
      borderColor: '#ccc',
    },
    partialText: {
      color: '#888',
      fontSize: 15,
      marginTop: 10,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.maincontainer}>
      <View style={styles.container}>
        <TextInput
          placeholder="Say wake word or tap mic..."
          value={partialText}
          onChangeText={setPartialText}
          style={styles.input}
          placeholderTextColor="#888"
        />

        <TouchableOpacity onPress={toggleListening} style={styles.iconContainer}>
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

      <Text style={styles.stateText}>🎧 State: {state}</Text>

      {state !== 'Awake' && state !== 'Processing' && (
        <Text style={styles.hint}>Say "{WAKE_WORD}" once, then speak freely — it will keep recording your sentences.</Text>
      )}

      {resultText ? <Text style={styles.resultText}>{resultText}</Text> : null}

      {wakeed.current && partialText ? (
        <Text style={styles.partialText}>🎤 Listening: {partialText}</Text>
      ) : null}

      <ScrollView style={styles.commandList}>
        {commands.map((cmd, i) => (
          <Text key={i} style={styles.commandItem}>
            • {cmd}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

export default App;
