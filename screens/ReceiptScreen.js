import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Replace with your actual OCR.space API key or use a config file
const OCR_API_KEY = 'helloworld'; // IMPORTANT: Replace with your key or use 'helloworld' for free tier testing

export default function ReceiptScreen({ navigation }) {
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
        // This should ideally be handled before setting showCamera to true,
        // but as a fallback:
        return <View style={styles.container}><Text>Waiting for camera permission...</Text></View>;
    }
    return (
        <CameraView 
            style={StyleSheet.absoluteFillObject}
            // onPictureSaved is not a direct prop for CameraView for saving.
            // We handle saving in the takePictureAsync callback.
            ref={ref => (this.camera = ref)} // Keep ref to call takePictureAsync
        >
            <View style={styles.cameraButtonContainer}>
                <Button title="Take Picture" onPress={async () => {
                    if (this.camera) {
                        try {
                            const photo = await this.camera.takePictureAsync();
                            onPictureSaved(photo); // Call our handler with the photo object
                        } catch (e) {
                            console.error("Failed to take picture", e);
                            Alert.alert("Error", "Could not take picture.");
                            setShowCamera(false);
                        }
                    }
                }} />
                <Button title="Cancel" onPress={() => setShowCamera(false)} />
            </View>
        </CameraView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Receipt Scanner</Text>
      <View style={styles.buttonContainer}>
        <Button title="Take Photo" onPress={takePhoto} disabled={!cameraPermission} />
        <Button title="Pick Image from Gallery" onPress={pickImage} />
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}

      {imageUri && !ocrText && (
        <Button
          title={isLoading ? 'Processing...' : 'Extract Text from Receipt'}
          onPress={processImageWithOCR}
          disabled={isLoading}
        />
      )}

      {ocrText ? (
        <View style={styles.ocrResultContainer}>
          <Text style={styles.ocrTitle}>Extracted Text:</Text>
          <Text style={styles.ocrText}>{ocrText}</Text>
          {/* TODO: Add functionality to parse text and add items to list */}
          <Button title="Clear" onPress={() => { setImageUri(null); setOcrText(''); }} />
        </View>
      ) : isLoading ? (
        <Text style={styles.loadingText}>Extracting text, please wait...</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  cameraButtonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  ocrResultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  ocrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ocrText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  }
});
