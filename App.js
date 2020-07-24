import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import * as Permissions from "expo-permissions";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import firebase from "./services";
import Slider from "@react-native-community/slider";
import { FontAwesome5 } from "@expo/vector-icons";

export default function App() {
  const db = firebase.database();

  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [colorPlay, setColorPlay] = useState("#ddd");
  const [iconPlay, setIconPlay] = useState("play");
  const [totaltime, setTotalTime] = useState(1);
  const [currenttime, setCurrentTime] = useState(0);

  useEffect(() => {
    permission();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 50,
      backgroundColor: "#EAEAEC",
      alignItems: "center",
      justifyContent: "center",
    },
    playbutton: {
      backgroundColor: "#FFF",
      borderColor: colorPlay,
      borderWidth: 12,
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 32,
      shadowColor: "#5D3F6A",
      shadowRadius: 30,
      shadowOpacity: 0.5,
      elevation: 5,
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
      staysActiveInBackground: false,
    });
    const { sound: _sound, status } = await recording.createNewLoadedSoundAsync(
      {
        isLooping: false,
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

      if (sound != null) {
        await sound.unloadAsync();
        setSound(null);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        playsInSilentLockedModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      const { sound: _sound, status } = await Audio.Sound.createAsync({
        uri: uri,
        isLooping: false,
        isMuted: false,
        volume: 1.0,
        rate: 1.0,
        shouldCorrectPitch: true,
      });
      setLoading(false);
      setSound(_sound);
    }
  };

  const playAudio = () => {
    try {
      if (sound != null) {
        if (!isPlaying) {
          setColorPlay("#32CD32");
          sound.playAsync();
          setIconPlay("pause");
          setIsPlaying(true);
          sound.setOnPlaybackStatusUpdate((status) => {
            setCurrentTime(status.positionMillis / 1000);
            setTotalTime(status.durationMillis / 1000);
            if (status.didJustFinish) {
              sound.stopAsync();
              setIsPlaying(false);
              setColorPlay("#ddd");
              setIconPlay("play");
              setTotalTime(1);
              setCurrentTime(0);
              return;
            }
          });
        } else {
          sound.pauseAsync();
          setIsPlaying(false);
          setColorPlay("#ddd");
          setIconPlay("play");
        }
      }
    } catch (error) {
      alert(error);
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

      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <TouchableOpacity>
          <FontAwesome5
            name="backward"
            size={32}
            color="#93ABB3"
          ></FontAwesome5>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playbutton} onPress={playAudio}>
          <FontAwesome5
            name={iconPlay}
            size={32}
            color="#3D425C"
            style={isPlaying ? { marginLeft: 0 } : { marginLeft: 8 }}
          ></FontAwesome5>
        </TouchableOpacity>
        <TouchableOpacity>
          <FontAwesome5 name="forward" size={32} color="#93ABB3"></FontAwesome5>
        </TouchableOpacity>
        <StatusBar style="auto" />
      </View>

      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ marginRight: 10 }}>{`${currenttime.toFixed(0)}s`}</Text>
        <Slider
          style={{
            width: 200,
            height: 40,
            marginTop: 25,
            alignItens: "center",
          }}
          minimumValue={0}
          maximumValue={totaltime ? totaltime : 1}
          value={currenttime ? currenttime : 0}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
        />
        <Text style={{ marginLeft: 10 }}>{`${totaltime.toFixed(0)}s`}</Text>
      </View>
    </View>
  );
}
