import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the workspace root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY 
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : undefined;

if (getApps().length === 0) {
  if (projectId && clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('Firebase initialization error:', error.message);
    }
  } else {
    console.warn('WARNING: Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing or incomplete. Firestore will not be functional.');
  }
}

// Export Firestore database client
export const db = getApps().length ? getFirestore() : null;

// Keep connectDB function for server.js backward compatibility
const connectDB = () => {
  if (getApps().length) {
    console.log('Firebase connection verified (Admin SDK active).');
  } else {
    console.warn('Firebase connection check: Admin SDK not initialized.');
  }
};

export default connectDB;
