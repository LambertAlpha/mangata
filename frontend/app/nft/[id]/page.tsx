'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SealClient } from '@mysten/seal';
import Link from 'next/link';
import { PACKAGE_ID, MODULE_NAME, SEAL_CONFIG } from '@/lib/constants';
import { decryptFile } from '@/lib/encryption';

interface NFTDetail {
  id: string;
  blobId: string;
  creator: string;
  owner: string;
  title: string;
  description: string;
  price: string; // SUI
  priceInMist: string; // MIST
  previewUrl: string;
  contentType: string;
  createdAt: string;
  encryptedMetadata: number[];
}

export default function NFTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const nftId = params.id as string;

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [nft, setNft] = useState<NFTDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);

  useEffect(() => {
    loadNFT();
  }, [nftId]);

  const loadNFT = async () => {
    try {
      setLoading(true);
      setError('');

      const obj = await suiClient.getObject({
        id: nftId,
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      if (!obj.data) {
        throw new Error('NFT不存在');
      }

      const fields = (obj.data.content as any).fields;
      const owner = (obj.data.owner as any)?.AddressOwner || '';

      const detail: NFTDetail = {
        id: nftId,
        blobId: fields.blob_id,
        creator: fields.creator,
        owner,
        title: fields.title,
        description: fields.description,
        price: (parseInt(fields.price) / 1_000_000_000).toFixed(2),
        priceInMist: fields.price,
        previewUrl: fields.preview_url,
        contentType: fields.content_type,
        createdAt: new Date(parseInt(fields.created_at)).toLocaleString('zh-CN'),
        encryptedMetadata: fields.encrypted_metadata,
      };

      setNft(detail);
    } catch (err: any) {
      console.error('加载NFT失败:', err);
      setError(`加载失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!account || !nft) return;

    try {
      setPurchasing(true);
      setError('');

      const tx = new Transaction();

      // 分割gas coin作为payment
      const [coin] = tx.splitCoins(tx.gas, [parseInt(nft.priceInMist)]);

      // 调用purchase_nft
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::purchase_nft`,
        arguments: [
          tx.object(nftId),
          coin,
        ],
      });

      await new Promise<void>((resolve, reject) => {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              console.log('购买成功:', result);
              alert('购买成功!正在刷新页面...');
              // 延迟刷新,等待区块链索引
              setTimeout(() => {
                loadNFT();
                resolve();
              }, 2000);
            },
            onError: (err) => {
              console.error('购买失败:', err);
              setError(`购买失败: ${err.message}`);
              reject(err);
            },
          }
        );
      });
    } catch (err: any) {
      console.error('购买失败:', err);
      setError(`购买失败: ${err.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!account || !nft) return;

    try {
      setDecrypting(true);
      setError('');

      // 检查是否有加密元数据
      if (!nft.encryptedMetadata || nft.encryptedMetadata.length === 0) {
        throw new Error('此NFT没有加密元数据');
      }

      // 使用Seal解密AES密钥
      const sealClient = new SealClient({
        suiClient,
        ...SEAL_CONFIG,
      });

      console.log('正在使用Seal解密AES密钥...');
      const { decryptedData } = await sealClient.decrypt({
        packageId: PACKAGE_ID,
        id: nftId,
        encryptedObject: new Uint8Array(nft.encryptedMetadata),
      });

      const keyHex = new TextDecoder().decode(decryptedData);
      console.log('AES密钥解密成功');

      // TODO: 从Walrus下载加密内容
      // 目前Walrus还没有上传真实内容,所以暂时跳过这一步
      console.log('⚠️ Walrus下载功能待实现,blob ID:', nft.blobId);

      // 暂时显示成功消息
      alert('解密成功!密钥已获取。\n\n注意:Walrus下载功能待实现,无法显示完整内容。');

      /* 完整的解密流程(待Walrus修复后使用):

      // 从Walrus下载加密内容
      const walrusResponse = await fetch(
        `${WALRUS_CONFIG.aggregator}/v1/${nft.blobId}`
      );

      if (!walrusResponse.ok) {
        throw new Error('从Walrus下载失败');
      }

      const encryptedData = await walrusResponse.text();

      // 使用AES密钥解密内容
      const decryptedBuffer = decryptFile(encryptedData, keyHex);

      // 根据内容类型显示
      if (nft.contentType === 'image') {
        const blob = new Blob([decryptedBuffer]);
        const url = URL.createObjectURL(blob);
        setDecryptedContent(url);
      } else {
        const text = new TextDecoder().decode(decryptedBuffer);
        setDecryptedContent(text);
      }
      */

    } catch (err: any) {
      console.error('解密失败:', err);
      setError(`解密失败: ${err.message}`);
    } finally {
      setDecrypting(false);
    }
  };

  const isOwner = account && nft && account.address === nft.owner;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            Mangata
          </Link>
          <div className="flex gap-4 items-center">
            <Link
              href="/marketplace"
              className="text-sm hover:underline"
            >
              返回市场
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {nft && (
          <div className="space-y-6">
            {/* Preview Image */}
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={nft.previewUrl}
                alt={nft.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{nft.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{nft.description}</p>
            </div>

            {/* Info Grid */}
            <div className="grid md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">价格</p>
                <p className="text-2xl font-bold text-blue-600">{nft.price} SUI</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">内容类型</p>
                <p className="text-lg">{nft.contentType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">创作者</p>
                <p className="text-sm font-mono truncate">{nft.creator}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">当前持有者</p>
                <p className="text-sm font-mono truncate">{nft.owner}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">创建时间</p>
                <p className="text-sm">{nft.createdAt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-500">NFT ID</p>
                <p className="text-sm font-mono truncate">{nft.id}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {!account && (
                <div className="flex-1 p-4 text-center border rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    请先连接钱包
                  </p>
                  <ConnectButton />
                </div>
              )}

              {account && !isOwner && (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {purchasing ? '购买中...' : `购买 (${nft.price} SUI)`}
                </button>
              )}

              {isOwner && (
                <div className="flex-1 space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      ✅ 你是此NFT的持有者
                    </p>
                  </div>

                  <button
                    onClick={handleDecrypt}
                    disabled={decrypting}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {decrypting ? '解密中...' : '解密并查看完整内容'}
                  </button>

                  {decryptedContent && (
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-bold mb-2">解密后的内容:</h3>
                      {nft.contentType === 'image' ? (
                        <img src={decryptedContent} alt="Decrypted" className="max-w-full" />
                      ) : (
                        <pre className="whitespace-pre-wrap break-words">{decryptedContent}</pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
