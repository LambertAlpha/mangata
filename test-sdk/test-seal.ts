/**
 * Seal SDK 验证脚本
 * 测试加密和解密功能
 */

import { SuiClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';
import { SealClient, SessionKey } from '@mysten/seal';

async function testSeal() {
  console.log('🔐 开始测试 Seal SDK...\n');

  try {
    // 1. 创建 Sui 客户端
    console.log('📡 连接到 Sui Testnet...');
    const suiClient = new SuiClient({
      url: getFullnodeUrl('testnet'),
    });

    console.log('✅ Sui 客户端创建成功\n');

    // 2. 配置 Seal 客户端
    console.log('🔑 配置 Seal 密钥服务器...');

    // Testnet 的已知密钥服务器 Object ID
    const serverObjectIds = [
      '0x164ac3d2b3b8694b8181c13f671950004765c23f270321a45fdd04d40cccf0f2', // MiraiCloud KeyServer
    ];

    const sealClient = new SealClient({
      suiClient,
      serverConfigs: serverObjectIds.map((id) => ({
        objectId: id,
        weight: 1,
      })),
      verifyKeyServers: false, // 测试环境可以关闭验证
    });

    console.log('✅ Seal 客户端创建成功\n');

    // 3. 获取密钥服务器信息
    console.log('📋 获取密钥服务器列表...');
    const keyServers = await sealClient.getKeyServers();
    console.log(`   找到 ${keyServers.size} 个密钥服务器:`);
    for (const [id, server] of keyServers) {
      console.log(`   - ${id}`);
      console.log(`     URL: ${(server as any).url || 'N/A'}`);
    }
    console.log();

    // 4. 测试加密
    console.log('🔒 测试加密功能...');

    // 准备测试数据
    const testData = 'Hello from Mangata! This is encrypted content. 🦭';
    const dataBytes = new TextEncoder().encode(testData);

    console.log(`   原始数据: "${testData}"`);
    console.log(`   数据大小: ${dataBytes.length} bytes\n`);

    // 加密参数说明:
    // - threshold: 需要多少个密钥服务器参与解密 (这里设置为1,因为只有1个服务器)
    // - packageId: Move 包的 ID (这里使用一个测试 ID)
    // - id: 身份标识符 (可以是任何字符串,比如 NFT ID)
    console.log('   加密参数:');
    console.log('   - threshold: 1 (需要1个密钥服务器)');
    console.log('   - packageId: 0x0000000000000000000000000000000000000000000000000000000000000000');
    console.log('   - id: test-nft-123\n');

    try {
      const { encryptedObject, key } = await sealClient.encrypt({
        threshold: 1,
        packageId: '0x0000000000000000000000000000000000000000000000000000000000000000',
        id: 'test-nft-123',
        data: dataBytes,
      });

      console.log('✅ 加密成功!');
      console.log(`   加密对象大小: ${encryptedObject.length} bytes`);
      console.log(`   对称密钥长度: ${key.length} bytes`);
      console.log(`   对称密钥 (hex): ${Buffer.from(key).toString('hex').substring(0, 32)}...`);
      console.log();

      // 5. 解密说明
      console.log('📖 关于解密:');
      console.log('   Seal 的解密需要以下条件:');
      console.log('   1. SessionKey - 会话密钥 (用于认证)');
      console.log('   2. txBytes - 调用 seal_approve* 函数的交易字节');
      console.log('   3. 访问控制逻辑 - 在 Move 合约中实现');
      console.log();
      console.log('   这意味着解密必须与区块链上的访问策略绑定。');
      console.log('   对于 Mangata 项目,访问策略是: 持有特定 NFT 才能解密。\n');

      // 6. 保存加密数据供后续测试
      console.log('💾 加密数据已生成,可以存储到 Walrus');
      console.log(`   你需要在 Move 合约中实现访问控制逻辑。\n`);

      console.log('🎉 Seal SDK 基本功能验证成功!\n');
      console.log('📋 总结:');
      console.log('   ✅ SDK 安装成功');
      console.log('   ✅ 客户端创建成功');
      console.log('   ✅ 密钥服务器连接正常');
      console.log('   ✅ 加密功能正常');
      console.log('   ⚠️  解密功能需要 Move 合约支持\n');

      console.log('🔧 下一步:');
      console.log('   1. 编写 Move 合约实现访问控制 (seal_approve*)');
      console.log('   2. 将 encryptedObject 存储到 NFT 的 metadata');
      console.log('   3. 在前端实现解密逻辑 (验证 NFT 持有权后解密)\n');

    } catch (encryptError: any) {
      console.log('⚠️  加密过程遇到问题:', encryptError.message);
      console.log();
      console.log('   可能的原因:');
      console.log('   1. 密钥服务器可能暂时不可用');
      console.log('   2. 网络连接问题');
      console.log('   3. 配置参数需要调整');
      console.log();
      console.log('   建议:');
      console.log('   - 检查密钥服务器状态');
      console.log('   - 访问 Seal Discord 获取最新的 testnet 配置');
      console.log('   - 如果服务器不稳定,考虑使用降级方案\n');

      if (encryptError.stack) {
        console.log('详细错误:', encryptError.stack);
      }
    }

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error();
    console.error('详细错误:', error);
  }
}

// 运行测试
testSeal().catch(console.error);
