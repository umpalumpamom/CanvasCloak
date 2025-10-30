'use client';

import { useState, useEffect } from 'react';
import { useFhevm } from '../fhevm/useFhevm';
import { useContest } from '../hooks/useContest';
import { ContractEntry, DecryptedEntry } from '../fhevm/fhevmTypes';
import Link from 'next/link';

export default function HomePage() {
  const { fhevm, isLoading: fhevmLoading, error: fhevmError } = useFhevm();
  const { getAllEntries, scoreEntry, voteEntry, decryptScores, isLoading } = useContest();
  
  const [entries, setEntries] = useState<ContractEntry[]>([]);
  const [decryptedEntries, setDecryptedEntries] = useState<DecryptedEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ContractEntry | null>(null);
  const [scoredEntries, setScoredEntries] = useState<Set<string>>(new Set());
  const [votedEntries, setVotedEntries] = useState<Map<string, Set<string>>>(new Map());

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

  const handleScoreEntry = async (entryId: number) => {
    try {
      await scoreEntry(entryId);
      setScoredEntries(prev => new Set(prev).add(entryId.toString()));
      await loadEntries(); // 重新加载数据
    } catch (error) {
      console.error('评分失败:', error);
      alert('评分失败，请重试');
    }
  };

  const handleVoteEntry = async (entryId: number, category: string) => {
    try {
      await voteEntry(entryId, category);
      const key = `${entryId}-${category}`;
      setVotedEntries(prev => {
        const newMap = new Map(prev);
        const entryVotes = newMap.get(entryId.toString()) || new Set();
        entryVotes.add(category);
        newMap.set(entryId.toString(), entryVotes);
        return newMap;
      });
    } catch (error) {
      console.error('投票失败:', error);
      alert('投票失败，请重试');
    }
  };

  const handleDecryptScores = async () => {
    try {
      const decrypted = await decryptScores(entries);
      setDecryptedEntries(decrypted);
    } catch (error) {
      console.error('解密评分失败:', error);
      alert('解密失败，请重试');
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
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-blue-500/20 blur-3xl -z-10"></div>
        <h1 className="text-5xl font-bold mb-4 relative">
          <span className="trophy-gradient">🏛️ 艺术评选大厅</span>
        </h1>
        <p className="text-gray-300 text-xl mb-4">
          发现优秀作品，参与公平评选，见证艺术之美
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            FHEVM 加密保护
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
            Sepolia 测试网
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={loadEntries}
          disabled={isLoading}
          className="contest-button px-6 py-3 rounded-lg disabled:opacity-50"
        >
          {isLoading ? '🔄 加载中...' : '🔄 刷新作品'}
        </button>
        {entries.length > 0 && (
          <button
            onClick={handleDecryptScores}
            disabled={isLoading}
            className="contest-button px-6 py-3 rounded-lg disabled:opacity-50"
          >
            🔓 解密所有评分
          </button>
        )}
      </div>

      {/* 统计信息 */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-primary mb-2">{entries.length}</div>
            <div className="text-gray-400">参赛作品</div>
          </div>
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-secondary mb-2">{scoredEntries.size}</div>
            <div className="text-gray-400">已评分作品</div>
          </div>
          <div className="contest-card p-6 rounded-xl text-center">
            <div className="text-3xl font-bold text-accent mb-2">
              {Array.from(votedEntries.values()).reduce((sum, votes) => sum + votes.size, 0)}
            </div>
            <div className="text-gray-400">总投票数</div>
          </div>
        </div>
      )}

      {/* 参赛作品展示区 */}
      {entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="relative inline-block">
            <div className="text-8xl mb-6 animate-bounce">🎨</div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-400 rounded-full animate-ping"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-300 mb-4">暂无参赛作品</h2>
          <p className="text-gray-400 mb-8">成为第一个提交作品的艺术家</p>
          <Link href="/submit" className="contest-button px-8 py-4 rounded-xl text-lg font-bold inline-flex items-center space-x-2">
            <span>🚀</span>
            <span>提交第一个作品</span>
          </Link>
        </div>
      ) : (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-200 mb-2">参赛作品展示</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="artwork-grid">
            {entries.map((entry, index) => {
              const isScored = scoredEntries.has(entry.id.toString());
              const entryVotes = votedEntries.get(entry.id.toString()) || new Set();
              const decryptedEntry = decryptedEntries.find(d => d.id === entry.id);

              return (
                <div key={entry.id.toString()} className="artwork-card group">
                  <div className="artwork-info">
                    {/* 作品编号和标题 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            #{index + 1}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {entry.id.toString()}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">
                          {entry.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>参赛者: {entry.contestant.slice(0, 6)}...{entry.contestant.slice(-4)}</span>
                        </div>
                      </div>
                      
                      {/* 评分显示 */}
                      {decryptedEntry && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-yellow-400 mb-1">
                            ⭐ {decryptedEntry.scores}
                          </div>
                          <div className="text-xs text-gray-400">评分</div>
                        </div>
                      )}
                    </div>

                    {/* 作品哈希信息 */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1 flex items-center">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                          描述哈希
                        </div>
                        <div className="artwork-hash">
                          {entry.descriptionHash}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-400 mb-1 flex items-center">
                          <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                          文件哈希
                        </div>
                        <div className="artwork-hash">
                          {entry.fileHash}
                        </div>
                      </div>
                    </div>

                    {/* 标签云 */}
                    {entry.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                          创作标签
                        </div>
                        <div className="tag-cloud">
                          {entry.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="tag-item">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 参赛类别 */}
                    {entry.categories.length > 0 && (
                      <div className="mb-6">
                        <div className="text-xs text-gray-400 mb-2 flex items-center">
                          <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                          参赛类别
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {entry.categories.map((category, catIndex) => (
                            <span key={catIndex} className="category-badge">
                              🏆 {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 互动按钮区 */}
                    <div className="space-y-3 border-t border-gray-700 pt-4">
                      {/* 评分按钮 */}
                      <button
                        onClick={() => handleScoreEntry(Number(entry.id))}
                        disabled={isLoading || isScored}
                        className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                          isScored
                            ? 'bg-gradient-to-r from-green-600 to-green-500 text-white cursor-not-allowed shadow-lg'
                            : 'contest-button hover:scale-105 hover:shadow-xl'
                        }`}
                      >
                        {isScored ? '✅ 已评分' : '⭐ 给作品评分'}
                      </button>

                      {/* 类别投票按钮 */}
                      <div className="grid grid-cols-2 gap-2">
                        {entry.categories.map((category) => {
                          const hasVoted = entryVotes.has(category);
                          return (
                            <button
                              key={category}
                              onClick={() => handleVoteEntry(Number(entry.id), category)}
                              disabled={isLoading || hasVoted}
                              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all duration-300 ${
                                hasVoted
                                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white hover:from-blue-400 hover:to-blue-300 hover:scale-105'
                              }`}
                            >
                              {hasVoted ? '✅ 已投票' : `🗳️ 投票 ${category}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 时间戳 */}
                    <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>提交时间</span>
                      </div>
                      <span>{new Date(Number(entry.timestamp) * 1000).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
