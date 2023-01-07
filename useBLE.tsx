import { PermissionsAndroid, Platform } from "react-native";


type PermissionCallback = (result: boolean) => void

interface BluetoothLowEnergyApi {
    requestPermissions(callback: PermissionCallback): Promise<void>;
}

export default function useBLE(): BluetoothLowEnergyApi {
    const requestPermissions = async (callback: PermissionCallback) => {
        if (Platform.OS === 'android') {
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
            callback(grantedStatus === PermissionsAndroid.RESULTS.GRATED)

        }
        else{
            callback(true);
        }
    }
    return {
        requestPermissions,
    }
}
