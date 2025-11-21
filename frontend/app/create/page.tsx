'use client';

import { useState } from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SealClient } from '@mysten/seal';
import Link from 'next/link';
import { PACKAGE_ID, MODULE_NAME, WALRUS_CONFIG, SEAL_CONFIG } from '@/lib/constants';
import { generateAESKey, encryptFile, keyToHex } from '@/lib/encryption';

export default function CreatePage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('1');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');

      // 生成预览
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      setError('请先连接钱包');
      return;
    }

    if (!file) {
      setError('请选择文件');
      return;
    }

    if (!title || !description || !price) {
      setError('请填写所有必填字段');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // 第一阶段: 加密并上传到Walrus,然后Mint空NFT

      // 1. 读取文件
      setStatus('步骤1/5: 读取文件...');
      const fileData = await file.arrayBuffer();

      // 2. 生成AES密钥并加密
      setStatus('步骤2/5: 加密文件...');
      const aesKey = generateAESKey();
      const encryptedData = encryptFile(fileData, aesKey);
      const keyHex = keyToHex(aesKey);

      console.log('AES密钥生成成功');

      // 3. 上传到Walrus (使用Upload Relay服务)
      setStatus('步骤3/5: 上传到 Walrus...');

      // 将加密数据转为Blob
      const encryptedBlob = new TextEncoder().encode(encryptedData);
      console.log('正在上传到Walrus, 大小:', encryptedBlob.length, 'bytes');

      const epochs = 5; // 存储5个epoch (约30天)
      const walrusResponse = await fetch(`${WALRUS_CONFIG.publisher}/v1/blobs?epochs=${epochs}`, {
        method: 'PUT',
        body: encryptedBlob,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      console.log('Walrus响应状态:', walrusResponse.status, walrusResponse.statusText);

      if (!walrusResponse.ok) {
        const errorText = await walrusResponse.text();
        console.error('Walrus错误详情:', errorText);
        throw new Error(`Walrus上传失败 (${walrusResponse.status}): ${errorText}`);
      }

      const walrusResult = await walrusResponse.json();
      console.log('Walrus响应数据:', walrusResult);

      // 提取blob ID (支持新创建和已存在两种情况)
      const blobId = walrusResult.newlyCreated?.blobObject?.blobId
        || walrusResult.alreadyCertified?.blobId
        || walrusResult.blobId;

      if (!blobId) {
        console.error('无法从响应中提取blobId:', walrusResult);
        throw new Error('无法获取Walrus Blob ID');
      }

      console.log('Walrus上传成功, Blob ID:', blobId);

      // 4. Mint NFT (暂时不传encrypted_metadata)
      setStatus('步骤4/5: 铸造 NFT...');
      const priceInMist = Math.floor(parseFloat(price) * 1_000_000_000);

      const mintTx = new Transaction();

      // 注意: previewUrl 如果是 Data URL 会太大,超过 16KB 限制
      // 暂时使用占位符,实际应该上传到 IPFS 或 Walrus
      const safePreviewUrl = previewUrl && previewUrl.startsWith('data:')
        ? 'https://via.placeholder.com/300'
        : (previewUrl || 'https://via.placeholder.com/300');

      mintTx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::mint_nft`,
        arguments: [
          mintTx.pure.string(blobId),
          mintTx.pure.vector('u8', []), // 明确指定空的vector<u8>
          mintTx.pure.u64(priceInMist),
          mintTx.pure.string(safePreviewUrl),
          mintTx.pure.string(title),
          mintTx.pure.string(description),
          mintTx.pure.string(file.type.startsWith('image/') ? 'image' : 'text'),
        ],
      });

      // 执行Mint交易并等待获取NFT ID
      const mintResult = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          { transaction: mintTx },
          {
            onSuccess: (result) => {
              console.log('Mint交易成功:', result);
              console.log('交易effects:', result.effects);
              resolve(result);
            },
            onError: (err) => {
              console.error('Mint交易失败:', err);
              reject(err);
            },
          }
        );
      });

      // 等待交易被索引,然后通过digest获取完整的交易数据
      console.log('等待交易被索引...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒

      const txResponse = await suiClient.getTransactionBlock({
        digest: mintResult.digest,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      console.log('完整交易数据:', txResponse);

      // 从objectChanges中查找created的NFT
      const nftObject = txResponse.objectChanges?.find(
        (change: any) => change.type === 'created' && change.objectType?.includes('ContentNFT')
      ) as any;

      const nftId = nftObject?.objectId;
      if (!nftId) {
        console.error('objectChanges:', txResponse.objectChanges);
        throw new Error('无法获取NFT ID');
      }

      console.log('NFT已创建, ID:', nftId);

      // 第二阶段: 用真实NFT ID加密AES密钥,然后更新NFT

      // 5. 使用Seal加密AES密钥 (用真实NFT ID)
      setStatus('步骤5/5: 加密密钥并更新 NFT...');
      const sealClient = new SealClient({
        suiClient,
        ...SEAL_CONFIG,
      });

      const { encryptedObject } = await sealClient.encrypt({
        threshold: 1,
        packageId: PACKAGE_ID,
        id: nftId, // 使用真实的NFT ID
        data: new TextEncoder().encode(keyHex),
      });

      console.log('Seal加密成功,正在更新NFT...');

      // 6. 更新NFT的encrypted_metadata
      const updateTx = new Transaction();
      const encryptedMetadata = Array.from(new Uint8Array(encryptedObject));
      updateTx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_encrypted_metadata`,
        arguments: [
          updateTx.object(nftId),
          updateTx.pure.vector('u8', encryptedMetadata),
        ],
      });

      signAndExecute(
        { transaction: updateTx },
        {
          onSuccess: (result) => {
            console.log('元数据更新成功:', result);
            setStatus('✅ 创建成功!');
            setUploading(false);

            // 重置表单
            setTimeout(() => {
              setFile(null);
              setTitle('');
              setDescription('');
              setPrice('1');
              setPreviewUrl('');
              setStatus('');
            }, 2000);
          },
          onError: (err) => {
            console.error('元数据更新失败:', err);
            setError(`元数据更新失败: ${err.message}。NFT已创建但未加密,ID: ${nftId}`);
            setUploading(false);
          },
        }
      );
    } catch (err: any) {
      console.error('创建失败:', err);
      setError(`创建失败: ${err.message}`);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            Mangata
          </Link>
          <ConnectButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">创建加密内容</h1>

        {!account ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">请先连接钱包以创建内容</p>
            <ConnectButton />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 文件上传 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                文件 *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-2">
                  已选择: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* 预览 */}
            {previewUrl && (
              <div>
                <label className="block text-sm font-medium mb-2">预览</label>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full h-auto max-h-64 rounded-lg border"
                />
              </div>
            )}

            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                标题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="输入内容标题"
              />
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                描述 *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="描述你的内容..."
              />
            </div>

            {/* 价格 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                价格 (SUI) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={uploading}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* 状态显示 */}
            {status && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300">{status}</p>
              </div>
            )}

            {/* 错误显示 */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading || !file}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {uploading ? '上传中...' : '创建并铸造 NFT'}
              </button>

              <Link
                href="/"
                className="px-6 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                取消
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
