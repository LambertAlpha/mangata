/**
 * Mangata 项目配置常量
 */

// Move 合约配置
export const PACKAGE_ID = '0xa34269e2ad14ad20bf494bf41585a360908e01ac65397a9c33b91bda8d6faf39';

export const MODULE_NAME = 'content_nft';

// Sui 网络配置
export const NETWORK = 'testnet';

// Walrus 配置
export const WALRUS_CONFIG = {
  network: 'testnet' as const,
  aggregator: 'https://aggregator.walrus-testnet.walrus.space',
  publisher: 'https://publisher.walrus-testnet.walrus.space',
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
