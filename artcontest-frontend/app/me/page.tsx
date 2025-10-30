'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import type { Eip1193Provider } from 'ethers';
import { useFhevm } from '../../fhevm/useFhevm';
import { useContest } from '../../hooks/useContest';
import { ContractEntry, DecryptedEntry } from '../../fhevm/fhevmTypes';
import Link from 'next/link';

export default function MePage() {
  const { fhevm, isLoading: fhevmLoading, error: fhevmError } = useFhevm();
  const { getAllEntries, decryptScores, getCategoryVotes, isLoading } = useContest();
  
  const [userAddress, setUserAddress] = useState<string>('');
  const [myEntries, setMyEntries] = useState<ContractEntry[]>([]);
  const [decryptedEntries, setDecryptedEntries] = useState<DecryptedEntry[]>([]);
  const [categoryVotes, setCategoryVotes] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (fhevm && !fhevmLoading) {
      initializeUser();
    }
  }, [fhevm, fhevmLoading]);

  const initializeUser = async () => {
    try {
      if (!window || !window.ethereum) {
        throw new Error('未检测到以太坊钱包 (window.ethereum)');
      }
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
      await loadMyEntries(address);
    } catch (error) {
      console.error('初始化用户信息失败:', error);
    }
  };

  const loadMyEntries = async (address: string) => {
    try {
      const allEntries = await getAllEntries();
      const userEntries = allEntries.filter(entry => 
        entry.contestant.toLowerCase() === address.toLowerCase()
      );
      setMyEntries(userEntries);
    } catch (error) {
      console.error('加载我的参赛作品失败:', error);
    }
  };

  const handleDecryptMyScores = async () => {
    try {
      const decrypted = await decryptScores(myEntries);
      setDecryptedEntries(decrypted);
    } catch (error) {
      console.error('解密评分失败:', error);
      alert('解密失败，请重试');
    }
  };

  const handleDecryptCategoryVotes = async (entryId: number, categories: string[]) => {
    try {
      const votes = await getCategoryVotes(entryId, categories);
      setCategoryVotes(prev => new Map(prev).set(entryId.toString(), votes));
    } catch (error) {
      console.error('解密类别投票失败:', error);
      alert('解密失败，请重试');
    }
  };

  const getTotalVotes = (entryId: string) => {
    const votes = categoryVotes.get(entryId);
    if (!votes) return 0;
    return Object.values(votes).reduce((sum: number, vote: any) => sum + vote.votes, 0);
  };

  if (fhevmLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">正在初始化 FHEVM...</p>
        </div>
      </div>
    );
  }

  if (fhevmError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-red-400 mb-4">{fhevmError}</p>
          <button
            onClick={() => window.location.reload()}
            className="contest-button px-6 py-2 rounded-lg"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          <span className="trophy-gradient">👤 我的参赛作品</span>
        </h1>
        <p className="text-gray-400 text-lg">
          查看你的参赛作品和评选表现
        </p>
        {userAddress && (
          <p className="text-sm text-gray-500 mt-2">
            钱包地址: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </p>
        )}
      </div>

      {/* 统计信息 */}
      {myEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-primary mb-2">{myEntries.length}</div>
            <div className="text-gray-400">参赛作品</div>
          </div>
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-secondary mb-2">
              {decryptedEntries.reduce((sum, entry) => sum + entry.scores, 0)}
            </div>
            <div className="text-gray-400">总评分</div>
          </div>
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-accent mb-2">
              {Array.from(categoryVotes.values()).reduce((sum, votes) => {
                return sum + Object.values(votes).reduce((voteSum: number, vote: any) => voteSum + vote.votes, 0);
              }, 0)}
            </div>
            <div className="text-gray-400">总投票数</div>
          </div>
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {myEntries.reduce((sum, entry) => sum + entry.categories.length, 0)}
            </div>
            <div className="text-gray-400">参赛类别</div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => userAddress && loadMyEntries(userAddress)}
          disabled={isLoading}
          className="contest-button px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {isLoading ? '🔄 加载中...' : '🔄 刷新数据'}
        </button>
        {myEntries.length > 0 && (
          <button
            onClick={handleDecryptMyScores}
            disabled={isLoading}
            className="contest-button px-6 py-3 rounded-lg disabled:opacity-50"
          >
            🔓 解密我的评分
          </button>
        )}
        <Link
          href="/submit"
          className="contest-button px-6 py-3 rounded-lg inline-block"
        >
          🚀 提交新作品
        </Link>
      </div>

      {/* 我的作品列表 */}
      {myEntries.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-gray-400 text-lg mb-4">你还没有提交任何参赛作品</p>
          <Link href="/submit" className="contest-button px-6 py-3 rounded-lg">
            🚀 提交第一个作品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myEntries.map((entry) => {
            const decryptedEntry = decryptedEntries.find(d => d.id === entry.id);
            const entryVotes = categoryVotes.get(entry.id.toString());

            return (
              <div key={entry.id.toString()} className="contest-card p-6 rounded-xl">
                {/* 作品标题 */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2">{entry.title}</h3>
                  <p className="text-sm text-gray-400">
                    提交时间: {new Date(Number(entry.timestamp) * 1000).toLocaleString('zh-CN')}
                  </p>
                </div>

                {/* 作品信息 */}
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">描述哈希:</div>
                  <div className="text-xs bg-gray-800 p-2 rounded break-all">
                    {entry.descriptionHash}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">文件哈希:</div>
                  <div className="text-xs bg-gray-800 p-2 rounded break-all">
                    {entry.fileHash}
                  </div>
                </div>

                {/* 标签 */}
                {entry.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">创作标签:</div>
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 参赛类别 */}
                {entry.categories.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">参赛类别:</div>
                    <div className="flex flex-wrap gap-1">
                      {entry.categories.map((category, index) => (
                        <span key={index} className="category-tag">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 评分和投票数据 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      ⭐ {decryptedEntry ? decryptedEntry.scores : '?'}
                    </div>
                    <div className="text-sm text-gray-400">评分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary mb-1">
                      🗳️ {getTotalVotes(entry.id.toString())}
                    </div>
                    <div className="text-sm text-gray-400">总票数</div>
                  </div>
                </div>

                {/* 类别投票详情 */}
                {entryVotes && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">各类别票数:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(entryVotes).map(([category, vote]: [string, any]) => (
                        <div key={category} className="text-xs bg-gray-800 p-2 rounded">
                          <span className="text-gray-400">{category}: </span>
                          <span className="text-white font-bold">{vote.votes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleDecryptCategoryVotes(Number(entry.id), entry.categories)}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {isLoading ? '🔄 解密中...' : '🔓 解密类别投票'}
                  </button>
                </div>

                {/* 表现分析 */}
                {decryptedEntry && entryVotes && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">表现分析:</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>平均每类别票数:</span>
                        <span className="text-primary">
                          {(getTotalVotes(entry.id.toString()) / entry.categories.length).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>评分/投票比:</span>
                        <span className="text-secondary">
                          {getTotalVotes(entry.id.toString()) > 0 
                            ? (decryptedEntry.scores / getTotalVotes(entry.id.toString())).toFixed(2)
                            : '0.00'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 提示信息 */}
      <div className="contest-card p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-3 text-primary">💡 数据说明</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            评分数据：其他用户对你作品的评分统计
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            投票数据：按类别统计的投票数量，用于排行榜排名
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            所有数据通过 FHEVM 同态加密技术保护隐私
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            作为作品创作者，你有权查看自己作品的所有数据
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            数据实时更新，反映最新的评选结果
          </li>
        </ul>
      </div>
    </div>
  );
}
