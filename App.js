import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  ActivityIndicator,
} from "react-native";
import * as Permissions from "expo-permissions";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import firebase from "./services";

export default function App() {
  const db = firebase.database();

  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    permission();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 50,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
  });

  const recordingSettings = {
    android: {
      extension: ".m4a",
      outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
      audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
    ios: {
      extension: ".m4a",
      outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
      audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MIN,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  };

  const startRecording = async () => {
    if (sound !== null) {
      await sound.unloadAsync();
      sound.setOnPlaybackStatusUpdate(null);
      setSound(null);
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
    const _recording = new Audio.Recording();
    try {
      await _recording.prepareToRecordAsync(recordingSettings);
      setRecording(_recording);
      await _recording.startAsync();
      setIsRecording(true);
    } catch (error) {
      alert(error);
    }
  };
  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
    } catch (error) {
      alert(error);
    }
    const info = await FileSystem.getInfoAsync(recording.getURI());
    console.log(`FILE INFO: ${JSON.stringify(info)}`);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
    const { sound: _sound, status } = await recording.createNewLoadedSoundAsync(
      {
        isLooping: true,
        isMuted: false,
        volume: 1.0,
        rate: 1.0,
        shouldCorrectPitch: true,
      }
    );
    setSound(_sound);
    setIsRecording(false);
  };

  const uploadAudio = async () => {
    if (input != "") {
      setLoading(true);
      const uri = recording.getURI();
      try {
        const blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => {
            try {
              resolve(xhr.response);
            } catch (error) {
              console.log("error:", error);
            }
          };
          xhr.onerror = (e) => {
            console.log(e);
            reject(new TypeError("Network request failed"));
          };
          xhr.responseType = "blob";
          xhr.open("GET", uri, true);
          xhr.send(null);
        });
        if (blob != null) {
          const uriParts = uri.split(".");
          const fileType = uriParts[uriParts.length - 1];
          firebase
            .storage()
            .ref()
            .child(`${input}.${fileType}`)
            .put(blob, {
              contentType: `audio/${fileType}`,
            })
            .then(() => {
              alert("Audio Salvo com sucesso!");
              setLoading(false);
            })
            .catch((e) => alert(e));
        } else {
          alert("erroor with blob");
          setLoading(false);
        }
      } catch (error) {
        alert(error);
        setLoading(false);
      }
    } else {
      alert("digite um nome para salvar o audio");
      setLoading(false);
    }
  };
  const downloadAudio = async () => {
    if (input != "") {
      setLoading(true);
      const uri = await firebase.storage().ref(`${input}.m4a`).getDownloadURL();

      // The rest of this plays the audio
      const soundObject = new Audio.Sound();
      try {
        await soundObject.loadAsync({ uri });
        await soundObject.playAsync();
        setLoading(false);
      } catch (error) {
        alert(`erro player: ${error}`);
        setLoading(false);
      }
    } else {
      alert("digite o nome do audio para download");
    }
  };

  const playAudio = async () => {
    const uri = recording.getURI();
    const soundObject = new Audio.Sound();
    try {
      await soundObject.loadAsync({ uri });
      await soundObject.playAsync();
      setLoading(false);
    } catch (error) {
      alert(error);
      setLoading(false);
    }
  };

  const permission = async () => {
    const { status, expires, permissions } = await Permissions.askAsync(
      Permissions.AUDIO_RECORDING
    );
    console.log(`permission: ${status}`);
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 40, paddingBottom: 100 }}>Meu APP</Text>
      <TextInput
        style={{
          marginBottom: 50,
          height: 40,
          width: 200,
          borderColor: "#ddd",
          borderWidth: 1,
        }}
        placeholder="Digite a Lista"
        value={input}
        onChangeText={(value) => {
          setInput(value);
        }}
      />
      {loading && (
        <ActivityIndicator
          color="#121212"
          size={45}
          style={{ paddingBottom: 50 }}
        />
      )}
      {!isRecording && (
        <Button
          onPress={() => {
            startRecording();
          }}
          title="Recording"
        />
      )}
      {recording && (
        <Button
          onPress={() => {
            stopRecording();
          }}
          title="Stop Recording"
        />
      )}
      {isRecording && <Text>Gravando...</Text>}
      {recording && (
        <Button
          onPress={() => {
            playAudio();
          }}
          title="Play Audio"
        />
      )}
      <Button
        onPress={() => {
          uploadAudio();
        }}
        title="Upload"
      />
      <Button
        onPress={() => {
          downloadAudio();
        }}
        title="Download"
      />
      <StatusBar style="auto" />
    </View>
  );
}
