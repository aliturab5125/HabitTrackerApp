# HabitFlow
> A beautiful habit tracking app built with React Native & Expo

## Features
- Daily habit check-ins with streak tracking
- Animated circular checkboxes with haptic feedback
- 12-week completion heatmap per habit
- Stats dashboard with bar chart and arc progress ring
- Swipe to delete, bottom sheet add flow
- Persistent storage with MMKV — works fully offline

## Tech Stack
| Library | Purpose |
|---|---|
| Expo SDK 51 | App framework |
| React Native Reanimated 3 | All animations |
| Zustand + MMKV | State + offline persistence |
| React Navigation | Stack + bottom tabs |
| Victory Native | Bar chart |
| react-native-svg | Arc progress ring |
| date-fns | Streak + heatmap logic |
| expo-haptics | Tactile feedback |

## What This Demonstrates
- Custom Reanimated 3 animations (spring, sequence, stagger)
- Zustand store with MMKV for zero-latency persistence
- Streak algorithm and heatmap data generation from raw dates
- Gesture-based interactions (swipe to delete)
- Bottom sheet modal with spring physics
- Component-level state machines (checkbox 3 states)
- Clean folder structure scalable to production

## Getting Started
```bash
git clone <repo-url>
cd habit-tracker
npm install
npx expo start
```

## Folder Structure
```
src/
├── components/
│   ├── HabitRow.tsx              # Animated habit row with swipe support
│   ├── HabitPerformanceCard.tsx  # Per-habit stats card on Stats screen
│   ├── LastFourteenDaysChart.tsx # 14-day bar chart component
│   ├── MiniStatCard.tsx          # Small stat pill for Stats screen
│   ├── StatsHeroCard.tsx         # Arc progress ring hero card
│   └── StreakCard.tsx            # Streak summary card on Today screen
├── screens/
│   ├── AddHabitScreen.tsx        # Bottom sheet modal for adding habits
│   ├── HabitDetailScreen.tsx     # Detail view with heatmap + stats
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
    └── dateUtils.ts              # Streak + heatmap + completion logic
```
