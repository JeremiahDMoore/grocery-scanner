import React, { useState, useEffect, useContext, useRef } from 'react'; // Added useContext, useRef
import { View, Text, Button, Image, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ThemeContext } from '../context/ThemeContext'; // Added ThemeContext
import { Ionicons } from '@expo/vector-icons'; // For camera buttons

// Replace with your actual OCR.space API key or use a config file
const OCR_API_KEY = 'helloworld'; // IMPORTANT: Replace with your key or use 'helloworld' for free tier testing

export default function ReceiptScreen({ navigation }) {
  const { theme } = useContext(ThemeContext); // Added: Use theme
  const styles = getStyles(theme); // Dynamic styles
  const cameraRef = useRef(null); // Added for camera operations

  const [imageUri, setImageUri] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    // Request media library permissions
    (async () => {
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaLibraryStatus.status !== 'granted') {
        Alert.alert('Permissions required', 'Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  const takePhoto = async () => {
    if (!cameraPermission) {
      // Permissions are still loading
      return;
    }
    if (!cameraPermission.granted) {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert("Permissions required", "Camera permission is needed to take photos.");
        return;
      }
    }
    setShowCamera(true);
  };
  
  const onPictureSaved = async (photo) => {
    setShowCamera(false);
    setImageUri(photo.uri);
    setOcrText(''); // Clear previous OCR text
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3], // Optional: for image cropper
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setOcrText(''); // Clear previous OCR text
    }
  };

  const processImageWithOCR = async () => {
    if (!imageUri) {
      Alert.alert('No image selected', 'Please select or take an image first.');
      return;
    }
    if (OCR_API_KEY === 'helloworld' || OCR_API_KEY === 'YOUR_OCR_SPACE_KEY') {
        Alert.alert('API Key Missing', 'Please replace "helloworld" or "YOUR_OCR_SPACE_KEY" with your actual OCR.space API key in ReceiptScreen.js to use the OCR feature.');
        return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    });
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng'); // English language

    try {
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        setOcrText(result.ParsedResults[0].ParsedText);
      } else {
        console.error('OCR Error:', result);
        Alert.alert('OCR Error', result.ErrorMessage || 'Could not parse text from image.');
        setOcrText('');
      }
    } catch (error) {
      console.error('Error during OCR processing:', error);
      Alert.alert('Network Error', 'Failed to connect to OCR service.');
      setOcrText('');
    } finally {
      setIsLoading(false);
    }
  };

  if (showCamera) {
    // Ensure permissions are granted before showing camera
    if (!cameraPermission || !cameraPermission.granted) {
        return <View style={styles.centered}><Text style={styles.messageText}>Waiting for camera permission...</Text></View>;
    }
    return (
        <View style={{ flex: 1 }}>
            <CameraView 
                style={StyleSheet.absoluteFillObject}
                ref={cameraRef}
            />
            <View style={styles.cameraOverlay}>
                <TouchableOpacity style={styles.cameraCaptureButton} onPress={async () => {
                    if (cameraRef.current) {
                        try {
                            const photo = await cameraRef.current.takePictureAsync();
                            onPictureSaved(photo);
                        } catch (e) {
                            console.error("Failed to take picture", e);
                            Alert.alert("Error", "Could not take picture.");
                            setShowCamera(false);
                        }
                    }
                }}>
                    <Ionicons name="camera-outline" size={40} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraCloseButton} onPress={() => setShowCamera(false)}>
                    <Ionicons name="close-circle-outline" size={40} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Receipt Scanner</Text>
      <View style={styles.buttonContainer}>
        <Button title="Take Photo" onPress={takePhoto} disabled={!cameraPermission} color={theme.PRIMARY_COLOR} />
        <Button title="Pick Image from Gallery" onPress={pickImage} color={theme.PRIMARY_COLOR} />
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}

      {imageUri && !ocrText && (
        <View style={{marginVertical: 10}}>
          <Button
            title={isLoading ? 'Processing...' : 'Extract Text from Receipt'}
            onPress={processImageWithOCR}
            disabled={isLoading}
            color={theme.SUCCESS_COLOR}
          />
        </View>
      )}

      {ocrText ? (
        <View style={styles.ocrResultContainer}>
          <Text style={styles.ocrTitle}>Extracted Text:</Text>
          <ScrollView style={styles.ocrScrollView} nestedScrollEnabled={true}>
            <Text style={styles.ocrText}>{ocrText}</Text>
          </ScrollView>
          <Button title="Clear" onPress={() => { setImageUri(null); setOcrText(''); }} color={theme.ERROR_COLOR} />
        </View>
      ) : isLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.PRIMARY_COLOR} /><Text style={styles.loadingText}>Extracting text...</Text></View>
      ) : null}
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  messageText: {
    color: theme.TEXT_COLOR,
    fontSize: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: theme.TEXT_COLOR,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column', // Changed for better layout of buttons
    justifyContent: 'flex-end', // Buttons at bottom
    alignItems: 'center',
    paddingBottom: 30,
  },
  cameraCaptureButton: {
    padding: 15,
    borderRadius: 50, // Make it circular
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginBottom: 20,
  },
  cameraCloseButton: {
    padding: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(255,0,0,0.6)',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.INPUT_BORDER_COLOR,
  },
  ocrResultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: theme.INPUT_BACKGROUND_COLOR,
    borderRadius: 5,
  },
  ocrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.TEXT_COLOR,
  },
  ocrScrollView: {
    maxHeight: 200, // Limit height for scrollability
    marginBottom: 10,
  },
  ocrText: {
    fontSize: 14,
    color: theme.TEXT_COLOR, // Was #333
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10, // Adjusted from 20
    fontSize: 16,
    color: theme.TEXT_COLOR,
  }
});
