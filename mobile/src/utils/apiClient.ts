import { Platform } from 'react-native';
import type { Domain } from '../config/domains';

export type UploadPayload = {
  uri: string;
  name?: string;
  type?: string;
};

export const uploadImageToDomain = async (
  domain: Domain,
  asset: UploadPayload
): Promise<Record<string, unknown>> => {
  const formData = new FormData();
  const fileName = asset.name ?? asset.uri.split('/').pop() ?? 'upload.jpg';
  const mimeType = asset.type ?? 'image/jpeg';

  formData.append('file', {
    uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
    name: fileName,
    type: mimeType
  } as any);

  const response = await fetch(domain.endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json'
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload image');
  }

  return (await response.json()) as Record<string, unknown>;
};
