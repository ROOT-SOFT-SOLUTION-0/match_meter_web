import axios from 'axios';

class CloudinaryService {
  private cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  private uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  private folder = import.meta.env.VITE_CLOUDINARY_FOLDER;

  async uploadImage(
    file: File,
    customFolder?: string
  ): Promise<string> {
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error('Cloudinary configuration incomplete');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    const folder = customFolder || this.folder;
    if (folder) {
      formData.append('folder', folder);
    }

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            console.log(`Upload progress: ${percentCompleted}%`);
          },
        }
      );

      return response.data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw new Error('Image upload failed. Please try again.');
    }
  }

  getOptimizedUrl(
    url: string,
    options?: { width?: number; quality?: string; format?: string }
  ): string {
    if (!url.includes('cloudinary')) return url;

    try {
      const baseUrl = url.split('/upload/')[0] + '/upload/';
      const transformations: string[] = [];

      if (options?.width) {
        transformations.push(`w_${options.width},c_limit`);
      }
      if (options?.quality) {
        transformations.push(`q_${options.quality}`);
      }
      if (options?.format) {
        transformations.push(`f_${options.format}`);
      }

      // Always use auto format and quality
      transformations.push('f_auto,q_auto');

      const path = url.split('/upload/')[1];
      return transformations.length > 0
        ? `${baseUrl}${transformations.join(',')}/` + path
        : url;
    } catch (error) {
      console.error('Error optimizing URL:', error);
      return url;
    }
  }

  deleteImage(publicId: string): Promise<any> {
    // This requires a backend endpoint for security (don't expose delete on client)
    return axios.post('/api/cloudinary/delete', { publicId });
  }

  getThumbnailUrl(url: string): string {
    return this.getOptimizedUrl(url, { width: 200, quality: 'auto' });
  }

  getLargeImageUrl(url: string): string {
    return this.getOptimizedUrl(url, { width: 800, quality: 'auto' });
  }
}

export default new CloudinaryService();
