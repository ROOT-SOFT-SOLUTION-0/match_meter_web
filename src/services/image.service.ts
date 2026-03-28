/**
 * Image Service - Handles image encoding/decoding for Firebase storage
 * Optimized for Firestore storage with automatic compression
 */

class ImageService {
  /**
   * Convert File to compressed base64 string
   * @param file - Image file to convert
   * @returns Promise that resolves to compressed base64 string
   */
  async compressAndEncode(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions for profile pic
          const MAX_SIZE = 400;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Get compressed base64
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          // Return without prefix for storage if needed, or with it for compatibility
          // Most apps use with prefix for simplicity
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  }

  /**
   * Simple base64 for display (backwards compatibility or direct load)
   * @param base64OrDataUrl - Image data
   * @returns Clean data URL
   */
  ensureDataUrl(base64OrDataUrl: string): string {
    if (!base64OrDataUrl) return '';
    if (base64OrDataUrl.startsWith('data:')) return base64OrDataUrl;
    return `data:image/jpeg;base64,${base64OrDataUrl}`;
  }

  /**
   * Get image size in MB
   */
  getFileSizeMB(file: File): number {
    return file.size / (1024 * 1024);
  }

  /**
   * Validate image file
   */
  validateImageFile(
    file: File,
    maxSizeMB: number = 5 // Increased as we compress anyway
  ): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid image type. Please use JPEG, PNG, or WebP',
      };
    }

    if (this.getFileSizeMB(file) > maxSizeMB) {
      return {
        valid: false,
        error: `Image size must be less than ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }
}

export default new ImageService();
