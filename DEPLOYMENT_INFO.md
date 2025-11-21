# Mangata 部署信息

> 生成时间: 2025-11-21
> 网络: Sui Testnet

## 🔐 Move 合约

### Package ID
```
0xa34269e2ad14ad20bf494bf41585a360908e01ac65397a9c33b91bda8d6faf39
```

### 模块
- `mangata::content_nft`

### 部署交易
- Digest: `E2HitWJM4XkBT6rZGAum4M8TxysCfPBhE1efdGJzALrJ`
- Explorer: https://testnet.suivision.xyz/txblock/E2HitWJM4XkBT6rZGAum4M8TxysCfPBhE1efdGJzALrJ

### UpgradeCap
- ObjectID: `0xf6de7eeef441caca1632a0f6e090062630d403bf2807164e6fe2c7c1c342db59`

## 🔒 Seal 配置

### 密钥服务器
```typescript
const serverConfigs = [{
  objectId: '0x164ac3d2b3b8694b8181c13f671950004765c23f270321a45fdd04d40cccf0f2',
  weight: 1,
}];
```

### 密钥服务器 URL
- https://open.key-server.testnet.seal.mirai.cloud

### 加密参数
- Threshold: 1
- Package ID: (使用上面的 Package ID)
- ID: (使用 NFT 的 Object ID)

## 🦭 Walrus 配置

### Network
- testnet

### Aggregator URL
- https://aggregator.walrus-testnet.walrus.space

### Publisher URL
- https://publisher.walrus-testnet.walrus.space

### Upload Relay
- https://upload-relay.testnet.walrus.space

## 📋 核心函数

### mint_nft
```typescript
target: `${packageId}::content_nft::mint_nft`
arguments: [
  blob_id,           // Walrus blob ID
  encrypted_metadata, // Seal 加密的元数据
  price,             // NFT 价格 (MIST)
  preview_url,       // 预览图 URL
  title,             // 标题
  description,       // 描述
  content_type,      // 内容类型
]
```

### purchase_nft
```typescript
target: `${packageId}::content_nft::purchase_nft`
arguments: [
  nft,      // ContentNFT 对象
  payment,  // Coin<SUI> 支付
]
```

## 👤 部署账户

- Address: `0x2783bec4e12c4649d77da1da31cd65500786ea636a1fb8b7950c5b8a4fffe6b1`
- Alias: agitated-prase

## 📝 待办事项

- [ ] 获取 WAL 代币用于 Walrus 测试上传
  - Discord: https://discord.gg/sui
  - 访问 #walrus-testnet 频道

- [ ] 前端开发
  - [ ] Next.js 项目初始化
  - [ ] 集成 @mysten/dapp-kit
  - [ ] 实现上传流程
  - [ ] 实现市场页面
  - [ ] 实现解密查看

## 🔗 有用的链接

- Sui Explorer: https://testnet.suivision.xyz/
- Sui Faucet: https://faucet.sui.io/testnet
- Walrus Docs: https://docs.wal.app/
- Seal Docs: https://seal-docs.wal.app/
- Sui Discord: https://discord.gg/sui
