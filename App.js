import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import * as Permissions from "expo-permissions";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <View style={styles.container}>
      <Button
        onPress={() => {
          permission();
        }}
        title="Permissao"
      />
      <Button
        onPress={() => {
          startRecording();
        }}
        title="Recording"
      />
      <Button
        onPress={() => {
          stopRecording();
        }}
        title="Stop Recording"
      />
      <Button
        onPress={() => {
          playAudio();
        }}
        title="Play Audio"
      />
      <Button
        onPress={() => {
          _onPlayPausePressed();
        }}
        title="Pause Audio"
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

//const db = firebase.database();

const startRecording = async () => {
  // stop playback

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
    //setRecording(_recording);
    await _recording.startAsync();
    //setIsRecording(true);
  } catch (error) {
    alert(error);
  }
};
const stopRecording = async () => {
  try {
    await recording.stopAndUnloadAsync();
  } catch (error) {
    // Do nothing -- we are already unloaded.
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
  const { sound: _sound, status } = await recording.createNewLoadedSoundAsync({
    isLooping: true,
    isMuted: false,
    volume: 1.0,
    rate: 1.0,
    shouldCorrectPitch: true,
  });
  setSound(_sound);
  setIsRecording(false);
};
const uploadAudio = async () => {
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
        .child(`nameOfTheFile.${fileType}`)
        .put(blob, {
          contentType: `audio/${fileType}`,
        })
        .then(() => {
          console.log("Sent!");
        })
        .catch((e) => console.log("error:", e));
    } else {
      console.log("erroor with blob");
    }
  } catch (error) {
    console.log("error:", error);
  }
};
const downloadAudio = async () => {
  const uri = await firebase
    .storage()
    .ref("nameOfTheFile.filetype")
    .getDownloadURL();

  console.log("uri:", uri);

  // The rest of this plays the audio
  const soundObject = new Audio.Sound();
  try {
    await soundObject.loadAsync({ uri });
    await soundObject.playAsync();
  } catch (error) {
    console.log("error:", error);
  }
};

const playAudio = async () => {
  const soundObject = new Audio.Sound();
  try {
    await soundObject.loadAsync(require("../audioapp/assets/audio.mp3"));
    await soundObject.playAsync();
  } catch (error) {
    console.log("error:", error);
  }
};

const _onPlayPausePressed = () => {
  if (this.playbackInstance != null) {
    if (this.state.isPlaying) {
      this.playbackInstance.pauseAsync();
    } else {
      this.playbackInstance.playAsync();
    }
  }
};

const permission = async () => {
  const { status, expires, permissions } = await Permissions.askAsync(
    Permissions.AUDIO_RECORDING
  );
  alert(`permission: ${status}`);
};
