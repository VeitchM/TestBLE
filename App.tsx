/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import useBLE from './useBLE';

import DeviceModal from './DeviceConnectionModal';

import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from 'react-native-ble-plx';



const App = () => {


  
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const { bleMessage ,requestPermissions, scanForDevices, allDevices, connectToDevice, disconnectFromDevice, connectedDevice } = useBLE();

  const openModal = async () => {
    requestPermissions((isGranted: boolean) => {
      console.log("The Android Permissions were granted : " + isGranted);
      if (isGranted) {
        scanForDevices()
        setIsModalVisible(true);
      }
    })
  }

  const hideModal = () => {
    setIsModalVisible(false);
  };




  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heartRateTitleWrapper}>
         {connectedDevice ? 
          <>
            <Text style={styles.heartRateTitleText}>The message from: {connectedDevice.name} is</Text>
            <Text style={styles.heartRateText}>{bleMessage}</Text>
          </>
          
         : 
        <Text style={styles.heartRateTitleText}>
          Please connect to a BLE device
        </Text>
        }
      </View>
      <TouchableOpacity style={styles.ctaButton} onPress={connectedDevice ? disconnectFromDevice : openModal}>
        <Text style={styles.ctaButtonText}>{connectedDevice ? 'Disconnect' : 'Connect'}</Text>
      </TouchableOpacity>

      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  heartRateTitleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartRateTitleText: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 20,
    color: 'black',
  },
  heartRateText: {
    fontSize: 25,
    marginTop: 15,
  },
  ctaButton: {
    backgroundColor: 'purple',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default App;