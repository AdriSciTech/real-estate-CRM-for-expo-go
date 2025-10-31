// src/components/common/CustomSearchBar.tsx

import React, { useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CustomSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function CustomSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFocus,
  onBlur,
}: CustomSearchBarProps) {
  const inputRef = useRef<TextInput>(null);

  const handleClear = useCallback(() => {
    onChangeText('');
    // Keep focus on input after clearing
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
  }, [onChangeText]);

  return (
    <View style={styles.container}>
      <Icon name="search" size={20} color="#86939e" style={styles.searchIcon} />
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#86939e"
        autoCorrect={false}
        autoCapitalize="none"
        blurOnSubmit={false}
        returnKeyType="search"
        onFocus={onFocus}
        onBlur={onBlur}
        clearButtonMode="never" // We use custom clear button
        enablesReturnKeyAutomatically={true}
        // Performance optimizations
        maxLength={100}
        selectTextOnFocus={false}
      />
      {value.length > 0 && (
        <TouchableOpacity 
          onPress={handleClear} 
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="clear" size={20} color="#86939e" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginVertical: 10,
    height: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#43484d',
    padding: 0,
    margin: 0,
    ...Platform.select({
      ios: {
        paddingVertical: 8,
      },
      android: {
        paddingVertical: 4,
      },
    }),
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
  },
});