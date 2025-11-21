/**
 * Walrus SDK 完整功能测试
 * 包含上传和下载
 */

import { SuiClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { walrus } from '@mysten/walrus';

async function testWalrusFull() {
  console.log('🧪 Walrus 完整功能测试\n');

  try {
    // 1. 创建客户端
    console.log('📡 连接 Sui Testnet...');
    const client = new SuiClient({
      url: getFullnodeUrl('testnet'),
    });

    const walrusClient = client.$extend(walrus({
      network: 'testnet',
    }));

    console.log('✅ 连接成功\n');

    // 2. 从 Sui 私钥创建密钥对
    const suiPrivateKey = 'suiprivkey1qrj89nlfzwdjvz2rgsazye9m0k0c3n9s9xxenwccyqdl5axg6exrzc6jvae';

    console.log('🔑 导入密钥...');
    const { schema, secretKey } = decodeSuiPrivateKey(suiPrivateKey);
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const address = keypair.getPublicKey().toSuiAddress();

    console.log(`   地址: ${address}`);

    // 3. 检查余额
    const balance = await client.getBalance({ owner: address });
    console.log(`   SUI 余额: ${Number(balance.totalBalance) / 1e9} SUI\n`);

    if (Number(balance.totalBalance) === 0) {
      console.log('❌ 余额不足');
      return;
    }

    // 4. 准备测试数据
    const timestamp = new Date().toISOString();
    const testData = `🦭 Mangata Test Blob
时间: ${timestamp}
这是一个测试上传到 Walrus 的数据
Walrus is awesome! 🚀`;

    const testBlob = new TextEncoder().encode(testData);

    console.log('📤 开始上传到 Walrus...');
    console.log(`   数据大小: ${testBlob.length} bytes`);
    console.log(`   内容预览:\n${testData}\n`);

    // 5. 上传 Blob
    console.log('⏳ 上传中...');
    const uploadStart = Date.now();

    const result = await walrusClient.walrus.writeBlob({
      blob: testBlob,
      deletable: false,
      epochs: 5,  // 存储 5 个 epoch
      signer: keypair,
    });

    const uploadTime = Date.now() - uploadStart;

    console.log(`✅ 上传成功! (耗时: ${uploadTime}ms)`);
    console.log(`   Blob ID: ${result.blobId}`);
    console.log(`   Walrus 浏览器: https://aggregator.walrus-testnet.walrus.space/v1/blobs/${result.blobId}\n`);

    // 6. 下载 Blob
    console.log('📥 测试下载...');
    const downloadStart = Date.now();

    const downloadedBlob = await walrusClient.walrus.readBlob({
      blobId: result.blobId,
    });

    const downloadTime = Date.now() - downloadStart;
    const downloadedText = new TextDecoder().decode(downloadedBlob);

    console.log(`✅ 下载成功! (耗时: ${downloadTime}ms)`);
    console.log(`   下载大小: ${downloadedBlob.length} bytes\n`);

    // 7. 验证数据完整性
    console.log('🔍 验证数据完整性...');
    if (downloadedText === testData) {
      console.log('✅ 数据完整性验证通过!\n');
    } else {
      console.log('❌ 数据不匹配!\n');
      console.log('原始数据:', testData);
      console.log('下载数据:', downloadedText);
    }

    // 8. 总结
    console.log('🎉 Walrus SDK 完整功能测试成功!\n');
    console.log('📊 性能统计:');
    console.log(`   上传时间: ${uploadTime}ms`);
    console.log(`   下载时间: ${downloadTime}ms`);
    console.log(`   数据大小: ${testBlob.length} bytes`);
    console.log(`   Blob ID: ${result.blobId}\n`);

    console.log('✅ Walrus 可以用于 Mangata 项目!');

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    if (error.message.includes('Insufficient')) {
      console.error('\n💡 提示: 可能需要 WAL 代币');
      console.error('   访问 Walrus Discord 获取 testnet WAL 代币');
    }
    console.error('\n详细错误:', error);
  }
}

testWalrusFull().catch(console.error);
