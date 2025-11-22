/**
 * Mangata 项目配置常量
 */

// Move 合约配置
export const PACKAGE_ID = '0x7af4462412eaa8960280a485f168693e2b4731d387c2e8a210b7264832fca9d0';

export const MODULE_NAME = 'content_nft';
export const MARKETPLACE_MODULE = 'marketplace';
export const MARKETPLACE_ID = '0x93db1e3c2ef5261cf28336cb831f8ab3ff421d15e8c83f40351fa0b84a601207';

// Sui 网络配置
export const NETWORK = 'testnet';

// Walrus 配置
export const WALRUS_CONFIG = {
  network: 'testnet' as const,
  aggregator: 'https://aggregator.walrus-testnet.walrus.space',
  publisher: 'https://publisher.walrus-testnet.walrus.space',
  uploadRelay: 'https://upload-relay.testnet.walrus.space', // 公共上传中继服务
};

// Seal 配置
export const SEAL_CONFIG = {
  serverConfigs: [
    {
      objectId: '0x164ac3d2b3b8694b8181c13f671950004765c23f270321a45fdd04d40cccf0f2',
      weight: 1,
    },
  ],
  verifyKeyServers: false,
};

// 内容类型
export const CONTENT_TYPES = {
  IMAGE: 'image',
  TEXT: 'text',
  VIDEO: 'video',
} as const;

export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];
