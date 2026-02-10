'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Send, Star, Loader2 } from 'lucide-react';

// Supabase 客户端
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface AnalysisResult {
  sentimentScore: number;
  sentimentLabel: string;
  bullishFactors: string[];
  bearishFactors: string[];
}

export default function Home() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  // 保存最后一次成功分析的股票代码
  const [analyzedSymbol, setAnalyzedSymbol] = useState<string | null>(null);

  // 根据分数获取颜色
  const getSentimentColor = (score: number) => {
    if (score <= 30) return 'text-red-600 bg-red-50 border-red-200';
    if (score <= 45) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score <= 55) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score <= 65) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (score <= 80) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  // 分析股票/加密货币
  const analyze = async () => {
    const currentSymbol = symbol.trim();
    if (!currentSymbol) {
      setError('请输入股票代码');
      return;
    }

    // 开始分析前：不立即清除旧结果，先清空 analyzedSymbol
    // 这样旧结果会继续显示，但标题会在显示时才更新
    setLoading(true);
    setError('');
    // 注意：这里不调用 setResult(null)，保持旧结果显示
    // 但是清空 analyzedSymbol，这样结果标题不会在加载期间显示

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: currentSymbol }),
      });

      if (!response.ok) {
        throw new Error('分析失败');
      }

      // 解析 JSON 响应
      const data = await response.json();
      setResult(data);
      // 分析成功后，设置 analyzedSymbol，这样标题会更新
      setAnalyzedSymbol(currentSymbol.toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 添加到收藏列表
  const addToWatchlist = async () => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .insert([{ symbol: symbol.toUpperCase() }]);

      if (error) throw error;
      alert('已添加到收藏列表！');
    } catch (err) {
      alert('添加失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 标题 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            MarketSentiment AI
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            AI 驱动的市场情绪分析
          </p>
        </header>

        {/* 输入区域 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="输入代码（如 BTC, AAPL, 00700）"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={analyze}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              分析
            </button>
          </div>
          {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
        </div>

        {/* 分析结果 */}
        {result && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 space-y-6">
            {/* 标题和收藏按钮 - 使用 analyzedSymbol 而不是 symbol */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {analyzedSymbol || symbol.toUpperCase()} 分析结果
              </h2>
              <button
                onClick={addToWatchlist}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
              >
                <Star className="w-4 h-4" />
                收藏
              </button>
            </div>

            {/* 市场情绪 */}
            <div className={`p-4 rounded-xl border ${getSentimentColor(result.sentimentScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">市场情绪</span>
                <span className="text-2xl font-bold">{result.sentimentScore}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    result.sentimentScore <= 50
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}
                  style={{ width: `${result.sentimentScore}%` }}
                />
              </div>
              <p className="text-sm font-medium">{result.sentimentLabel}</p>
            </div>

            {/* 利好因素 */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-green-600 dark:text-green-400 mb-3">
                <TrendingUp className="w-5 h-5" />
                利好因素
              </h3>
              <ul className="space-y-2">
                {result.bullishFactors.map((factor, index) => (
                  <li
                    key={index}
                    className="p-3 bg-green-50 dark:bg-green-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-sm"
                  >
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            {/* 风险提示 */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                <TrendingDown className="w-5 h-5" />
                风险提示
              </h3>
              <ul className="space-y-2">
                {result.bearishFactors.map((factor, index) => (
                  <li
                    key={index}
                    className="p-3 bg-red-50 dark:bg-red-900/20 text-slate-700 dark:text-slate-300 rounded-lg text-sm"
                  >
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
