# LearningHubApp
LearningHub is a modern and interactive learning platform built with React Native. It offers a wide range of courses, quizzes, and video lessons to help users enhance their skills.

## Features

LearningHub is a comprehensive learning platform that offers:

- 📚 **Course Library**: Browse and access a wide range of courses across different categories
- 🔒 **Progressive Learning**: Unlock lessons as you complete prerequisites
- 📱 **Cross-Platform**: Works seamlessly on iOS, Android, and Web
- 🌙 **Dark Mode**: Full support for light and dark themes
- 🎥 **Video Lessons**: Watch high-quality video content with progress tracking
- 📝 **Text Lessons**: Read comprehensive text-based lessons with code snippets
- 🧠 **Quizzes**: Test your knowledge with interactive quizzes
- 🔔 **Progress Tracking**: Track your progress across courses and modules
- 🔐 **User Authentication**: Secure login and account management
- 💳 **Premium Content**: Access to premium courses with subscription

## Tech Stack

- [React Native](https://reactnative.dev/) - Core framework
- [Expo](https://expo.dev/) - Development platform
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based routing
- [Supabase](https://supabase.com/) - Backend and authentication
- [Moti](https://moti.fyi/) - Animations
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Advanced animations
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) - Audio/video playback
- [React Native Markdown Display](https://github.com/iamacup/react-native-markdown-display) - Markdown rendering

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/araneeskhan/LearningHubApp.git
   cd LearningHubApp
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Supabase:
   - Create a Supabase project at [supabase.com](https://supabase.com/)
   - Copy `lib/supabase.example.ts` to `lib/supabase.ts`
   - Update the Supabase URL and anon key in `lib/supabase.ts`

4. Start the development server:
   ```bash
   npx expo start
   ```

### Database Schema

The application uses the following Supabase tables:

- `users` - User accounts
- `courses` - Course information
- `modules` - Course modules
- `lessons` - Individual lessons
- `user_progress` - User progress tracking
- `subscriptions` - User subscription status

## Project Structure

```
LearningHub/
├── app/                  # Application screens
│   ├── (tabs)/           # Tab-based navigation
│   ├── course/           # Course screens
│   ├── lesson/           # Lesson screens
│   └── ...               # Other screens
├── assets/               # Static assets
│   ├── fonts/            # Custom fonts
│   └── images/           # Images and icons
├── components/           # Reusable components
│   ├── lesson/           # Lesson-specific components
│   ├── ui/               # UI components
│   └── ...               # Other components
├── constants/            # App constants
├── context/              # React context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
└── types/                # TypeScript type definitions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Aranees Khan - [@araneeskhan](https://github.com/araneeskhan)

Project Link: [https://github.com/araneeskhan/LearningHubApp](https://github.com/araneeskhan/LearningHubApp)
```



