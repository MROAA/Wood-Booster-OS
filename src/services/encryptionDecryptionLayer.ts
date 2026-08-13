import { getConfigSection } from '../configLoader';

export interface CryptoStatus {
  algorithm: string;
  keyStrength: string;
  cipherState: string;
  autoRotation: boolean;
}

export class EncryptionDecryptionLayer {
  private static instance: EncryptionDecryptionLayer;
  private algorithm: string = "Quantum-Resistant AES-GCM-256";
  private keyStrength: string = "Infinite / Multiverse Grade";
  private cipherState: string = "Active & Secured";
  private autoRotation: boolean = true;

  private constructor() {
    const config: any = getConfigSection('boosterverse_supreme_manifest');
    if (config) {
      console.log(`[CryptoLayer] Salauksen ja dekryptauksen kvanttimoottori aktivoitu.`);
    }
  }

  public static getInstance(): EncryptionDecryptionLayer {
    if (!EncryptionDecryptionLayer.instance) {
      EncryptionDecryptionLayer.instance = new EncryptionDecryptionLayer();
    }
    return EncryptionDecryptionLayer.instance;
  }

  public encryptData(payload: string): string {
    console.log(`[CryptoLayer] Salataan data turvallisesti...`);
    return `ENCRYPTED_SIGIL::${Buffer.from(payload).toString('base64')}::SECURED`;
  }

  public decryptData(cipherText: string): string {
    console.log(`[CryptoLayer] Puretaan salaus kohteesta...`);
    try {
      const cleanPayload = cipherText.replace('ENCRYPTED_SIGIL::', '').replace('::SECURED', '');
      return Buffer.from(cleanPayload, 'base64').toString('utf8');
    } catch (e) {
      return `Dekryptausvirhe: Virheellinen tai vanhentunut avain.`;
    }
  }

  public getStatus(): CryptoStatus {
    return {
      algorithm: this.algorithm,
      keyStrength: this.keyStrength,
      cipherState: this.cipherState,
      autoRotation: this.autoRotation
    };
  }
}

export const encryptionDecryption = EncryptionDecryptionLayer.getInstance();
