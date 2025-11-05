import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../state/useAppStore';

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { domains, credits, actions } = useAppStore((state) => ({
    domains: state.domains,
    credits: state.credits,
    actions: state.actions
  }));

  return (
    <View style={styles.container}>
      <View style={styles.creditsContainer}>
        <Text style={styles.creditsLabel}>Available Credits</Text>
        <Text style={styles.creditsValue}>{credits}</Text>
      </View>
      <FlatList
        data={domains}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              actions.selectDomain(item);
              navigation.navigate('Domain');
            }}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <View style={styles.endpointBadge}>
              <Text style={styles.endpointText}>{item.endpoint}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={() => (
          <Text style={styles.footerText}>
            Blink credits are consumed per image analysis. Choose a domain to get started.
          </Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  creditsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb'
  },
  creditsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4
  },
  creditsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  cardDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12
  },
  endpointBadge: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f3f4f6'
  },
  endpointText: {
    fontSize: 12,
    color: '#1f2937'
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 16
  }
});

export default HomeScreen;
