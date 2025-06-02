import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) {
      // Permissions are still loading.
      return;
    }
    if (!permission.granted) {
      // Permissions are not granted yet.
      // You might want to prompt the user or auto-request.
      console.log("Camera permission not granted initially.");
    }
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
    return <View style={styles.centered}><Text>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.centered}>
        <Text style={styles.messageText}>We need your permission to show the camera and scan barcodes.</Text>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code128", "pdf417", "aztec", "datamatrix", "code93", "itf14", "codabar"],
        }}
        // 'facing' prop defaults to 'back', which is usually desired.
        // 'active' prop defaults to 'true'.
      />
      {scanned && (
        <View style={styles.scannedOverlay}>
          <Text style={styles.scannedOverlayText}>Scanned!</Text>
          <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.scanMarkerContainer}>
            {/* You can add a visual marker or frame here if desired */}
        </View>
        <Text style={styles.overlayText}>Point camera at a barcode</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Ensure camera view has a background if it doesn't fill
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanMarkerContainer: { // Example for a visual marker
    width: 250,
    height: 150,
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 10,
    opacity: 0.7,
  },
  overlayText: {
    position: 'absolute',
    top: '20%', // Adjust position as needed
    fontSize: 18,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scannedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  scannedOverlayText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 15,
  }
});
