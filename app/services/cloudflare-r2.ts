import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';

// Conditional import for FileSystem - only available after rebuild
let FileSystem: any = null;
try {
  FileSystem = require('expo-file-system');
} catch (error) {
  console.warn('expo-file-system not available. Please rebuild the app with: npx expo prebuild && npx expo run:android');
}

// Cloudflare R2 Upload Service
// This service handles uploading images, videos, and 3D models to Cloudflare R2

export interface UploadResponse {
  url: string;
  key: string;
  type: 'image' | 'video' | '3d_model';
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class CloudflareR2Service {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Upload a single file to Cloudflare R2
   * @param uri - Local file URI
   * @param type - File type (image, video, 3d_model)
   * @param authToken - User authentication token
   * @param onProgress - Optional progress callback
   */
  async uploadFile(
    uri: string,
    type: 'image' | 'video' | '3d_model',
    authToken: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    try {
      // Check if FileSystem is available
      if (!FileSystem) {
        throw new Error('FileSystem module not available. Please rebuild the app.');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Determine file extension and mime type
      const fileName = uri.split('/').pop() || 'file';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      const mimeType = this.getMimeType(fileExtension, type);

      // Create form data
      const formData = new FormData();

      // Add file to form data
      const file: any = {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: fileName,
        type: mimeType,
      };

      formData.append('file', file);
      formData.append('type', type);

      // Upload to backend which will handle R2 upload
      const response = await fetch(`${this.baseUrl}/upload/r2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return {
        url: data.url,
        key: data.key,
        type: type,
      };
    } catch (error: any) {
      console.error('R2 Upload Error:', error);
      throw new Error(error.message || 'Failed to upload file');
    }
  }

  /**
   * Upload multiple files to Cloudflare R2
   * @param files - Array of file URIs and types
   * @param authToken - User authentication token
   * @param onProgress - Optional progress callback for each file
   */
  async uploadMultipleFiles(
    files: Array<{ uri: string; type: 'image' | 'video' | '3d_model' }>,
    authToken: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResponse[]> {
    const results: UploadResponse[] = [];

    for (let i = 0; i < files.length; i++) {
      const { uri, type } = files[i];

      const result = await this.uploadFile(
        uri,
        type,
        authToken,
        onProgress ? (progress) => onProgress(i, progress) : undefined
      );

      results.push(result);
    }

    return results;
  }

  /**
   * Delete a file from Cloudflare R2
   * @param key - File key/path in R2
   * @param authToken - User authentication token
   */
  async deleteFile(key: string, authToken: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/upload/r2/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete file');
      }
    } catch (error: any) {
      console.error('R2 Delete Error:', error);
      throw new Error(error.message || 'Failed to delete file');
    }
  }

  /**
   * Get mime type based on file extension and type
   */
  private getMimeType(extension: string, type: 'image' | 'video' | '3d_model'): string {
    // Image types
    if (type === 'image') {
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        default:
          return 'image/jpeg';
      }
    }

    // Video types
    if (type === 'video') {
      switch (extension) {
        case 'mp4':
          return 'video/mp4';
        case 'mov':
          return 'video/quicktime';
        case 'avi':
          return 'video/x-msvideo';
        case 'webm':
          return 'video/webm';
        default:
          return 'video/mp4';
      }
    }

    // 3D model types
    if (type === '3d_model') {
      switch (extension) {
        case 'glb':
          return 'model/gltf-binary';
        case 'gltf':
          return 'model/gltf+json';
        case 'obj':
          return 'model/obj';
        case 'fbx':
          return 'model/fbx';
        default:
          return 'model/gltf-binary';
      }
    }

    return 'application/octet-stream';
  }

  /**
   * Validate file size (max 50MB for images, 200MB for videos, 100MB for 3D models)
   */
  async validateFileSize(uri: string, type: 'image' | 'video' | '3d_model'): Promise<boolean> {
    try {
      if (!FileSystem) {
        return true; // Skip validation if FileSystem not available
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        return false;
      }

      const size = fileInfo.size || 0;
      const maxSizes = {
        image: 50 * 1024 * 1024, // 50MB
        video: 200 * 1024 * 1024, // 200MB
        '3d_model': 100 * 1024 * 1024, // 100MB
      };

      return size <= maxSizes[type];
    } catch (error) {
      console.error('File size validation error:', error);
      return false;
    }
  }

  /**
   * Get file size in human-readable format
   */
  async getFileSize(uri: string): Promise<string> {
    try {
      if (!FileSystem) {
        return '0 B';
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        return '0 B';
      }

      const size = fileInfo.size || 0;
      const units = ['B', 'KB', 'MB', 'GB'];
      let unitIndex = 0;
      let fileSize = size;

      while (fileSize >= 1024 && unitIndex < units.length - 1) {
        fileSize /= 1024;
        unitIndex++;
      }

      return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
    } catch (error) {
      return '0 B';
    }
  }
}

export const cloudflareR2Service = new CloudflareR2Service();
