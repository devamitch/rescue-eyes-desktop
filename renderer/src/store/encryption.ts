import CryptoJS from 'crypto-js';

const SECRET_KEY = 'your-secret-key-here'; // In a real app, this should be securely stored and not hardcoded

export const customEncryptedStorage = {
	setItem: (key: string, value: any) => {
		const encryptedValue = CryptoJS.AES.encrypt(JSON.stringify(value), SECRET_KEY).toString();
		localStorage.setItem(key, encryptedValue);
	},
	getItem: (key: string) => {
		const encryptedValue = localStorage.getItem(key);
		if (encryptedValue) {
			const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
			const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);
			return JSON.parse(decryptedValue);
		}
		return null;
	},
	removeItem: (key: string) => {
		localStorage.removeItem(key);
	},
};
