import React, { useState, useEffect, useContext, useRef } from 'react'; // Added useRef
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import { CameraView, useCameraPermissions, Camera } from 'expo-camera'; // Added Camera for FlashMode
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons'; // For icons
import * as ImagePicker from 'expo-image-picker'; // For gallery access

export default function ScanScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState('off'); // 'on', 'off', 'auto', 'torch'
  const [facing, setFacing] = useState('back'); // 'front', 'back'
  // const cameraRef = useRef(null); // Not needed for flash/facing with CameraView

  useEffect(() => {
    (async () => {
      if (!permission) {
        await requestPermission();
      }
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus.status !== 'granted') {
        Alert.alert('Permissions required', 'Gallery permission is needed to pick images.');
      }
    })();
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
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

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.centered}><Text style={styles.messageText}>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.centered}>
        <Text style={styles.messageText}>We need your permission to show the camera and scan barcodes.</Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" color={theme.PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject} // This should remain to fill the background
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code128", "pdf417", "aztec", "datamatrix", "code93", "itf14", "codabar"],
        }}
        flash={flash}
        facing={facing}
      />
      {scanned && (
        <View style={styles.scannedOverlay}>
          <Text style={styles.scannedOverlayText}>Scanned!</Text>
          <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} color={theme.PRIMARY_COLOR} />
        </View>
      )}
      {/* Top Icons */}
      <View style={styles.topControlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setFlash(flash === 'off' ? 'torch' : 'off')}>
          <Ionicons name={flash === 'off' ? "flash-off-outline" : "flash-outline"} size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={async () => {
          // Navigate to gallery or pick image
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // Or true if you want editing
            quality: 1,
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            // For now, just log. Later, this could attempt to scan QR from image.
            console.log('Image picked:', result.assets[0].uri);
            Alert.alert("Image Picked", "Functionality to scan QR from image not yet implemented.");
          }
        }}>
          <Ionicons name="image-outline" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
          <Ionicons name="camera-reverse-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Scan Area Overlay */}
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
    backgroundColor: 'black', // Camera view is black
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', // Vertically center scanMarkerContainer & overlayText
    alignItems: 'center',
  },
  topControlsContainer: {
    position: 'absolute',
    top: 50, // Adjust as needed for status bar
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
    width: 280, // Adjust size as needed
    height: 200, // Adjust size as needed
    // backgroundColor: 'rgba(255,255,255,0.05)', // Slight tint for the scan area
    justifyContent: 'space-between',
  },
  corner: {
    width: 40, // Size of the corner lines
    height: 40, // Size of the corner lines
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
    // position: 'absolute', // Not needed if overlay is centering this
    // bottom: '20%', // Adjust as needed
    marginTop: 20, // Space below the scan marker
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
    color: 'white', // Usually white text on dark overlay
    fontSize: 18,
    marginBottom: 15,
  }
});
