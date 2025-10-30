'use client';

import { useState } from 'react';
import { useFhevm } from '../../fhevm/useFhevm';
import { useContest } from '../../hooks/useContest';

export default function SubmitPage() {
  const { fhevm, isLoading: fhevmLoading, error: fhevmError } = useFhevm();
  const { submitEntry, isLoading } = useContest();
  
  const [formData, setFormData] = useState({
    title: '',
    descriptionHash: '',
    fileHash: '',
    tags: '',
    categories: [] as string[],
  });

  const availableCategories = ['绘画', '摄影', '数字艺术', '雕塑', '装置艺术', '概念艺术'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.descriptionHash) {
      alert('请填写作品标题和简介');
      return;
    }

    if (formData.categories.length === 0) {
      alert('请至少选择一个参赛类别');
      return;
    }

    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      // 如果没有文件链接，使用空字符串
      const fileHash = formData.fileHash.trim() || '';
      await submitEntry(
        formData.title,
        formData.descriptionHash,
        fileHash,
        tags,
        formData.categories
      );
      
      alert('作品提交成功！');
      
      // 重置表单
      setFormData({
        title: '',
        descriptionHash: '',
        fileHash: '',
        tags: '',
        categories: [],
      });
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请重试');
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          <span className="trophy-gradient">🚀 提交参赛作品</span>
        </h1>
        <p className="text-gray-400 text-lg">
          展示你的艺术才华，参与链上评选竞赛
        </p>
      </div>

      {/* 提交表单 */}
      <div className="contest-card p-8 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 作品标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ✨ 作品标题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="给你的艺术杰作起个独特的名字..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400"
              required
            />
            <div className="mt-2 text-xs text-gray-400 flex items-center space-x-4">
              <span>💡 例如：《数字梦境》</span>
              <span>🎭 《色彩交响曲》</span>
              <span>🌟 《未来之光》</span>
            </div>
          </div>

          {/* 作品简介 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📖 作品简介 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.descriptionHash}
              onChange={(e) => setFormData(prev => ({ ...prev, descriptionHash: e.target.value }))}
              placeholder="描述你的创作理念、灵感来源、使用的技法..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400 resize-none"
              required
            />
            <div className="mt-2 flex justify-between items-center text-xs">
              <span className="text-gray-400">💭 分享你的创作故事，让观众更好地理解作品</span>
              <span className="text-gray-500">{formData.descriptionHash.length}/500</span>
            </div>
          </div>

          {/* 作品文件 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🎨 作品文件链接 <span className="text-gray-500 text-xs">(可选)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={formData.fileHash}
                onChange={(e) => setFormData(prev => ({ ...prev, fileHash: e.target.value }))}
                placeholder="https://ipfs.io/ipfs/... 或其他链接 (概念作品可留空)"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400 pr-12"
              />
              <div className="absolute right-3 top-3 text-gray-400">
                🔗
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800 p-2 rounded flex items-center space-x-2">
                <span className="text-blue-400">📸</span>
                <span className="text-gray-300">图片作品</span>
              </div>
              <div className="bg-gray-800 p-2 rounded flex items-center space-x-2">
                <span className="text-purple-400">🎬</span>
                <span className="text-gray-300">视频作品</span>
              </div>
              <div className="bg-gray-800 p-2 rounded flex items-center space-x-2">
                <span className="text-green-400">🎵</span>
                <span className="text-gray-300">音频作品</span>
              </div>
              <div className="bg-gray-800 p-2 rounded flex items-center space-x-2">
                <span className="text-pink-400">💭</span>
                <span className="text-gray-300">概念作品</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400 bg-gray-800/50 p-2 rounded">
              💡 <strong>概念艺术作品</strong>可以不提供文件链接，仅通过文字描述来表达创意和理念
            </div>
          </div>

          {/* 创作风格标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              🎭 创作风格标签
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="输入自定义标签，用逗号分隔"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400"
              />
              
              {/* 预设标签选择 */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {[
                  '🎨 抽象', '🌈 色彩丰富', '⚫ 黑白', '🔥 热烈', 
                  '❄️ 冷静', '🌸 温柔', '⚡ 动感', '🧘 静谧',
                  '🔮 神秘', '🌟 梦幻', '🏛️ 古典', '🚀 未来',
                  '🌿 自然', '🏙️ 都市', '💫 宇宙', '🎪 奇幻'
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const tagName = tag.split(' ')[1];
                      const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
                      if (!currentTags.includes(tagName)) {
                        setFormData(prev => ({
                          ...prev,
                          tags: [...currentTags, tagName].join(', ')
                        }));
                      }
                    }}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-full transition-colors text-left"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 参赛类别 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              🏆 选择竞赛赛道 <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: '绘画', icon: '🎨', desc: '传统绘画与数字绘画' },
                { name: '摄影', icon: '📸', desc: '光影艺术与视觉捕捉' },
                { name: '数字艺术', icon: '💻', desc: '计算机生成艺术' },
                { name: '雕塑', icon: '🗿', desc: '立体造型艺术' },
                { name: '装置艺术', icon: '🎪', desc: '空间与概念艺术' },
                { name: '概念艺术', icon: '💭', desc: '思想与理念表达' }
              ].map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => handleCategoryToggle(category.name)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                    formData.categories.includes(category.name)
                      ? 'border-primary bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg scale-105'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-primary/50 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`text-2xl transition-transform group-hover:scale-110 ${
                      formData.categories.includes(category.name) ? 'animate-bounce' : ''
                    }`}>
                      {category.icon}
                    </div>
                    <div className="font-bold text-lg">{category.name}</div>
                    <div className="ml-auto">
                      {formData.categories.includes(category.name) ? (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 border-2 border-gray-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300">
                    {category.desc}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-orange-500/10 to-purple-500/10 rounded-lg border border-orange-500/20">
              <p className="text-sm text-gray-300 flex items-center">
                <span className="text-orange-400 mr-2">🎯</span>
                可以选择多个赛道参赛，每个赛道都有独立的排行榜和奖励
              </p>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full contest-button py-5 rounded-xl font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <>
                    <div className="loading-spinner w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                    正在上链提交...
                  </>
                ) : (
                  <>
                    <span className="mr-3">🚀</span>
                    提交到区块链竞赛
                    <span className="ml-3">✨</span>
                  </>
                )}
              </span>
            </button>
            
            {/* 提交状态提示 */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>安全上链 · 永久保存 · 公平评选</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 竞赛规则 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="contest-card p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-4 text-primary flex items-center">
            <span className="mr-2">🏆</span>
            竞赛规则
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start">
              <span className="text-orange-400 mr-3 mt-1">⚡</span>
              <div>
                <strong>即时上链：</strong>作品提交后立即写入区块链，永久保存且不可篡改
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3 mt-1">🔒</span>
              <div>
                <strong>隐私保护：</strong>评分和投票数据通过 FHEVM 同态加密技术保护
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-3 mt-1">🎯</span>
              <div>
                <strong>多赛道竞争：</strong>每个类别独立排名，增加获奖机会
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-3 mt-1">👥</span>
              <div>
                <strong>公平评选：</strong>所有用户都可以参与评分和投票
              </div>
            </li>
          </ul>
        </div>

        <div className="contest-card p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-4 text-primary flex items-center">
            <span className="mr-2">💡</span>
            创作建议
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start">
              <span className="text-yellow-400 mr-3 mt-1">🎨</span>
              <div>
                <strong>原创性：</strong>确保作品为原创，避免版权纠纷
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-pink-400 mr-3 mt-1">📝</span>
              <div>
                <strong>详细描述：</strong>丰富的作品介绍有助于观众理解和评价
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 mr-3 mt-1">🔗</span>
              <div>
                <strong>文件存储：</strong>推荐使用 IPFS 等去中心化存储确保文件持久性
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-400 mr-3 mt-1">🏷️</span>
              <div>
                <strong>精准标签：</strong>合适的标签能让更多人发现你的作品
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
