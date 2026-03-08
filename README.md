# 🍲 Zabb4U - Thai Regional Restaurant Discovery App

<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
</div>

## 📌 Project Overview
**Zabb4U** is a cross-platform mobile application inspired by Japan's Tabelog, tailored specifically for Thai cuisine. The app serves as a centralized hub to discover local and famous restaurants across the 4 main regions of Thailand: North, Northeast, Central, and South. 

The primary objective is to promote local food tourism, support local restaurant businesses, and provide an interactive platform for food enthusiasts to discover, review, and discuss their favorite dining spots.

## ✨ Key Features

### 📱 For Users
- **Regional Discovery:** Browse curated lists of restaurants categorized by the 4 regions of Thailand.
- **GPS-Based Nearby Search:** Instantly find restaurants near your current location within a customizable radius.
- **🎲 "Shake to Random" (Hardware Integration):** Can't decide what to eat? Simply shake your phone! The app utilizes the device's Accelerometer sensor to randomly pick a restaurant for you.
- **Community Forum:** A built-in social space where users can post reviews, share food pictures, like, and comment on others' posts.
- **Favorites & Notifications:** Save your favorite spots for later and receive real-time updates on your community interactions.

### 🛡️ For Administrators
- **Restaurant Management:** Full CRUD (Create, Read, Update, Delete) capabilities to manage restaurant listings and details.
- **Content Moderation:** Dedicated dashboard to review and resolve user-reported posts to maintain a safe community environment.

## 💻 Tech Stack & Architecture

- **Frontend / Mobile:** React Native, Expo
- **Backend:** RESTful API (Node.js/Express)
- **Database:** MySQL
- **Key Modules & APIs:**
  - `expo-sensors` (Accelerometer for Shake feature)
  - Geolocation API (`/api/nearby?lat&lng&distance`)
  - Custom Authentication (`/api/login`, `/api/signup`, OTP Verification)

## 🚀 How to Run the Project

### 1. Database Setup (MySQL)
Before running the application, you need to set up the local database:
1. Start your MySQL server (e.g., via XAMPP, MAMP, or MySQL Workbench).
2. Create a new database for the project (e.g., `zabb4u_db`).
3. Import the provided SQL dump file (`database.sql` or similar name in the repository) into your newly created database.
   - *Via phpMyAdmin:* Go to the `Import` tab and upload the `.sql` file.
   - *Via Command Line:*
     ```bash
     mysql -u root -p zabb4u_db < path/to/your/file.sql
     ```

### 2. Application Setup
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Deekub/Zabb4uApp.git](https://github.com/Deekub/Zabb4uApp.git)
   Install dependencies:
2. **Install dependencies:**
   ```bash
    cd Zabb4uApp
    npm install
    Set up environment variables: Create a .env file in the root directory and configure your database credentials and API base URL matching your local setup.
3. **Start the application:**
   ```bash
    npx expo start
   
4. Scan the QR code with the Expo Go app on your physical device, or run it on an iOS/Android emulator.

Developed as part of the Scripting Language Application Development Project (1101103) at Suranaree University of Technology.
