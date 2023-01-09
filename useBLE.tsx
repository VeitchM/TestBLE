import { PermissionsAndroid, Platform, } from "react-native";
import { useState } from 'react'
import {
    BleError,
    BleManager,
    Characteristic,
    Device,
    Service
} from 'react-native-ble-plx';

import DeviceInfo from 'react-native-device-info';
import { PERMISSIONS, requestMultiple } from 'react-native-permissions';

type PermissionCallback = (result: boolean) => void

const bleManager = new BleManager();
interface BluetoothLowEnergyApi {
    requestPermissions(callback: PermissionCallback): Promise<void>;
    scanForDevices(): void;
    allDevices: Device[];
    connectToDevice(device:Device): Promise<void>;
}

export default function useBLE(): BluetoothLowEnergyApi {

    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [device, setConnectedDevice] = useState<Device|null>(null);

    const requestPermissions = async (callback: PermissionCallback) => {
        if (Platform.OS === 'android') {
            const apiLevel = await DeviceInfo.getApiLevel();
            if (apiLevel < 31) {
                const grantedStatus = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location permission",
                        message: "Bluetooth Low Energy Need Location permission",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK",
                        buttonNeutral: "Maybe Later"
                    }
                );
                callback(grantedStatus === PermissionsAndroid.RESULTS.GRANTED)

            }

            else {
                const result = await requestMultiple([
                    PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                ]);

                const isGranted =
                    result['android.permission.BLUETOOTH_CONNECT'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_SCAN'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] ===
                    PermissionsAndroid.RESULTS.GRANTED;
                callback(isGranted)
            }
        }
        else {
            callback(true);
        }
    }

    const isDuplicateDevice = (devices: Device[], nextDevice: Device): boolean =>
        devices.findIndex((device => nextDevice.id === device.id)) > -1;


    const scanForDevices = () => {
        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error)
               console.log(error);            
            if (device && device.name) {
                setAllDevices((prevState: Device[]) => {
                    if (!isDuplicateDevice(prevState, device)) {
                        console.log(prevState);
                        return [...prevState, device]
                    }
                    return prevState
                })
            }
        })
    }

    const connectToDevice = async (device:Device)  =>  {
        try{
            console.log("device: ", device);
            console.log("device.id : ",device.id);
            console.log('device.name : ',device.name);
            
            

            
            const deviceConnection = await bleManager.connectToDevice(device.id)
            setConnectedDevice(deviceConnection);
            const aux : Device= await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();
            alert("Connected to "+deviceConnection.name);
            console.log("Blabla",deviceConnection);
            const services : Service[] = await aux.services()
            //device.readCharacteristicForService()
            console.log('Aaauxilair ', aux   );
            console.log('Aaauxilair ', aux.id   );

            console.log('Services ', services   );
            console.log('Services 0 ', services[0]   );
            console.log('Services 1 ', services[1]   );
            console.log('cantidad de servicios',services.length);
            
            const characteristics = await services[0].characteristics()
            console.log('Services 0  Characteristics', characteristics,' el largo ', characteristics.length   );
            const characteristics2 = await services[1].characteristics()
            console.log('Services 0  Characteristics', characteristics2, ' el largo ', characteristics2.length  );
            const characteristics3 = await services[2].characteristics()
            console.log('Services 0  Characteristics', characteristics3, ' el largo ', characteristics3.length  );



            //device.monitorCharacteristicForService(services[0].uuid)


        }
        catch(e){
            console.log('error aaaaah ' ,e);
            
        }
    }

    const startStreamingData = async (device:Device) => {
        if(device){
            device.monitorCharacteristicForService(
                "", 
                "",
                () => {

                }   
                         )
        }
        else{

        }
    }

    return {
        requestPermissions,
        scanForDevices,
        allDevices,
        connectToDevice
    }
}
