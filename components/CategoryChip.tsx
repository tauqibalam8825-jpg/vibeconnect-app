import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  count?: number;
}

export default function CategoryChip({ label, active, onPress, count }: Props) {
  const { theme } = useApp();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.chipActiveBg : theme.colors.chipBg,
          borderColor: active ? theme.colors.chipActiveBg : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: active ? theme.colors.chipActiveText : theme.colors.textSecondary },
        ]}
      >
        {label}
        {typeof count === 'number' ? ` · ${count}` : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
