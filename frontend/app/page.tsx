'use client';

import { ConnectButton } from '@mysten/dapp-kit';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Mangata</h1>
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-3xl text-center space-y-6">
          <h2 className="text-5xl font-bold">
            去中心化内容订阅平台
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-400">
            基于 Sui 区块链、Walrus 存储和 Seal 加密
          </p>

          <p className="text-lg">
            创作者可以上传加密内容并铸造 NFT，用户购买 NFT 后即可解密查看完整内容
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/create"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              创建内容
            </Link>

            <Link
              href="/marketplace"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              浏览市场
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-5xl">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-bold mb-2">真正的隐私</h3>
            <p className="text-gray-600 dark:text-gray-400">
              内容在客户端加密，Walrus 仅存储密文
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-bold mb-2">抗审查</h3>
            <p className="text-gray-600 dark:text-gray-400">
              去中心化存储，内容不会被删除或篡改
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-bold mb-2">创作者主权</h3>
            <p className="text-gray-600 dark:text-gray-400">
              100% 收益归创作者，平台不抽成
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Mangata - Powered by Sui, Walrus & Seal</p>
      </footer>
    </div>
  );
}
