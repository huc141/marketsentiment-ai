'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MarketAnalysis {
  ticker: string;
  sentimentScore: number;
  sentimentColor: 'red' | 'yellow' | 'green';
  summary: string;
  bullishPoints: string[];
  bearishPoints: string[];
}

interface MarketDashboardProps {
  analysis: MarketAnalysis | null;
  loading: boolean;
}

// 独立的仪表盘组件
function GaugeChart({ score, sentimentColor }: { score: number; sentimentColor: 'red' | 'yellow' | 'green' }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // 动画效果：从 0 过渡到目标分数
  useEffect(() => {
    const duration = 1000; // 1秒动画
    const startTime = Date.now();
    const startScore = animatedScore;
    const endScore = score;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // 使用 easeOutQuart 缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentScore = startScore + (endScore - startScore) * easeProgress;
      setAnimatedScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [score]);

  // 计算弧的参数
  const radius = 80;
  const strokeWidth = 16;
  const centerX = 100;
  const centerY = 100;

  // 半圆从左(-180度)到右(0度)
  const startAngle = -180;
  const endAngle = 0;

  // 计算背景半圆弧的坐标
  const backgroundArcStart = {
    x: centerX + radius * Math.cos((startAngle * Math.PI) / 180),
    y: centerY + radius * Math.sin((startAngle * Math.PI) / 180),
  };
  const backgroundArcEnd = {
    x: centerX + radius * Math.cos((endAngle * Math.PI) / 180),
    y: centerY + radius * Math.sin((endAngle * Math.PI) / 180),
  };

  // 计算进度弧的终点（根据动画分数）
  const progressAngle = startAngle + (endAngle - startAngle) * (animatedScore / 100);
  const progressArcEnd = {
    x: centerX + radius * Math.cos((progressAngle * Math.PI) / 180),
    y: centerY + radius * Math.sin((progressAngle * Math.PI) / 180),
  };

  // 进度弧的 SVG 路径
  const largeArcFlag = Math.abs(progressAngle - startAngle) > 180 ? 1 : 0;
  const progressPath = `M ${backgroundArcStart.x} ${backgroundArcStart.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${progressArcEnd.x} ${progressArcEnd.y}`;

  // 获取情绪颜色
  const getEmotionColor = () => {
    if (score < 33) return '#ef4444'; // red
    if (score < 66) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  return (
    <div className="relative">
      <svg viewBox="0 0 200 160" className="w-full h-auto">
        <defs>
          {/* 渐变：从左边的红色，经过中间的黄色，到右边的绿色 */}
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />    {/* 恐慌 - 红色 */}
            <stop offset="50%" stopColor="#eab308" />   {/* 中性 - 黄色 */}
            <stop offset="100%" stopColor="#22c55e" />  {/* 贪婪 - 绿色 */}
          </linearGradient>

          {/* 阴影效果 */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 背景轨道：深灰色半透明 */}
        <path
          d={`M ${backgroundArcStart.x} ${backgroundArcStart.y} A ${radius} ${radius} 0 0 1 ${backgroundArcEnd.x} ${backgroundArcEnd.y}`}
          fill="none"
          stroke="#374151"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* 进度条：使用渐变色，带阴影 */}
        {animatedScore > 0 && (
          <path
            d={progressPath}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#glow)"
            style={{
              transition: 'd 0.3s ease-out',
            }}
          />
        )}

        {/* 中心数值区域 */}
        <g transform="translate(100, 95)">
          {/* 主数值：大号、醒目 */}
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            className="font-bold"
            style={{
              fontSize: '48px',
              fill: getEmotionColor(),
              filter: 'url(#glow)',
            }}
          >
            {Math.round(animatedScore)}
          </text>

          {/* "/ 100" 小标签 */}
          <text
            x="0"
            y="30"
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: '16px',
              fill: '#9ca3af',
            }}
          >
            / 100
          </text>

          {/* "市场情绪指数" 标签 */}
          <text
            x="0"
            y="52"
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: '14px',
              fill: '#6b7280',
            }}
          >
            市场情绪指数
          </text>
        </g>
      </svg>

      {/* 底部标签：对齐到半圆弧的起点、中点、终点 */}
      <div className="flex justify-between items-end mt-2 px-2">
        {/* 恐慌 - 左下 */}
        <div className="flex flex-col items-center" style={{ transform: 'translateX(-10px)' }}>
          <span className="text-red-400 text-sm font-medium">恐慌</span>
          <span className="text-slate-500 text-xs">0</span>
        </div>

        {/* 中性 - 中下 */}
        <div className="flex flex-col items-center">
          <span className="text-yellow-400 text-sm font-medium">中性</span>
          <span className="text-slate-500 text-xs">50</span>
        </div>

        {/* 贪婪 - 右下 */}
        <div className="flex flex-col items-center" style={{ transform: 'translateX(10px)' }}>
          <span className="text-emerald-400 text-sm font-medium">贪婪</span>
          <span className="text-slate-500 text-xs">100</span>
        </div>
      </div>
    </div>
  );
}

export default function MarketDashboard({ analysis, loading }: MarketDashboardProps) {
  const getColors = () => ({
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-400',
      text: 'text-red-400',
    },
    yellow: {
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-400',
      text: 'text-yellow-400',
    },
    green: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-400',
      text: 'text-emerald-400',
    },
  });

  const colors = getColors();
  const sentimentColor = analysis?.sentimentColor && analysis.sentimentColor in colors
    ? analysis.sentimentColor
    : 'yellow';

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 text-lg">输入股票代码开始分析</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 总结栏 */}
      <div className={`bg-gradient-to-br ${colors[sentimentColor].bg} to-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-slate-700`}>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-slate-600 animate-pulse" />
          市场概览
        </h2>
        <p className="text-xl text-white font-medium leading-relaxed">
          {analysis.summary}
        </p>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-mono">{analysis.ticker}</span>
            <span>实时市场情绪分析</span>
          </div>
        </div>
      </div>

      {/* 情绪仪表盘 - 使用新的 GaugeChart 组件 */}
      <div className={`bg-gradient-to-br ${colors[sentimentColor].bg} to-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-slate-700`}>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-slate-600 animate-pulse" />
          市场情绪指标
        </h2>

        <div className="max-w-md mx-auto">
          <GaugeChart score={analysis.sentimentScore} sentimentColor={sentimentColor} />
        </div>
      </div>

      {/* 多空对决 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 看涨因素 */}
        <div className={`bg-gradient-to-br ${colors[sentimentColor].bg} to-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-slate-700`}>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className={`w-6 h-6 ${colors.green.text}`} />
            看涨因素
          </h3>
          <div className="space-y-3">
            {analysis.bullishPoints.map((point, index) => (
              <div key={index} className="p-4 rounded-lg border-l-4 bg-slate-800">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${colors.green.bg} flex-shrink-0`} />
                  <p className="text-white text-sm leading-relaxed">{point}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 看跌风险 */}
        <div className={`bg-gradient-to-br ${colors.red.bg} to-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-slate-700`}>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className={`w-6 h-6 ${colors.red.text}`} />
            看跌风险
          </h3>
          <div className="space-y-3">
            {analysis.bearishPoints.map((point, index) => (
              <div key={index} className="p-4 rounded-lg border-l-4 bg-slate-800">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${colors.red.bg} flex-shrink-0`} />
                  <p className="text-white text-sm leading-relaxed">{point}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
