import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import {
  colors,
  spacing,
  fontSize,
  fontFamily,
  letterSpacing,
} from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BAR_AREA_HEIGHT = 80;
const LABEL_AREA_HEIGHT = 18;
const CHART_TOP_PADDING = 4;
const CHART_HORIZONTAL_PADDING = 4;
const BAR_GAP = 6;
const BAR_RADIUS = 3;

export interface DailyDatum {
  label: string;
  value: number;
}

interface Props {
  data: DailyDatum[];
  chartWidth: number;
}

interface BarProps {
  x: number;
  barWidth: number;
  baseY: number;
  maxHeight: number;
  normalizedHeight: number;
  progress: SharedValue<number>;
}

function Bar({ x, barWidth, baseY, maxHeight, normalizedHeight, progress }: BarProps) {
  const targetHeight = maxHeight * normalizedHeight;

  const animatedProps = useAnimatedProps(() => {
    const h = targetHeight * progress.value;
    if (h <= 0) {
      return { d: '' };
    }
    const y = baseY + (maxHeight - h);
    const r = Math.min(BAR_RADIUS, h / 2, barWidth / 2);
    const right = x + barWidth;
    const bottom = baseY + maxHeight;
    return {
      d:
        `M ${x},${bottom} ` +
        `L ${x},${y + r} ` +
        `Q ${x},${y} ${x + r},${y} ` +
        `L ${right - r},${y} ` +
        `Q ${right},${y} ${right},${y + r} ` +
        `L ${right},${bottom} Z`,
    };
  });

  return (
    <AnimatedPath
      fill={colors.primary}
      fillOpacity={0.85}
      animatedProps={animatedProps}
    />
  );
}

export default function LastFourteenDaysChart({ data, chartWidth }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [data, progress]);

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const innerWidth = chartWidth - CHART_HORIZONTAL_PADDING * 2;
  const totalGap = BAR_GAP * (data.length - 1);
  const barWidth = (innerWidth - totalGap) / data.length;

  const baseY = CHART_TOP_PADDING;
  const svgHeight = CHART_TOP_PADDING + BAR_AREA_HEIGHT + LABEL_AREA_HEIGHT;
  const labelY = baseY + BAR_AREA_HEIGHT + 12;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LAST 14 DAYS</Text>
      <Svg width={chartWidth} height={svgHeight}>
        {data.map((d, i) => {
          const x = CHART_HORIZONTAL_PADDING + i * (barWidth + BAR_GAP);
          const normalizedHeight = d.value / maxValue;
          return (
            <React.Fragment key={`bar-${i}`}>
              <Bar
                x={x}
                barWidth={barWidth}
                baseY={baseY}
                maxHeight={BAR_AREA_HEIGHT}
                normalizedHeight={normalizedHeight}
                progress={progress}
              />
              <SvgText
                x={x + barWidth / 2}
                y={labelY}
                fontSize={9}
                fontFamily={fontFamily.regular}
                fill={colors.textLabel}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
    color: colors.textLabel,
    letterSpacing: letterSpacing.label,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
});
