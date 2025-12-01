#!/bin/bash

# Firebase Configuration Setup Script
# This script helps you set up Firebase authentication for the POS application

echo "🔥 Firebase Phone Authentication Setup"
echo "======================================"
echo ""

echo "📋 Steps you need to complete:"
echo ""
echo "1️⃣  Go to Firebase Console: https://console.firebase.google.com/"
echo ""
echo "2️⃣  Create or select your project"
echo ""
echo "3️⃣  Enable Phone Authentication:"
echo "   - Go to Authentication → Sign-in method"
echo "   - Click on 'Phone' provider"
echo "   - Toggle 'Enable' and click 'Save'"
echo ""
echo "4️⃣  Get your Firebase config:"
echo "   - Click Settings (gear icon) → Project settings"
echo "   - Scroll to 'Your apps' section"
echo "   - Click Web icon (</>)"
echo "   - Copy the firebaseConfig object"
echo ""
echo "5️⃣  Update the configuration file:"
echo "   File: frontend/src/config/firebase.ts"
echo ""

read -p "Have you copied your Firebase config? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "Great! Now paste your Firebase configuration values:"
    echo ""
    
    read -p "Enter API Key: " api_key
    read -p "Enter Auth Domain: " auth_domain
    read -p "Enter Project ID: " project_id
    read -p "Enter Storage Bucket: " storage_bucket
    read -p "Enter Messaging Sender ID: " sender_id
    read -p "Enter App ID: " app_id
    
    # Create the firebase config file
    cat > frontend/src/config/firebase.ts << EOF
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "${api_key}",
  authDomain: "${auth_domain}",
  projectId: "${project_id}",
  storageBucket: "${storage_bucket}",
  messagingSenderId: "${sender_id}",
  appId: "${app_id}"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
EOF

    echo ""
    echo "✅ Firebase configuration updated successfully!"
    echo ""
    echo "📱 Next steps:"
    echo "   1. Make sure Phone authentication is enabled in Firebase Console"
    echo "   2. Test with a real phone number or add test phone numbers"
    echo "   3. Run: npm run dev (in frontend directory)"
    echo "   4. Navigate to http://localhost:3000/signup"
    echo ""
    echo "📚 For detailed instructions, see: FIREBASE_SETUP_GUIDE.md"
    echo ""
else
    echo ""
    echo "Please complete the Firebase Console setup first."
    echo "Follow the detailed instructions in: FIREBASE_SETUP_GUIDE.md"
    echo ""
fi
