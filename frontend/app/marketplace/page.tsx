'use client';

import { useState, useEffect } from 'react';
import { ConnectButton, useSuiClient } from '@mysten/dapp-kit';
import Link from 'next/link';
import { PACKAGE_ID, MODULE_NAME, MARKETPLACE_MODULE } from '@/lib/constants';

interface NFTData {
  id: string;
  blobId: string;
  creator: string;
  title: string;
  description: string;
  price: string; // SUI (converted from MIST)
  previewUrl: string;
  contentType: string;
  createdAt: string;
}

export default function MarketplacePage() {
  const suiClient = useSuiClient();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      setError('');

      // 查询所有NFTListed事件 (在marketplace上架的NFT)
      const listedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::${MARKETPLACE_MODULE}::NFTListed`,
        },
        limit: 50,
        order: 'descending',
      });

      console.log('查询到的Listed事件:', listedEvents);

      // 查询所有NFTDelisted事件 (从marketplace下架的NFT)
      const delistedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::${MARKETPLACE_MODULE}::NFTDelisted`,
        },
        limit: 50,
        order: 'descending',
      });

      // 查询所有NFTPurchased事件 (已售出的NFT)
      const purchasedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::${MARKETPLACE_MODULE}::NFTPurchased`,
        },
        limit: 50,
        order: 'descending',
      });

      // 构建已下架和已售出的NFT ID集合
      const delistedIds = new Set(
        delistedEvents.data.map((event: any) => event.parsedJson.nft_id)
      );
      const purchasedIds = new Set(
        purchasedEvents.data.map((event: any) => event.parsedJson.nft_id)
      );

      // 过滤出仍在售的NFT (已上架但未下架且未售出)
      const activeListings = listedEvents.data.filter((event: any) => {
        const nftId = event.parsedJson.nft_id;
        return !delistedIds.has(nftId) && !purchasedIds.has(nftId);
      });

      console.log('当前在售的NFT:', activeListings);

      if (activeListings.length === 0) {
        setNfts([]);
        setLoading(false);
        return;
      }

      // 直接从事件中解析NFT数据(NFT元数据已包含在事件中)
      const parsedNfts: NFTData[] = activeListings.map((event: any) => {
        const data = event.parsedJson;
        return {
          id: data.nft_id,
          blobId: data.blob_id,
          creator: data.seller,
          title: data.title,
          description: data.description,
          price: (parseInt(data.price) / 1_000_000_000).toFixed(2),
          previewUrl: data.preview_url,
          contentType: data.content_type,
          createdAt: new Date(parseInt(data.created_at)).toLocaleString('zh-CN'),
        };
      });

      console.log('解析后的NFT列表:', parsedNfts);
      setNfts(parsedNfts);
    } catch (err: any) {
      console.error('加载NFT失败:', err);
      setError(`加载失败: ${err.message}`);
    } finally {
      setLoading(false);
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
          <div className="flex gap-4 items-center">
            <Link
              href="/create"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              创建内容
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">内容市场</h1>
          <button
            onClick={loadNFTs}
            disabled={loading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && nfts.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              还没有任何内容
            </p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              成为第一个创作者
            </Link>
          </div>
        )}

        {/* NFT Grid */}
        {!loading && nfts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <Link
                key={nft.id}
                href={`/nft/${nft.id}`}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                {/* Preview Image */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                  <img
                    src={nft.previewUrl}
                    alt={nft.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg truncate">{nft.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {nft.description}
                  </p>

                  {/* Price & Type */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-blue-600">
                      {nft.price} SUI
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                      {nft.contentType}
                    </span>
                  </div>

                  {/* Creator & Date */}
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    <p className="truncate">创作者: {nft.creator}</p>
                    <p>{nft.createdAt}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
