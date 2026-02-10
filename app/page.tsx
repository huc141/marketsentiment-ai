'use client';

import { useState } from 'react';
import { Send, Loader2, Star, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import MarketDashboard from '@/components/MarketDashboard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface MarketAnalysis {
  ticker: string;
  sentimentScore: number;
  sentimentColor: 'red' | 'yellow' | 'green';
  summary: string;
  bullishPoints: string[];
  bearishPoints: string[];
}

export default function Home() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [error, setError] = useState('');
  const [analyzedSymbol, setAnalyzedSymbol] = useState<string | null>(null);

  // 分析股票/加密货币
  const analyze = async () => {
    const currentSymbol = symbol.trim();
    if (!currentSymbol) {
      setError('请输入股票代码');
      return;
    }

    // 开始分析前：清空 analyzedSymbol，等待分析成功后才更新
    setAnalyzedSymbol(null);
    setLoading(true);
    setError('');

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
      console.log('API response:', data); // 调试日志
      console.log('Setting analysis with data:', JSON.stringify(data, null, 2));
      setAnalysis(data);
      // 立即打印状态，验证 set 是否生效
      console.log('Analysis state after set:', data);
      // 分析成功后，设置 analyzedSymbol，这样 Dashboard 标题才会更新
      setAnalyzedSymbol(data.ticker);
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
    <div className="min-h-screen bg-slate-950 dark:bg-slate-900">
      {/* 标题栏 */}
      <header className="bg-slate-900 dark:bg-black border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold text-white">
                MarketSentiment AI
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {analysis && (
                <button
                  onClick={addToWatchlist}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                >
                  <Star className="w-4 h-4" />
                  收藏
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 输入区域 */}
        <div className="mb-8">
          <div className="bg-slate-800 dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
            <div className="p-6">
              {/* 标题、输入框和按钮在同一水平线 */}
              <div className="flex items-center gap-4 mb-4">
                <label className="text-slate-300 text-sm font-medium whitespace-nowrap">
                  股票/加密货币代码
                </label>
                <div className="flex gap-3 flex-1">
                  <input
                    type="text"
                    placeholder="例如：BTC, AAPL, 00700"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && analyze()}
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-600 bg-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={analyze}
                    disabled={loading}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        分析
                      </>
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700 text-red-400 text-sm rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 市场仪表盘 */}
        <MarketDashboard analysis={analysis} loading={loading} />

        {/* Footer */}
        <footer className="mt-8 text-center text-slate-500 text-sm">
          <p>基于 AI 和 Tavily 实时数据分析</p>
          <p className="mt-1">© 2025 MarketSentiment AI</p>
        </footer>
      </main>
    </div>
  );
}
