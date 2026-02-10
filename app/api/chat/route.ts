import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

// 初始化 Anthropic 客户端
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// 智谱 AI 直接 API 调用
async function callZhipuAI(messages: any[]) {
  const apiKey = process.env.ZHIPU_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('No Zhipu AI API key');
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zhipu AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // 提取响应内容
    let content = data.choices?.[0]?.message?.content || '';

    // 清理 Markdown 格式标记（智谱 AI 可能返回的格式）
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    return {
      text: content,
    };
  } catch (error) {
    console.error('Zhipu AI API error:', error);
    throw error;
  }
}

// 使用 Tavily Search API 获取新闻
async function fetchMarketNews(symbol: string) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.log('No Tavily API key, using mock data');
    return getMockNews(symbol);
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${symbol} stock news latest analysis`,
        search_depth: 'basic',
        max_results: 10,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    // 转换 Tavily 结果为统一格式
    const news = data.results?.map((item: any) => ({
      title: item.title,
      summary: item.snippet || item.content,
      sentiment: determineSentiment(item.snippet || item.content),
      url: item.url,
    })) || [];

    console.log(`Fetched ${news.length} news items for ${symbol}`);
    return { symbol: symbol.toUpperCase(), news };
  } catch (error) {
    console.error('Tavily API error:', error);
    return getMockNews(symbol);
  }
}

// 根据文本内容简单判断情绪倾向
function determineSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['上涨', '增长', '利好', '超预期', '上调', '买入', '强劲', '看好', '突破', '创新高', '盈利', 'rise', 'gain', 'up'];
  const negativeWords = ['下跌', '下滑', '利空', '低于预期', '下调', '卖出', '疲弱', '看空', '跌破', '创新低', '亏损', '风险', '监管', 'fall', 'drop', 'down', 'risk'];

  const textLower = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
  const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Mock 数据（备用）
function getMockNews(symbol: string) {
  return {
    symbol: symbol.toUpperCase(),
    news: [
      {
        title: `${symbol} 发布季度财报，营收超预期 15%`,
        summary: '该公司本季度营收达到预期水平，净利润同比增长显著。',
        sentiment: 'positive',
      },
      {
        title: `市场分析师上调 ${symbol} 目标价`,
        summary: '多家投行发布研报，认为该公司业务前景乐观。',
        sentiment: 'positive',
      },
      {
        title: `${symbol} 宣布新一轮战略投资计划`,
        summary: '公司将加大在核心业务领域的投入，预计未来增长强劲。',
        sentiment: 'positive',
      },
      {
        title: `行业监管政策可能影响 ${symbol} 业务`,
        summary: '新的监管政策可能对公司部分业务带来不确定性。',
        sentiment: 'negative',
      },
      {
        title: `${symbol} 竞争对手推出新产品`,
        summary: '主要竞争对手发布了类似产品，可能加剧市场竞争。',
        sentiment: 'negative',
      },
    ],
  };
}

// Mock AI 分析结果（根据 symbol 生成略有不同的结果）
function getMockAnalysis(symbol: string) {
  // 根据 symbol 的字符生成伪随机但稳定的结果
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseScore = 50 + (hash % 41); // 50-91
  const sentimentLabels = ['极度恐慌', '恐慌', '中性偏空', '中性', '中性偏多', '贪婪', '极度贪婪'];
  const sentimentIndex = Math.floor((baseScore - 1) / 15);
  const sentimentLabel = sentimentLabels[Math.min(sentimentIndex, 6)];

  // 基础利好因素
  const bullishOptions = [
    `${symbol} 营收超预期，显示公司基本面强劲`,
    '分析师集体上调目标价，市场信心增强',
    '战略投资计划将推动长期增长',
    '新产品发布有望打开新的市场空间',
    '订单量持续增长，业务扩张势头良好',
    '市场份额稳步提升，竞争优势明显',
  ];

  // 基础风险提示
  const bearishOptions = [
    '行业监管政策可能带来不确定性',
    '竞争对手新产品可能加剧市场竞争',
    '宏观经济环境仍存在波动风险',
    '原材料价格上涨可能影响利润率',
    '汇率波动可能影响海外业务',
    '供应链中断风险需要持续关注',
  ];

  // 根据 hash 选择不同的因素
  const bullishFactors = [
    bullishOptions[hash % bullishOptions.length],
    bullishOptions[(hash + 1) % bullishOptions.length],
    bullishOptions[(hash + 2) % bullishOptions.length],
  ];

  const bearishFactors = [
    bearishOptions[(hash + 3) % bearishOptions.length],
    bearishOptions[(hash + 4) % bearishOptions.length],
    bearishOptions[(hash + 5) % bearishOptions.length],
  ];

  return JSON.stringify({
    sentimentScore: baseScore,
    sentimentLabel,
    bullishFactors,
    bearishFactors,
  });
}

// 导出 API 路由
export async function POST(req: Request) {
  // 提前读取请求数据（只能读取一次）
  let requestData;
  try {
    requestData = await req.json();
  } catch (error) {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { symbol } = requestData;

  if (!symbol) {
    return new Response('Missing symbol', { status: 400 });
  }

  try {
    // 获取新闻数据
    const newsData = await fetchMarketNews(symbol);

    // 判断使用哪个 AI 服务
    const useZhipuAI = process.env.ZHIPU_API_KEY !== undefined ||
                        (process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-api03-'));

    if (!useZhipuAI) {
      // 如果没有有效的 API Key，返回 Mock 数据
      if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === '') {
        console.log('Using mock analysis (no AI API key)');
        return new Response(getMockAnalysis(symbol), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 使用 Anthropic 进行分析
      const result = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: `你是一个专业的投资分析师，擅长分析股票/加密货币的市场情绪。

