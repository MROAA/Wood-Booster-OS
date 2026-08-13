/**
 * @file BoosterNTDriver.c
 * @brief Boosterverse Windows 11 Ring 0 Kernel Driver
 * @author Marc Järvinen
 */

#ntinclude <ntddk.h>

DRIVER_UNLOAD BoosterUnload;
NTSTATUS DriverEntry(IN PDRIVER_OBJECT DriverObject, IN PUNICODE_STRING RegistryPath) {
    KdPrint(("BoosterNTDriver: DriverEntry called. Loading into Ring 0.
"));
    
    DriverObject->DriverUnload = BoosterUnload;
    
    // Luodaan laiteobjekti (Device Object)
    PDEVICE_OBJECT DeviceObject = NULL;
    UNICODE_STRING DeviceName;
    RtlInitUnicodeString(&DeviceName, L"\Device\BoosterQuantumDevice");
    
    NTSTATUS status = IoCreateDevice(
        DriverObject,
        0,
        &DeviceName,
        FILE_DEVICE_UNKNOWN,
        FILE_DEVICE_SECURE_OPEN,
        FALSE,
        &DeviceObject
    );

    if (!NT_SUCCESS(status)) {
        KdPrint(("BoosterNTDriver: Failed to create device object.
"));
        return status;
    }

    KdPrint(("BoosterNTDriver: Device object created successfully.
"));
    return STATUS_SUCCESS;
}

VOID BoosterUnload(IN PDRIVER_OBJECT DriverObject) {
    KdPrint(("BoosterNTDriver: Unloading driver from Ring 0.
"));
}
