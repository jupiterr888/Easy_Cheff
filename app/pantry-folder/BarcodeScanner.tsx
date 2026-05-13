import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '@/constants/Styles';
import { styles } from './styles/BarcodeScanner.styles';

export default function BarcodeScannerScreen() {
  // state pentru permisiune camera, cod scanat, referinta camera
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // handler pentru codul scanat
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setScannedCode(data);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Camera access denied.</Text>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <Text style={styles.title}>Let’s Scan Something</Text>
        <Text style={styles.subtitle}>Point the camera at a barcode</Text>

        <View style={styles.scannerContainer}>
          <Text style={styles.questionText}>Don't have a barcode? Add ingredients manually</Text>
          {/* buton pentru adaugare manuala */}
          <TouchableOpacity style={styles.button} onPress={() => router.push('/pantry-folder/myIngredients')}>
            <Text style={styles.buttonText}>Add Manually</Text>
          </TouchableOpacity>
        </View>

        {/* camera pentru scanare cod */}
        {!scanned ? (
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'ean13', 'ean8', 'code39', 'code128', 'upc_a', 'upc_e', 'itf14'], // codurile suportate
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.frame}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
              </View>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.resultContainer}>
            <Text style={styles.resultTitle}>Code Detected:</Text>
            <Text style={styles.resultCode}>{scannedCode}</Text>
            <Text style={styles.questionTextResult}>Is this code correct?</Text>

            <TouchableOpacity style={commonStyles.secondaryButton} onPress={() => setScanned(false)}>
              <Text style={commonStyles.secondaryButtonText}>Scan Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[commonStyles.primaryButton, { marginTop: 10 }]}
              onPress={() =>
                router.replace({
                  pathname: '/pantry-folder/BarcodeResults',
                  params: { scannedCode },
                })
              }
            >
              <Text style={commonStyles.primaryButtonText}>Check The Details</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
}



