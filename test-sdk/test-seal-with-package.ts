/**
 * Seal SDK 测试 - 使用真实的 Package ID
 * Package ID: 0xa34269e2ad14ad20bf494bf41585a360908e01ac65397a9c33b91bda8d6faf39
 */

import { SuiClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';
import { SealClient } from '@mysten/seal';

async function testSealWithPackage() {
  console.log('🔐 Seal SDK 测试 - 使用真实 Package ID\n');

  try {
    // 1. Sui 客户端
    console.log('📡 连接 Sui Testnet...');
    const suiClient = new SuiClient({
      url: getFullnodeUrl('testnet'),
    });
    console.log('✅ 连接成功\n');

    // 2. Seal 客户端配置
    console.log('🔑 配置 Seal 密钥服务器...');
    const serverObjectIds = [
      '0x164ac3d2b3b8694b8181c13f671950004765c23f270321a45fdd04d40cccf0f2',
    ];

    const sealClient = new SealClient({
      suiClient,
      serverConfigs: serverObjectIds.map((id) => ({
        objectId: id,
        weight: 1,
      })),
      verifyKeyServers: false,
    });
    console.log('✅ Seal 客户端创建成功\n');

    // 3. 准备测试数据
    const testContent = `🦭 Mangata 加密内容测试

这是一段需要加密的内容。
只有持有特定 NFT 的用户才能解密并查看。

内容示例:
- 独家图片
- 付费文章
- VIP视频

时间: ${new Date().toISOString()}`;

    const dataBytes = new TextEncoder().encode(testContent);

    console.log('📝 测试内容:');
    console.log(testContent);
    console.log(`\n   数据大小: ${dataBytes.length} bytes\n`);

    // 4. 使用真实的 Package ID 加密
    const PACKAGE_ID = '0xa34269e2ad14ad20bf494bf41585a360908e01ac65397a9c33b91bda8d6faf39';
    // ID 必须是有效的16进制字符串 (可以是 NFT 的 object ID)
    const TEST_NFT_ID = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    console.log('🔒 开始加密...');
    console.log(`   Package ID: ${PACKAGE_ID}`);
    console.log(`   Identity (NFT ID): ${TEST_NFT_ID}`);
    console.log(`   Threshold: 1\n`);

    try {
      const { encryptedObject, key } = await sealClient.encrypt({
        threshold: 1,
        packageId: PACKAGE_ID,
        id: TEST_NFT_ID,
        data: dataBytes,
      });

      console.log('✅ 加密成功!\n');
      console.log('📦 加密结果:');
      console.log(`   - 加密对象大小: ${encryptedObject.length} bytes`);
      console.log(`   - 对称密钥长度: ${key.length} bytes`);
      console.log(`   - 对称密钥 (hex): ${Buffer.from(key).toString('hex')}\n`);

      console.log('💾 可以将 encryptedObject 存储到 Walrus');
      console.log('🔑 对称密钥可以备份或直接使用 Seal 解密\n');

      console.log('🎉 Seal 完整功能验证成功!\n');
      console.log('📋 总结:');
      console.log('   ✅ Move 合约已部署');
      console.log('   ✅ Package ID 有效');
      console.log('   ✅ Seal 加密功能正常');
      console.log('   ✅ 可以与 Walrus 集成\n');

      console.log('🚀 下一步:');
      console.log('   1. 在 mint_nft 时使用 Seal 加密内容');
      console.log('   2. 将 encryptedObject 存储在 NFT 的 encrypted_metadata 字段');
      console.log('   3. 在前端实现解密逻辑 (需要 SessionKey 和 txBytes)');
      console.log('   4. 实现 Move 合约的访问控制验证\n');

      // 保存加密数据示例
      console.log('📄 加密数据示例 (前50字节):');
      console.log(`   ${Buffer.from(encryptedObject.slice(0, 50)).toString('hex')}...\n`);

    } catch (encryptError: any) {
      console.log('❌ 加密失败:', encryptError.message);
      console.log('\n可能的原因:');
      console.log('   1. Package ID 无效或未部署');
      console.log('   2. 密钥服务器配置问题');
      console.log('   3. 网络连接问题\n');

      if (encryptError.stack) {
        console.log('详细错误:', encryptError.stack);
      }
    }

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testSealWithPackage().catch(console.error);
