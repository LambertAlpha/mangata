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
  // 将 ArrayBuffer 转换为 WordArray
  const wordArray = CryptoJS.lib.WordArray.create(fileData as any);

  // 加密
  const encrypted = CryptoJS.AES.encrypt(wordArray, key);

  return encrypted.toString();
}

/**
 * 使用AES解密文件
 */
export function decryptFile(
  encryptedData: string,
  key: string
): ArrayBuffer {
  // 解密
  const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Hex.parse(key));

  // 转换为 ArrayBuffer
  const words = decrypted.words;
  const sigBytes = decrypted.sigBytes;
  const u8 = new Uint8Array(sigBytes);

  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }

  return u8.buffer;
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
