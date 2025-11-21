/**
 * 加密工具函数
 */

import CryptoJS from 'crypto-js';

/**
 * 生成随机的AES密钥
 */
export function generateAESKey(): CryptoJS.lib.WordArray {
  return CryptoJS.lib.WordArray.random(256 / 8); // 256 bits
}

/**
 * 使用AES加密文件
 */
export function encryptFile(
  fileData: ArrayBuffer,
  key: CryptoJS.lib.WordArray
): string {
  // 将 ArrayBuffer 转换为 Base64 字符串(分块处理避免栈溢出)
  const uint8Array = new Uint8Array(fileData);
  let binaryString = '';
  const chunkSize = 8192; // 每次处理8KB
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64String = btoa(binaryString);

  // 使用 AES 加密 Base64 字符串
  // 注意: CryptoJS.AES.encrypt 需要的是字符串形式的key或passphrase
  const encrypted = CryptoJS.AES.encrypt(base64String, key.toString(CryptoJS.enc.Hex));

  return encrypted.toString();
}

/**
 * 使用AES解密文件
 */
export function decryptFile(
  encryptedData: string,
  keyHex: string
): ArrayBuffer {
  // 从 Hex 创建密钥
  const key = CryptoJS.enc.Hex.parse(keyHex);

  // 解密得到 Base64 字符串
  const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
  const base64String = decrypted.toString(CryptoJS.enc.Utf8);

  // 将 Base64 转回 ArrayBuffer
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * 将密钥转换为hex字符串
 */
export function keyToHex(key: CryptoJS.lib.WordArray): string {
  return key.toString(CryptoJS.enc.Hex);
}

/**
 * 从hex字符串创建密钥
 */
export function hexToKey(hex: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Hex.parse(hex);
}
