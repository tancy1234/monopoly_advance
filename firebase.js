// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC26ZOsy1xA0C08SjCSAQA8LlXC1pDkUCA",
  authDomain: "monopoly-advance.firebaseapp.com",
  databaseURL: "https://monopoly-advance-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "monopoly-advance",
  storageBucket: "monopoly-advance.firebasestorage.app",
  messagingSenderId: "358785731865",
  appId: "1:358785731865:web:e77f49fc5376a141694988"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();