你的任务是基于提供的新闻数据，分析该资产的市场情况，并按照以下 JSON 格式返回结果：

\`\`\`json
{
  "sentimentScore": 0-100,
  "sentimentLabel": "极度恐慌" | "恐慌" | "中性偏空" | "中性" | "中性偏多" | "贪婪" | "极度贪婪",
  "bullishFactors": [
    "利好因素1",
    "利好因素2",
    "利好因素3"
  ],
  "bearishFactors": [
    "风险提示1",
    "风险提示2",
    "风险提示3"
  ]
}
\`\`\`

评分说明：
- 0-30: 极度恐慌（红色）
- 31-45: 恐慌（橙色）
- 46-55: 中性偏空（黄色）
- 56-65: 中性（灰色）
- 66-80: 贪婪（浅绿）
- 81-100: 极度贪婪（深绿）

请确保返回完整的 JSON 格式，不要添加任何额外文字。`,
        messages: [
          {
            role: 'user',
            content: `请分析以下 ${symbol.toUpperCase()} 的新闻数据：

${JSON.stringify(newsData, null, 2)}

请给出市场情绪分析结果。`,
          },
        ],
      });

      // 返回 JSON 响应
      return new Response(result.text, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 使用智谱 AI 进行分析
    console.log('Using Zhipu AI for analysis');
    const systemPrompt = `你是一个专业的投资分析师，擅长分析股票/加密货币的市场情绪。

你的任务是基于提供的新闻数据，分析该资产的市场情况，并按照以下 JSON 格式返回结果：

\`\`\`json
{
  "sentimentScore": 0-100,
  "sentimentLabel": "极度恐慌" | "恐慌" | "中性偏空" | "中性" | "中性偏多" | "贪婪" | "极度贪婪",
  "bullishFactors": [
    "利好因素1",
    "利好因素2",
    "利好因素3"
  ],
  "bearishFactors": [
    "风险提示1",
    "风险提示2",
    "风险提示3"
  ]
}
\`\`\`

评分说明：
- 0-30: 极度恐慌（红色）
- 31-45: 恐慌（橙色）
- 46-55: 中性偏空（黄色）
- 56-65: 中性（灰色）
- 66-80: 贪婪（浅绿）
- 81-100: 极度贪婪（深绿）

请确保返回完整的 JSON 格式，不要添加任何额外文字。`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `请分析以下 ${symbol.toUpperCase()} 的新闻数据：

${JSON.stringify(newsData, null, 2)}

请给出市场情绪分析结果。`,
      },
    ];

    const result = await callZhipuAI(messages);

    // 返回 JSON 响应
    return new Response(result.text, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI API error:', error);

    // 如果 AI 调用失败，返回 Mock 数据作为降级处理
    console.log(`AI call failed, using mock data as fallback for ${symbol}`);
    return new Response(getMockAnalysis(symbol), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
