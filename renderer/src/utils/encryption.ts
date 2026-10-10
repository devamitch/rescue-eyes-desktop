import { ENC_KEY } from '@/constants/env';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = ENC_KEY;

// Fixed encryption that produces consistent results
export const encryptConstants = <T>(data: T): string => {
	try {
		const jsonString = JSON.stringify(data);

		// Use explicit parameters for consistent encryption
		const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY, {
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7,
			iv: CryptoJS.enc.Hex.parse('00000000000000000000000000000000'), // Static IV for consistency
		});

		return encrypted.toString();
	} catch (error) {
		console.error('Encryption failed:', error);
		throw new Error('Encryption failed');
	}
};

export const decryptConstants = <T>(encryptedData: string): T => {
	try {
		// Use the same parameters for decryption
		const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY, {
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7,
			iv: CryptoJS.enc.Hex.parse('00000000000000000000000000000000'),
		});

		const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

		// if (!decryptedString) {
		// 	throw new Error('Decryption failed - invalid key or data');
		// }
		console.log({ decryptedString });

		return JSON?.parse(decryptedString);
	} catch (error) {
		console.error('Decryption failed:', error);
		// throw new Error('Invalid encrypted data or decryption key');
	}
};

// Alternative: Simple Base64 encoding (not secure, but consistent)
export const simpleEncrypt = <T>(data: T): string => {
	const jsonString = JSON.stringify(data);
	return CryptoJS.enc.Utf8.parse(jsonString).toString(CryptoJS.enc.Base64);
};

export const simpleDecrypt = <T>(encryptedData: string): T => {
	try {
		const decryptedString = CryptoJS.enc.Base64.parse(encryptedData).toString(
			CryptoJS.enc.Utf8
		);
		return JSON.parse(decryptedString);
	} catch (error) {
		console.error('Simple decryption failed:', error);
		throw new Error('Invalid encrypted data');
	}
};

export const generateEncryptionKey = (): string => {
	return CryptoJS.lib.WordArray.random(32).toString();
};

export const validateEncryptionKey = (key: string): boolean => {
	return key.length >= 32;
};

export const ciphertext = <T>(data: T) =>
	CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();

export const decrypt = <S extends string, T>(ciphertext: S): T => {
	const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
	const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
	return decryptedData;
};
