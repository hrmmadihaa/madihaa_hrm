const CLOUD_NAME = 'dxcj44eln';
const UPLOAD_PRESET = 'delivery-hub';

export const uploadImage = async (file: File, folder: string = 'employee_images', employeeId?: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    // If employeeId is provided, use it as the public_id
    if (employeeId) {
      formData.append('public_id', `${folder}/${employeeId}`);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const getOptimizedImageUrl = (publicId: string, width: number = 300, height: number = 300, quality: string = 'auto'): string => {
  // Cloudinary URL transformation for optimization
  const transformations = [
    `w_${width}`,
    `h_${height}`,
    'c_fill',
    `q_${quality}`,
    'f_auto'
  ].join(',');

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
};

export const deleteImage = async (_publicId: string): Promise<void> => {
  // Note: This requires server-side API with signature
  // For client-side, you'll need to create a backend endpoint
  console.warn('deleteImage requires server-side API. Implement a backend endpoint for deletion.');
  throw new Error('Image deletion requires server-side API');
};
