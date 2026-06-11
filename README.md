# HabitFlow
> A beautiful habit tracking app built with React Native & Expo

## Features
- Daily habit check-ins with streak tracking (boolean + count targets)
- Animated checkboxes with haptic feedback and confetti celebrations
- Per-habit 7-day and 30-day bar trend charts
- Stats dashboard with arc progress ring and 14-day overview chart
- Per-habit reminders and optional global daily reminder
- Swipe to delete, bottom sheet add/edit flow
- Persistent storage with AsyncStorage — works fully offline

## Tech Stack
| Library | Purpose |
|---|---|
| Expo SDK 54 | App framework |
| React Native Reanimated | Animations |
| Zustand + AsyncStorage | State + offline persistence |
| React Navigation | Stack + bottom tabs |
| react-native-svg | Charts and progress rings |
| date-fns | Streak + trend logic |
| expo-haptics | Tactile feedback |
| expo-notifications | Habit and daily reminders |

## Getting Started
```bash
git clone <repo-url>
cd HabitTrackerApp
npm install
npx expo start
```

## Folder Structure
```
src/
├── components/
│   ├── HabitRow.tsx              # Animated habit row with swipe support
│   ├── HabitPerformanceCard.tsx  # Per-habit stats with 7-day trend chart
│   ├── HabitTrendChart.tsx       # Reusable bar chart for habit trends
│   ├── LastFourteenDaysChart.tsx # 14-day aggregate bar chart
│   ├── MiniStatCard.tsx          # Small stat pill for Stats screen
│   ├── StatsHeroCard.tsx         # Arc progress ring hero card
│   └── StreakCard.tsx            # Streak summary card on Today screen
├── screens/
│   ├── AddHabitScreen.tsx        # Bottom sheet modal for adding habits
│   ├── EditHabitScreen.tsx       # Bottom sheet modal for editing habits
│   ├── HabitDetailScreen.tsx     # Detail view with 30-day trend chart
│   ├── SettingsScreen.tsx        # Preferences, habit management, danger zone
│   ├── StatsScreen.tsx           # Aggregated stats dashboard
│   └── TodayScreen.tsx           # Main daily check-in screen
├── store/
│   └── habitStore.ts             # Zustand store with persistence
├── theme/
│   └── index.ts                  # Design tokens (colors, spacing, typography)
├── types/
│   └── index.ts                  # Shared TypeScript types
└── utils/
    ├── dateUtils.ts              # Date formatting + streak algorithms
    ├── habitUtils.ts             # Unified completion/stats helpers
    └── notificationUtils.ts      # Reminder scheduling
```
