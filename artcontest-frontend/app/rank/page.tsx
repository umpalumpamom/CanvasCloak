'use client';

import { useState, useEffect } from 'react';
import { useFhevm } from '../../fhevm/useFhevm';
import { useContest } from '../../hooks/useContest';
import { ContractEntry } from '../../fhevm/fhevmTypes';

export default function RankPage() {
  const { fhevm, isLoading: fhevmLoading, error: fhevmError } = useFhevm();
  const { getAllEntries, batchDecryptCategoryVotes, isLoading } = useContest();
  
  const [entries, setEntries] = useState<ContractEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('绘画');
  const [rankings, setRankings] = useState<{ entryId: bigint; votes: number }[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const availableCategories = ['绘画', '摄影', '数字艺术', '雕塑', '装置艺术', '概念艺术'];

  useEffect(() => {
    if (fhevm && !fhevmLoading) {
      loadEntries();
    }
  }, [fhevm, fhevmLoading]);

  const loadEntries = async () => {
    try {
      const allEntries = await getAllEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error('加载参赛作品失败:', error);
    }
  };

  const handleDecryptCategory = async () => {
    if (!selectedCategory) return;
    
    setIsDecrypting(true);
    try {
      const categoryRankings = await batchDecryptCategoryVotes(entries, selectedCategory);
      setRankings(categoryRankings);
    } catch (error) {
      console.error('解密失败:', error);
      alert('解密失败，请重试');
    } finally {
      setIsDecrypting(false);
    }
  };

  const getEntryById = (id: bigint) => {
    return entries.find(entry => entry.id === id);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}`;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400';
      case 1: return 'text-gray-300';
      case 2: return 'text-orange-400';
      default: return 'text-gray-400';
    }
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
          <span className="trophy-gradient">🏆 竞赛排行榜</span>
        </h1>
        <p className="text-gray-400 text-lg">
          查看各类别的参赛作品排名，见证艺术的力量
        </p>
      </div>

      {/* 类别选择 */}
      <div className="contest-card p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-primary">🎯 选择评选类别</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`p-3 rounded-lg border-2 transition-all font-medium ${
                selectedCategory === category
                  ? 'border-primary bg-primary bg-opacity-20 text-primary'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
              }`}
            >
              {selectedCategory === category ? '🎯' : '⚪'} {category}
            </button>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={loadEntries}
          disabled={isLoading}
          className="contest-button px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {isLoading ? '🔄 加载中...' : '🔄 刷新数据'}
        </button>
        {entries.length > 0 && selectedCategory && (
          <button
            onClick={handleDecryptCategory}
            disabled={isDecrypting || isLoading}
            className="contest-button px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {isDecrypting ? (
              <span className="flex items-center">
                <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                解密中...
              </span>
            ) : (
              `🔓 解密 ${selectedCategory} 类别票数`
            )}
          </button>
        )}
      </div>

      {/* 统计信息 */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-primary mb-2">{entries.length}</div>
            <div className="text-gray-400">总参赛作品</div>
          </div>
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-secondary mb-2">
              {entries.filter(entry => entry.categories.includes(selectedCategory)).length}
            </div>
            <div className="text-gray-400">{selectedCategory} 类别作品</div>
          </div>
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-accent mb-2">{rankings.length}</div>
            <div className="text-gray-400">已解密排名</div>
          </div>
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {rankings.length > 0 ? rankings[0]?.votes || 0 : 0}
            </div>
            <div className="text-gray-400">最高票数</div>
          </div>
        </div>
      )}

      {/* 排行榜 */}
      {rankings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-400 text-lg mb-4">
            {selectedCategory ? `请解密 ${selectedCategory} 类别的投票数据` : '请选择一个类别查看排行榜'}
          </p>
          {entries.length === 0 && (
            <p className="text-gray-500 mb-4">暂无参赛作品</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center mb-6">
            🏆 {selectedCategory} 类别排行榜
          </h2>
          
          {rankings.map((ranking, index) => {
            const entry = getEntryById(ranking.entryId);
            if (!entry) return null;

            return (
              <div
                key={ranking.entryId.toString()}
                className={`contest-card p-6 rounded-xl ${
                  index < 3 ? 'contest-glow' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`text-3xl font-bold ${getRankColor(index)}`}>
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{entry.title}</h3>
                      <p className="text-sm text-gray-400">
                        参赛者: {entry.contestant.slice(0, 6)}...{entry.contestant.slice(-4)}
                      </p>
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs bg-gray-700 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                          {entry.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{entry.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary mb-1">
                      🗳️ {ranking.votes}
                    </div>
                    <div className="text-sm text-gray-400">票数</div>
                    {index < 3 && (
                      <div className="rank-badge mt-2">
                        {index === 0 ? '冠军' : index === 1 ? '亚军' : '季军'}
                      </div>
                    )}
                  </div>
                </div>

                {/* 作品信息预览 */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">描述哈希: </span>
                      <span className="text-gray-300 break-all">
                        {entry.descriptionHash.slice(0, 20)}...
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">提交时间: </span>
                      <span className="text-gray-300">
                        {new Date(Number(entry.timestamp) * 1000).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部说明 */}
      <div className="contest-card p-6 rounded-xl">
        <h3 className="text-lg font-bold mb-3 text-primary">📊 排行榜说明</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            排行榜基于该类别下的投票数量进行排序
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            投票数据通过 FHEVM 同态加密技术保护隐私
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            只有经过 EIP-712 签名授权才能查看明文投票数
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            每个类别的排行榜独立计算，互不影响
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            排行榜数据实时更新，反映最新的投票结果
          </li>
        </ul>
      </div>
    </div>
  );
}
