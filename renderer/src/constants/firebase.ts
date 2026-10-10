// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCzNWB6WR-pzHpo5ikOKM89XdZ82mhPS64',
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'iscan-d5465.firebaseapp.com',
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'iscan-d5465',
	storageBucket:
		process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'iscan-d5465.firebasestorage.app',
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '736511215012',
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:736511215012:web:cfb57511f419931e37ad31',
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MESUREMENT_ID || 'G-M4N9EYXKTY',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
