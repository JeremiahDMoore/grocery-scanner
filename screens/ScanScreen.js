import React, { useState, useEffect, useContext, useRef } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { CameraView, useCameraPermissions, Camera } from 'expo-camera';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ASYNC_STORAGE_BEEP_KEY = 'barcode_beep_enabled';

export default function ScanScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState('off');
  const [facing, setFacing] = useState('back');
  const [sound, setSound] = useState(null);
  const [isBeepEnabled, setIsBeepEnabled] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false); // New state for camera readiness
  const [cameraKey, setCameraKey] = useState(0); // Key to force camera re-render

  // Effect for camera permissions
  useEffect(() => {
    const requestCameraPermissions = async () => {
      if (!permission) {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          Alert.alert('Permissions required', 'Camera permission is needed to scan barcodes.');
        }
      }
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus.status !== 'granted') {
        Alert.alert('Permissions required', 'Gallery permission is needed to pick images.');
      }
    };
    requestCameraPermissions();
  }, [permission]);

  // Effect for loading sound and beep preference
  useEffect(() => {
    let loadedSound = null;
    const loadSoundAndPreference = async () => {
      try {
        const storedBeep = await AsyncStorage.getItem(ASYNC_STORAGE_BEEP_KEY);
        setIsBeepEnabled(storedBeep !== null ? JSON.parse(storedBeep) : true);

        console.log('Attempting to load sound...');
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/scanner-beep.wav')
        );
        loadedSound = sound;
        setSound(sound);
        console.log('Sound loaded successfully!');
      } catch (error) {
        console.error('Error loading sound or preference:', error);
        // Alert.alert('Sound Error', 'Failed to load scanner beep sound or preference.'); // Removed intrusive alert
      }
    };

    loadSoundAndPreference();

    return () => {
      if (loadedSound) {
        console.log('Unloading sound...');
        loadedSound.unloadAsync();
      }
    };
  }, []); // Empty dependency array: load sound once on mount

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    if (isBeepEnabled && sound) {
      try {
        await sound.stopAsync();
        await sound.replayAsync();
        console.log('Sound played!');
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    } else if (!isBeepEnabled) {
      console.log('Barcode beep is disabled in settings.');
    } else {
      console.log('Sound object not loaded, cannot play.');
    }
    Alert.alert(
      "Barcode Scanned",
      `Type: ${type}\nData: ${data}`,
      [
        {
          text: "OK",
          onPress: () => navigation.navigate('ProductDetail', { barcodeData: data })
        }
      ]
    );
  };

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  const handleCameraRefresh = () => {
    setIsCameraReady(false); // Show loading overlay
    setScanned(false);      // Reset scanned state
    setCameraKey(prevKey => prevKey + 1); // Increment key to force camera remount
    console.log('Camera refresh initiated.');
  };

  if (!permission) {
    return <View style={styles.centered}><Text style={styles.messageText}>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.messageText}>We need your permission to show the camera and scan barcodes.</Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" color={theme.PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isCameraReady && ( // Show loading indicator until camera is ready
        <View style={styles.cameraLoadingOverlay}>
          <ActivityIndicator size="large" color={theme.PRIMARY_COLOR} />
          <Text style={styles.messageText}>Loading camera...</Text>
        </View>
      )}
      <CameraView
        key={cameraKey} // Add key to force remount on refresh
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code128", "pdf417", "aztec", "datamatrix", "code93", "itf14", "codabar"],
        }}
        flash={flash}
        facing={facing}
        onCameraReady={onCameraReady} // Callback when camera is ready
        active={true} // Explicitly set camera active
      />
      {scanned && (
        <View style={styles.scannedOverlay}>
          <Text style={styles.scannedOverlayText}>Scanned!</Text>
          <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} color={theme.PRIMARY_COLOR} />
        </View>
      )}
      <View style={styles.topControlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setFlash(flash === 'off' ? 'torch' : 'off')}>
          <Ionicons name={flash === 'off' ? "flash-off-outline" : "flash-outline"} size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={async () => {
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            console.log('Image picked:', result.assets[0].uri);
            Alert.alert("Image Picked", "Functionality to scan QR from image not yet implemented.");
          }
        }}>
          <Ionicons name="image-outline" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
          <Ionicons name="camera-reverse-outline" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleCameraRefresh}>
          <Ionicons name="refresh-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.overlay}>
        <View style={styles.scanMarker}>
          <View style={[styles.corner, styles.topLeftCorner]} />
          <View style={[styles.corner, styles.topRightCorner]} />
          <View style={[styles.corner, styles.bottomLeftCorner]} />
          <View style={[styles.corner, styles.bottomRightCorner]} />
        </View>
        <Text style={styles.overlayHelpText}>Align barcode within the frame</Text>
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  messageText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    color: theme.TEXT_COLOR,
  },
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.BACKGROUND_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure it's above the CameraView initially
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControlsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
  },
  scanMarker: {
    width: 280,
    height: 200,
    justifyContent: 'space-between',
  },
  corner: {
    width: 40,
    height: 40,
    borderColor: 'white',
    position: 'absolute',
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  overlayHelpText: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    textAlign: 'center',
  },
  scannedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(50,50,50,0.8)',
    alignItems: 'center',
  },
  scannedOverlayText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 15,
  }
});
