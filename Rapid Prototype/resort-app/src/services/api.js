// Configure via EXPO_PUBLIC_API_URL or fall back to placeholder.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.178:8000';

export const analyzeBottle = async (imageUri, roiParams = null) => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'bottle.jpg',
    });

    const toQueryString = (paramsObj) =>
      Object.entries(paramsObj)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
        )
        .join('&');

    const params =
      roiParams || {
        roi_x_percent: 0.25,
        roi_y_percent: 0.25,
        roi_width_percent: 0.5,
        roi_height_percent: 0.5,
      };

    const queryString = toQueryString(params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_URL}/api/v1/analyze?${queryString}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `HTTP ${response.status}${errorText ? `: ${errorText}` : ''}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
