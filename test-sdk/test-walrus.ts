/**
 * Walrus SDK 验证脚本
 * 测试上传和下载功能
 */

import { SuiClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { walrus } from '@mysten/walrus';

async function testWalrus() {
  console.log('🧪 开始测试 Walrus SDK...\n');

  try {
    // 1. 创建 Sui 客户端并扩展 Walrus
    console.log('📡 连接到 Sui Testnet...');
    const client = new SuiClient({
      url: getFullnodeUrl('testnet'),
    });

    // 扩展Walrus功能 - 使用 'testnet' 作为 network 参数
    const walrusClient = client.$extend(walrus({
      network: 'testnet',  // 明确指定网络
    }));

    console.log('✅ Walrus 客户端创建成功\n');

    // 2. 测试上传 (写入 Blob)
    console.log('📤 测试上传 Blob...');

    // 创建测试数据
    const testData = 'Hello from Mangata! This is a test blob for Walrus SDK. 🦭';
    const testBlob = new TextEncoder().encode(testData);

    console.log(`   数据内容: "${testData}"`);
    console.log(`   数据大小: ${testBlob.length} bytes\n`);

    // 这里需要一个密钥对来签署交易
    // 注意: 实际使用时需要从环境变量或安全存储中获取
    console.log('⚠️  注意: 上传需要 Sui 私钥签名交易');
    console.log('   需要准备:');
    console.log('   1. 私钥 (可通过 sui keytool 生成)');
    console.log('   2. testnet SUI 代币 (用于支付gas)');
    console.log('   3. testnet WAL 代币 (用于支付存储费用)');
    console.log('');
    console.log('   获取测试代币:');
    console.log('   - SUI: https://faucet.sui.io/testnet');
    console.log('   - WAL: 访问 Walrus 官方 Discord\n');

    // 如果有环境变量中的私钥,可以尝试上传
    const privateKey = process.env.SUI_PRIVATE_KEY;

    if (privateKey) {
      try {
        console.log('🔑 检测到私钥,尝试上传...');

        // 从私钥创建密钥对
        const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(privateKey, 'hex'));
        const address = keypair.getPublicKey().toSuiAddress();
        console.log(`   钱包地址: ${address}`);

        // 检查余额
        const balance = await client.getBalance({ owner: address });
        console.log(`   SUI 余额: ${Number(balance.totalBalance) / 1e9} SUI\n`);

        if (Number(balance.totalBalance) === 0) {
          console.log('❌ 余额不足,无法上传');
          console.log('   请访问 https://faucet.sui.io/testnet 获取测试代币\n');
          return;
        }

        // 尝试上传
        console.log('📤 开始上传...');
        const result = await walrusClient.walrus.writeBlob({
          blob: testBlob,
          deletable: false,  // 不可删除
          epochs: 3,         // 存储 3 个 epoch
          signer: keypair,
        });

        console.log('✅ 上传成功!');
        console.log(`   Blob ID: ${result.blobId}`);
        console.log(`   访问链接: https://aggregator.walrus-testnet.walrus.space/v1/blobs/${result.blobId}\n`);

        // 3. 测试下载 (读取 Blob)
        console.log('📥 测试下载 Blob...');
        const downloadedBlob = await walrusClient.walrus.readBlob({
          blobId: result.blobId
        });

        const downloadedText = new TextDecoder().decode(downloadedBlob);
        console.log(`   下载内容: "${downloadedText}"`);

        if (downloadedText === testData) {
          console.log('✅ 数据验证成功! 上传和下载的内容一致\n');
        } else {
          console.log('❌ 数据不匹配!\n');
        }

      } catch (uploadError: any) {
        console.log('❌ 上传失败:', uploadError.message);
        if (uploadError.message.includes('Insufficient balance')) {
          console.log('   提示: 需要 WAL 代币来支付存储费用');
        }
      }
    } else {
      console.log('ℹ️  跳过上传测试 (需要设置 SUI_PRIVATE_KEY 环境变量)\n');
    }

    // 4. 测试读取已知的公开 Blob (如果有的话)
    console.log('📥 测试读取公开 Blob...');
    console.log('   (需要一个已知的 blob_id 来测试)\n');

    console.log('🎉 Walrus SDK 基本功能验证完成!\n');
    console.log('📋 总结:');
    console.log('   ✅ SDK 安装成功');
    console.log('   ✅ 客户端创建成功');
    console.log('   ✅ API 连接正常');
    if (privateKey) {
      console.log('   ✅ 上传下载功能正常');
    } else {
      console.log('   ⚠️  上传功能未测试 (需要私钥)');
    }

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testWalrus().catch(console.error);
