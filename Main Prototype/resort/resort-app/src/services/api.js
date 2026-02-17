import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'resort_backend_url';

const DEFAULT_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://ginny-happiest-overtalkatively.ngrok-free.dev';

let cachedUrl = null;

export const getApiUrl = async () => {
  if (cachedUrl) return cachedUrl;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    cachedUrl = stored || DEFAULT_URL;
  } catch {
    cachedUrl = DEFAULT_URL;
  }
  return cachedUrl;
};

export const setApiUrl = async (url) => {
  await AsyncStorage.setItem(STORAGE_KEY, url);
  cachedUrl = url;
};

export const getDefaultUrl = () => DEFAULT_URL;

export const analyzeBottle = async (imageUri, roiParams = null) => {
  try {
    const apiUrl = await getApiUrl();

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
        roi_x_percent: 0.175,
        roi_y_percent: 0.175,
        roi_width_percent: 0.65,
        roi_height_percent: 0.65,
      };

    const queryString = toQueryString(params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${apiUrl}/api/v1/analyze?${queryString}`, {
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
