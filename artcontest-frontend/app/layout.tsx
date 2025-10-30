import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { FhevmProvider } from '../fhevm/useFhevm';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ArtContest - 链上艺术评选平台',
  description: '基于 FHEVM 同态加密的去中心化艺术作品评选竞赛平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <FhevmProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900">
            {/* 环形导航栏 */}
            <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
              <div className="relative">
                {/* 中心标志 */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full w-20 h-20 flex items-center justify-center shadow-2xl border-4 border-orange-300">
                  <div className="text-2xl animate-pulse">🏆</div>
                </div>
                
                {/* 环形导航 */}
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-300 opacity-30 animate-spin" style={{animationDuration: '20s'}}></div>
                  
                  {/* 导航项目 */}
                  <Link href="/" className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 nav-orb nav-orb-active">
                    <div className="text-lg">🏛️</div>
                    <div className="text-xs mt-1">评选</div>
                  </Link>
                  
                  <Link href="/submit" className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 nav-orb">
                    <div className="text-lg">🚀</div>
                    <div className="text-xs mt-1">提交</div>
                  </Link>
                  
                  <Link href="/rank" className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 nav-orb">
                    <div className="text-lg">🏆</div>
                    <div className="text-xs mt-1">排行</div>
                  </Link>
                  
                  <Link href="/me" className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 nav-orb">
                    <div className="text-lg">👤</div>
                    <div className="text-xs mt-1">我的</div>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* 页面标题区域 */}
            <div className="pt-32 pb-8 text-center">
              <h1 className="text-4xl font-bold trophy-gradient mb-2">
                ArtContest
              </h1>
              <p className="text-gray-400">链上艺术评选平台</p>
            </div>
            <main className="container mx-auto px-6 py-8">
              {children}
            </main>
            <footer className="border-t border-gray-700 mt-16">
              <div className="container mx-auto px-6 py-8">
                <div className="text-center text-gray-400">
                  <p className="mb-2">🎨 基于 FHEVM 同态加密技术</p>
                  <p className="text-sm">公平 · 透明 · 不可操控的艺术评选平台</p>
                </div>
              </div>
            </footer>
          </div>
        </FhevmProvider>
      </body>
    </html>
  );
}
