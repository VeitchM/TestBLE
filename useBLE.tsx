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

import { atob } from 'react-native-quick-base64';

type PermissionCallback = (result: boolean) => void

const bleManager = new BleManager();
interface BluetoothLowEnergyApi {
    requestPermissions(callback: PermissionCallback): Promise<void>;
    scanForDevices(): void;
    allDevices: Device[];
    connectToDevice(device: Device): Promise<void>;
    disconnectFromDevice(): Promise<void>;
    connectedDevice : Device | null;
    bleMessage : string;
}

export default function useBLE(): BluetoothLowEnergyApi {

    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [bleMessage, setBleMessage] = useState<string>('')

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

    const connectToDevice = async (device: Device) => {
        const MTU = 255
        const showChar = (chars: Characteristic[]): string => {
            let info = ''
            chars.forEach((char) => info += 'Char uuid ' + char.uuid + ' Service uuid ' + char.serviceUUID)
            return info
        }

        try {





            const deviceConnection = await bleManager.connectToDevice(device.id, { requestMTU: MTU })
            setConnectedDevice(deviceConnection);
            const aux: Device = await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();
            console.log("Blabla", deviceConnection);
            const services: Service[] = await aux.services()
            setServices(services);

            let auxCharacteristic: Characteristic[];
            let auxCharacteristics: Characteristic[] = [];
            for (let i = 0; i < services.length; i++) {
                auxCharacteristic = await services[i].characteristics();
                auxCharacteristics.push(...auxCharacteristic)
            }


            startStreamingData(device, auxCharacteristics)



            //device.monitorCharacteristicForService(services[0].uuid)


        }
        catch (e) {
            console.log('error aaaaah ', e);

        }
    }

    const startStreamingData = async (device: Device, auxCharacteristics: Characteristic[]) => {
        if (device) {
            for (let index = 0; index < auxCharacteristics.length; index++) {
                console.log(

                    'charac length ', auxCharacteristics.length
                );
                console.log('Index ', index, ' characteristicUUID ', auxCharacteristics[index].uuid, ' ServiceUUID ', auxCharacteristics[index].serviceUUID);


                device.monitorCharacteristicForService(
                    auxCharacteristics[index].serviceUUID,
                    auxCharacteristics[index].uuid,
                    (error, result) => {
                        if (error) {
                            console.log('Error monitor', error);
                        }
                        const answer = result ? atob(result.value as string) : '';
                        console.log('Monitor i:', index, ' result:', answer);
                        setBleMessage(answer);

                    }
                )
            }
        }
        else {
            console.log('Error no device ', device);

        }
    }

    const disconnectFromDevice = async () => {
        if (connectedDevice) {
            await bleManager.cancelDeviceConnection(connectedDevice.id);
            setConnectedDevice(null);
        }
    }

    return {
        requestPermissions,
        scanForDevices,
        allDevices,
        connectToDevice,
        disconnectFromDevice,
        connectedDevice,
        bleMessage
    }
}
