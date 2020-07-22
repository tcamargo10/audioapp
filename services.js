import firebase from "firebase";
import "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAPD0nrBBQlCdsEm927qe6lDzxPY640ekw",
  authDomain: "audioapp-4b104.firebaseapp.com",
  databaseURL: "https://audioapp-4b104.firebaseio.com",
  projectId: "audioapp-4b104",
  storageBucket: "audioapp-4b104.appspot.com",
  messagingSenderId: "20978918305",
  appId: "1:20978918305:web:cb5b01fbc1d9cdbce561e0",
};

if (!firebase.apps.length) {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
