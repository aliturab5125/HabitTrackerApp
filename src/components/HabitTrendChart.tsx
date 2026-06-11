import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
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
import { TrendDay } from '../utils/habitUtils';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BAR_AREA_HEIGHT = 56;
const LABEL_AREA_HEIGHT = 16;
const CHART_TOP_PADDING = 4;
const CHART_HORIZONTAL_PADDING = 2;
const BAR_GAP = 4;
const BAR_RADIUS = 3;

interface Props {
  data: TrendDay[];
  chartWidth?: number;
  title?: string;
  accentColor?: string;
  barHeight?: number;
  showLegend?: boolean;
}

interface BarProps {
  x: number;
  barWidth: number;
  baseY: number;
  maxHeight: number;
  normalizedHeight: number;
  progress: SharedValue<number>;
  fill: string;
  fillOpacity: number;
}

function Bar({
  x,
  barWidth,
  baseY,
  maxHeight,
  normalizedHeight,
  progress,
  fill,
  fillOpacity,
}: BarProps) {
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
      fill={fill}
      fillOpacity={fillOpacity}
      animatedProps={animatedProps}
    />
  );
}

function buildTrackPath(
  x: number,
  barWidth: number,
  baseY: number,
  maxHeight: number,
): string {
  const bottom = baseY + maxHeight;
  const r = Math.min(BAR_RADIUS, maxHeight / 2, barWidth / 2);
  const right = x + barWidth;
  const y = baseY;
  return (
    `M ${x},${bottom} ` +
    `L ${x},${y + r} ` +
    `Q ${x},${y} ${x + r},${y} ` +
    `L ${right - r},${y} ` +
    `Q ${right},${y} ${right},${y + r} ` +
    `L ${right},${bottom} Z`
  );
}

export default function HabitTrendChart({
  data,
  chartWidth: chartWidthProp,
  title,
  accentColor = colors.primary,
  barHeight = BAR_AREA_HEIGHT,
  showLegend = false,
}: Props) {
  const progress = useSharedValue(0);
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setMeasuredWidth(event.nativeEvent.layout.width);
  };

  const chartWidth = chartWidthProp ?? measuredWidth;

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [data, progress]);

  if (data.length === 0) return null;

  return (
    <View style={styles.container} onLayout={chartWidthProp ? undefined : handleLayout}>
      {title ? <Text style={styles.title}>{title}</Text> : null}

      {chartWidth > 0 ? (
        <TrendChartSvg
          data={data}
          chartWidth={chartWidth}
          barHeight={barHeight}
          accentColor={accentColor}
          progress={progress}
        />
      ) : null}

      {showLegend ? (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: accentColor }]} />
            <Text style={styles.legendText}>Partial</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.heatmapEmpty }]} />
            <Text style={styles.legendText}>Rest day</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

interface TrendChartSvgProps {
  data: TrendDay[];
  chartWidth: number;
  barHeight: number;
  accentColor: string;
  progress: SharedValue<number>;
}

function TrendChartSvg({
  data,
  chartWidth,
  barHeight,
  accentColor,
  progress,
}: TrendChartSvgProps) {
  const innerWidth = chartWidth - CHART_HORIZONTAL_PADDING * 2;
  const totalGap = BAR_GAP * (data.length - 1);
  const barWidth = (innerWidth - totalGap) / data.length;

  const baseY = CHART_TOP_PADDING;
  const svgHeight = CHART_TOP_PADDING + barHeight + LABEL_AREA_HEIGHT;
  const labelY = baseY + barHeight + 12;

  return (
    <Svg width={chartWidth} height={svgHeight}>
      {data.map((d, i) => {
        const x = CHART_HORIZONTAL_PADDING + i * (barWidth + BAR_GAP);
        const trackFill = d.isScheduled ? colors.statsProgressTrack : colors.heatmapEmpty;
        const barFill = d.completed ? colors.success : accentColor;
        const barOpacity = d.isScheduled ? (d.completed ? 1 : 0.85) : 0.35;

        return (
          <React.Fragment key={d.dateISO}>
            <Path
              d={buildTrackPath(x, barWidth, baseY, barHeight)}
              fill={trackFill}
            />
            {d.isScheduled && d.value > 0 ? (
              <Bar
                x={x}
                barWidth={barWidth}
                baseY={baseY}
                maxHeight={barHeight}
                normalizedHeight={d.value}
                progress={progress}
                fill={barFill}
                fillOpacity={barOpacity}
              />
            ) : null}
            <SvgText
              x={x + barWidth / 2}
              y={labelY}
              fontSize={data.length > 14 ? 8 : 9}
              fontFamily={fontFamily.regular}
              fill={d.isScheduled ? colors.textLabel : colors.settingsVersionText}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
});
