import * as FileSystem from 'expo-file-system';

export const uploadToCloudinary = async (imageUri) => {
  console.log('Starting Cloudinary upload for:', imageUri);

  // variabilele de mediu 
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Missing required Cloudinary environment variables. Please check EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  }

  try {
    // citeste fisierul ca base64
    console.log('Reading file as base64...');
    const base64Img = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('File read successfully, size:', base64Img.length);

    // pregateste FormData
    const formData = new FormData();
    formData.append('file', `data:image/jpeg;base64,${base64Img}`);
    formData.append('upload_preset', uploadPreset);

    console.log('Sending to Cloudinary...');
    // trimite efectiv la Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('Cloudinary upload result:', result);
    
    if (result.error) {
      console.error('Cloudinary error:', result.error);
      throw new Error(`Cloudinary upload failed: ${result.error.message}`);
    }
    
    console.log('Upload successful, URL:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Error in uploadToCloudinary:', error);
    throw error;
  }
};
