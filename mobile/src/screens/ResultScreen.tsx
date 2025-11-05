import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../state/useAppStore';

const ResultScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedDomain, lastResponse, uploadState, actions } = useAppStore((state) => ({
    selectedDomain: state.selectedDomain,
    lastResponse: state.lastResponse,
    uploadState: state.uploadState,
    actions: state.actions
  }));

  const formattedResponse = useMemo(() => {
    if (!lastResponse) {
      return 'No analysis has been performed yet. Upload an image to receive a response.';
    }

    try {
      return JSON.stringify(lastResponse, null, 2);
    } catch (error) {
      return 'Unable to format response payload.';
    }
  }, [lastResponse]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Domain</Text>
        <View style={styles.domainCard}>
          <Text style={styles.domainName}>{selectedDomain?.name ?? 'Not specified'}</Text>
          <Text style={styles.domainEndpoint}>{selectedDomain?.endpoint ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Upload Status</Text>
        <Text style={styles.statusText}>{uploadState.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Response</Text>
        <View style={styles.responseContainer}>
          <Text style={styles.codeText}>{formattedResponse}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          actions.resetFlow();
          navigation.navigate('Home');
        }}
      >
        <Text style={styles.primaryButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff'
  },
  section: {
    marginBottom: 24
  },
  sectionLabel: {
    fontSize: 13,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12
  },
  domainCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f9fafb'
  },
  domainName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  domainEndpoint: {
    fontSize: 12,
    color: '#1f2937',
    marginTop: 6
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  responseContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    padding: 16
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#111827'
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111827'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ResultScreen;
