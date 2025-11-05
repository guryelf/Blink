import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../state/useAppStore';
import { uploadImageToDomain, type UploadPayload } from '../utils/apiClient';

const DomainScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedDomain, credits, uploadState, selectedImageUri, error, actions } = useAppStore((state) => ({
    selectedDomain: state.selectedDomain,
    credits: state.credits,
    uploadState: state.uploadState,
    selectedImageUri: state.selectedImageUri,
    error: state.error,
    actions: state.actions
  }));
  const [asset, setAsset] = useState<UploadPayload | null>(null);

  const handlePickImage = useCallback(async () => {
    actions.setError(null);
    actions.setUploadState('selecting');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      actions.setUploadState('idle');
      Alert.alert('Permission required', 'Media library permission is needed to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.85
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      actions.setUploadState('idle');
      return;
    }

    const picked = result.assets[0];
    const payload: UploadPayload = {
      uri: picked.uri,
      type: picked.type ?? 'image/jpeg',
      name: picked.fileName ?? picked.uri.split('/').pop()
    };

    setAsset(payload);
    actions.setSelectedImageUri(picked.uri);
    actions.setUploadState('idle');
  }, [actions]);

  const handleUpload = useCallback(async () => {
    if (!selectedDomain || !asset) {
      Alert.alert('Missing information', 'Please choose a domain and select an image first.');
      return;
    }

    try {
      actions.setUploadState('uploading');
      const response = await uploadImageToDomain(selectedDomain, asset);
      actions.setResponse(response);
      actions.setCredits(Math.max(0, credits - 1));
      actions.setUploadState('success');
      actions.setError(null);
      navigation.navigate('Result');
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Failed to upload image';
      actions.setError(message);
      actions.setUploadState('error');
    }
  }, [actions, asset, credits, navigation, selectedDomain]);

  if (!selectedDomain) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No domain selected</Text>
        <Text style={styles.emptyDescription}>
          Return to the home screen and choose a domain before uploading an image.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.primaryButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Selected Domain</Text>
        <View style={styles.domainCard}>
          <Text style={styles.domainName}>{selectedDomain.name}</Text>
          <Text style={styles.domainDescription}>{selectedDomain.description}</Text>
          <Text style={styles.domainEndpoint}>{selectedDomain.endpoint}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Credits Remaining</Text>
        <View style={styles.creditsPill}>
          <Text style={styles.creditsText}>{credits}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Image</Text>
        {selectedImageUri ? (
          <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage} disabled={uploadState === 'uploading'}>
          <Text style={styles.secondaryButtonText}>
            {selectedImageUri ? 'Change Image' : 'Choose Image'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.primaryButton, uploadState === 'uploading' && styles.primaryButtonDisabled]}
          onPress={handleUpload}
          disabled={!selectedImageUri || uploadState === 'uploading'}
        >
          {uploadState === 'uploading' ? (
            <View style={styles.loaderWrapper}>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.loaderText}>Uploading...</Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>Upload to {selectedDomain.name}</Text>
          )}
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
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
    color: '#111827',
    marginBottom: 6
  },
  domainDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8
  },
  domainEndpoint: {
    fontSize: 12,
    color: '#1f2937'
  },
  creditsPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6'
  },
  creditsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  placeholder: {
    height: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb'
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280'
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500'
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111827'
  },
  primaryButtonDisabled: {
    opacity: 0.7
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  loaderWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  loaderText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    marginTop: 12
  },
  emptyState: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyDescription: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 16
  }
});

export default DomainScreen;
