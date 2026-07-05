# CareWave Frontend 📱🏥

CareWave is a modern mobile health assistant and emergency alert application. This repository houses the client-side mobile application built with **React Native** and **Expo SDK 54**, utilizing native device APIs for real-time location mapping and Firebase push notifications.

---

## 🚀 Key Features

*   **Emergency Alerting System:** Triggers alerts and broadcasts location coordinates instantly.
*   **Real-time Geolocation:** Tracks coordinates and handles location tracking via `expo-location`.
*   **Firebase Push Notifications:** Integrated with `@react-native-firebase/messaging` for instant alert broadcasts.
*   **Haptic Feedback & Gradients:** Smooth, premium user experience backed by native haptics (`expo-haptics`) and custom layouts.
*   **Custom Development Client:** Configured with `expo-dev-client` to support native Firebase bindings outside standard Expo Go.

---

## 🛠️ Tech Stack & Dependencies

*   **Core:** React Native (v0.81), React (v19)
*   **Framework:** Expo SDK 54
*   **Push Notifications:** Firebase Cloud Messaging (FCM) via `@react-native-firebase` (Native)
*   **Device Integration:** `expo-location`, `expo-av` (audio), `expo-haptics`, `expo-battery`, `expo-network`
*   **Styling:** Linear Gradients (`expo-linear-gradient`) and Safe Area management

---

## 📋 Prerequisites

Before running this application, make sure you have:

1.  **Node.js:** version 18 or above.
2.  **Android Studio / Xcode:** Required to build the custom development client locally.
3.  **Firebase Configuration:** Ensure `google-services.json` (for Android) is placed in the root directory.

---

## ⚙️ Getting Started

### 1. Install Dependencies
Clone the repository, switch to the `frontend-stable` branch, and install the modules:
```bash
npm install
