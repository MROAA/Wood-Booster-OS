import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const win96Core = require('../build/Release/win96_core.node');

export interface SystemStats {
    totalMemory: number;
    freeMemory: number;
    activeLayers: number;
    timestamp: number;
}

export interface WindowNodeData {
    id: number;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    visible: boolean;
}

export interface KernelTaskData {
    taskId: number;
    name: string;
    priority: number;
}

export interface IPCMessageData {
    sender: string;
    receiver: string;
    payload: string;
}

export interface PageTableEntryData {
    pageId: number;
    present: boolean;
    dirty: boolean;
}

export class WoodBoosterCore {
    public static getSystemStats(): SystemStats {
        return typeof win96Core.getSystemStats === 'function' ? win96Core.getSystemStats() : { totalMemory: 0, freeMemory: 0, activeLayers: 33, timestamp: Date.now() };
    }

    public static vfsWrite(path: string, content: string): boolean {
        return typeof win96Core.vfsWrite === 'function' ? win96Core.vfsWrite(path, content) : false;
    }

    public static vfsRead(path: string): string {
        return typeof win96Core.vfsRead === 'function' ? win96Core.vfsRead(path) : '';
    }

    public static vfsList(): string[] {
        return typeof win96Core.vfsList === 'function' ? win96Core.vfsList() : [];
    }

    public static compositorUpsert(window: WindowNodeData): boolean {
        return typeof win96Core.compositorUpsert === 'function' ? win96Core.compositorUpsert(
            window.id, window.title, window.x, window.y, window.width, window.height, window.zIndex, window.visible
        ) : false;
    }

    public static compositorGetList(): WindowNodeData[] {
        return typeof win96Core.compositorGetList === 'function' ? win96Core.compositorGetList() : [];
    }

    public static smInitialize(): boolean {
        return typeof win96Core.smInitialize === 'function' ? win96Core.smInitialize() : false;
    }

    public static smExecute(command: string): string {
        return typeof win96Core.smExecute === 'function' ? win96Core.smExecute(command) : 'ERR_CORE_NOT_LOADED';
    }

    public static kernelAddTask(taskId: number, name: string, priority: number): boolean {
        return typeof win96Core.kernelAddTask === 'function' ? win96Core.kernelAddTask(taskId, name, priority) : false;
    }

    public static kernelGetTasks(): KernelTaskData[] {
        return typeof win96Core.kernelGetTasks === 'function' ? win96Core.kernelGetTasks() : [];
    }

    public static hbAllocate(size: number): boolean {
        return typeof win96Core.hbAllocate === 'function' ? win96Core.hbAllocate(size) : false;
    }

    public static hbGetSize(): number {
        return typeof win96Core.hbGetSize === 'function' ? win96Core.hbGetSize() : 0;
    }

    public static ipcSend(sender: string, receiver: string, payload: string): boolean {
        return typeof win96Core.ipcSend === 'function' ? win96Core.ipcSend(sender, receiver, payload) : false;
    }

    public static ipcReceive(receiver: string): IPCMessageData[] {
        return typeof win96Core.ipcReceive === 'function' ? win96Core.ipcReceive(receiver) : [];
    }

    public static hwSetReg(reg: string, val: number): boolean {
        return typeof win96Core.hwSetReg === 'function' ? win96Core.hwSetReg(reg, val) : false;
    }

    public static hwGetReg(reg: string): number {
        return typeof win96Core.hwGetReg === 'function' ? win96Core.hwGetReg(reg) : 0;
    }

    // Uudet sivutus- ja keskeytysmetodit
    public static vmPagingSet(pageId: number, present: boolean, dirty: boolean): boolean {
        return typeof win96Core.vmPagingSet === 'function' ? win96Core.vmPagingSet(pageId, present, dirty) : false;
    }

    public static vmPagingGet(pageId: number): PageTableEntryData {
        return typeof win96Core.vmPagingGet === 'function' ? win96Core.vmPagingGet(pageId) : { pageId, present: false, dirty: false };
    }

    public static ivtRegister(irq: number, name: string): boolean {
        return typeof win96Core.ivtRegister === 'function' ? win96Core.ivtRegister(irq, name) : false;
    }

    public static ivtTrigger(irq: number): string {
        return typeof win96Core.ivtTrigger === 'function' ? win96Core.ivtTrigger(irq) : 'ERR_IVT_NOT_LOADED';
    }
}
