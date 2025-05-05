# Lab Pass

A mobile application for students to access university labs using QR codes.

## Features

- **Student Authentication**: Secure login and registration for students
- **Permanent QR Code**: Each student gets a unique, permanent QR code for lab access
- **Attendance Tracking**: View your lab attendance history
- **Profile Management**: Update your profile and student information
- **Lab History**: See which labs you've attended and when

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL database and authentication)
- **State Management**: React Context API
- **Storage**: AsyncStorage for persistent sessions
- **Navigation**: Expo Router

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure Supabase

   Create a `.env` file in the project root with your Supabase credentials:

   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the app

   ```bash
   npx expo start
   ```

## Database Schema

The app uses the following main tables:

- **students**: User profiles with student information
- **labs**: Lab information including schedules
- **attendance**: Records of lab attendance
- **qr_codes**: Permanent QR code data for each student

## Authentication Flow

1. Students register with email, password, and student information
2. A permanent QR code is generated and stored in the database
3. Login sessions are persisted using AsyncStorage
4. The QR code can be scanned at lab entrances to record attendance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License.
