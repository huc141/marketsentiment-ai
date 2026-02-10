# 错题本 - MarketSentiment AI 项目

记录开发过程中遇到的所有错误、原因分析和解决方案。

---

## 错误 1: `result.toAIStreamResponse is not a function`

**时间**: 2025-02-10

**错误信息**:
```
TypeError: result.toAIStreamResponse is not a function
```

**原因分析**:
Vercel AI SDK v6 更新了 API，`toAIStreamResponse` 方法已被移除或重命名。

**解决方案**:
1. 尝试使用 `toDataStreamResponse()` - 仍然报错，方法不存在
2. 最终改为使用 `generateText` 替代 `streamText`，直接返回 `result.text`

**文件**: `app/api/chat/route.ts`

---

## 错误 2: `Body has already been read`

**时间**: 2025-02-10

**错误信息**:
```
TypeError: body has already been used
```

**原因分析**:
在 try/catch 块中多次调用 `req.json()`，而 Request 对象的 body 只能读取一次。

**解决方案**:
在函数开始时只读取一次请求数据，存储到变量中供后续使用：

```typescript
let requestData;
try {
  requestData = await req.json();
} catch (error) {
  return new Response('Invalid JSON', { status: 400 });
}
const { symbol } = requestData;
```

**文件**: `app/api/chat/route.ts`

---

## 错误 3: 智谱 AI 返回 Markdown 格式 JSON

**时间**: 2025-02-10

**错误信息**:
```
Unexpected token '`', "```json {...}" is not valid JSON
```

**原因分析**:
AI 模型（特别是智谱 AI）返回的 JSON 被包裹在 Markdown 代码块中：
```json
{
  "ticker": "AAPL",
  ...
}
```

**解决方案**:
在解析 JSON 前使用正则表达式清理 Markdown 标记：

```typescript
let content = data.choices?.[0]?.message?.content || '';
content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
```

**文件**: `app/api/chat/route.ts`

---

## 错误 4: 不同输入返回相同的分析结果

**时间**: 2025-02-10

**现象**:
输入不同的股票代码（如 "BTC" 和 "AAPL"），返回的看涨/看跌因素完全相同。

**原因分析**:
Mock 分析函数使用固定的数组，没有根据输入进行差异化处理。

**解决方案**:
使用输入字符串的 hash 值来决定选择数组中的哪些元素：

```typescript
const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
bullishPoints: [
  bullishOptions[hash % bullishOptions.length],
  bullishOptions[(hash + 1) % bullishOptions.length],
  bullishOptions[(hash + 2) % bullishOptions.length],
],
```

**文件**: `app/api/chat/route.ts`

---

## 错误 5: 输入新代码时，旧分析结果被覆盖

**时间**: 2025-02-10

**用户反馈**:
当在输入框输入新名称时，下方的分析结果标题也会同步变化。用户希望：输入新代码时不影响旧结果的显示，只有点击"分析"后才更新。

**原因分析**:
只使用了一个 `symbol` state 来同时管理输入框值和显示的分析结果。

**解决方案**:
分离 state：
- `symbol`: 当前输入框的值（用户正在输入的）
- `analyzedSymbol`: 上次成功分析的股票代码（用于显示）

```typescript
const [symbol, setSymbol] = useState('');
const [analyzedSymbol, setAnalyzedSymbol] = useState<string | null>(null);

// 点击分析时
const analyze = async () => {
  setAnalyzedSymbol(null); // 先清空
  // ... 分析逻辑
  setAnalyzedSymbol(data.ticker); // 成功后更新
};

// Dashboard 显示
<h2>{analyzedSymbol || '待分析'}</h2>
```

**文件**: `app/page.tsx`

---

## 错误 6: SVG 路径属性错误导致渲染失败

**时间**: 2025-02-10

**错误信息**:
```
Error: <path> attribute d: Expected arc flag ('0' or '1'), "… 50 A 90 50 0 1 90".
Error: <path> attribute transform: Expected ')', "rotate(18deg)".
```

**原因分析**:
1. SVG 弧路径格式错误：`A 90 50 0 1 90` 缺少终点坐标参数
2. 在 JSX 模板字符串中直接拼接 SVG 路径，导致语法解析错误

**解决方案**:
1. 修正 SVG 路径格式：`A rx ry x-axis-rotation large-arc-flag sweep-flag x y`
2. 将路径计算移到 JSX 外部的变量中

**文件**: `components/MarketDashboard.tsx`

---

## 错误 7: `Cannot read properties of null (reading 'sentimentScore')`

**时间**: 2025-02-10

**错误信息**:
```
TypeError: Cannot read properties of null (reading 'sentimentScore')
at MarketDashboard (components\MarketDashboard.tsx:54:60)
```

**原因分析**:
当 `analysis` 为 `null` 时，访问 `analysis.sentimentScore` 会报错。`??` 操作符只在属性存在但为 null/undefined 时生效，无法处理对象本身为 null 的情况。

**错误代码**:
```typescript
const gaugeRotation = Math.max(0, Math.min(90, (analysis.sentimentScore ?? 0) / 100) * 180 - 90);
```

**解决方案**:
使用可选链 `?.` 或先赋值到变量：

```typescript
const score = analysis?.sentimentScore ?? 0;
const gaugeRotation = Math.max(0, Math.min(90, (score / 100) * 180 - 90));
```

**文件**: `components/MarketDashboard.tsx`

---

## 错误 8: Tailwind 类名用于 SVG 属性

**时间**: 2025-02-10

**错误信息**:
```
stop-color="bg-emerald-500" (无效的颜色值)
```

**原因分析**:
SVG 的 `stop-color` 属性需要实际的颜色值（如 `#10b981`），但代码中传入了 Tailwind 类名（如 `bg-emerald-500`）。

**解决方案**:
添加 hex 颜色值定义：

```typescript
const getColors = () => ({
  green: {
    bg: 'bg-emerald-500',
    hex: '#10b981',  // 添加实际颜色值
  },
});

<stop offset="0%" stopColor={colors[sentimentColor].hex} />
```

**文件**: `components/MarketDashboard.tsx`

---

## 错误 9: 颜色类型不匹配导致访问 undefined

**时间**: 2025-02-10

**错误信息**:
```
Cannot read properties of undefined
```

**原因分析**:
默认颜色设置为 `'gray'`，但 `colors` 对象中没有 `'gray'` 键，导致 `colors['gray']` 返回 `undefined`。

**解决方案**:
1. 将默认值改为存在的颜色（如 `'yellow'`）
2. 添加类型检查确保颜色在对象中存在

```typescript
const sentimentColor = analysis?.sentimentColor && analysis.sentimentColor in colors
  ? analysis.sentimentColor
  : 'yellow'; // 使用存在的颜色作为默认值
```

**文件**: `components/MarketDashboard.tsx`

---

## 错误 10: Dashboard 不渲染分析数据

**时间**: 2025-02-10

**现象**:
API 返回正确的 JSON 数据，但 Dashboard 显示 `hasAnalysis: false` 和 `sentimentScore: undefined`。

**原因分析**:
1. 模板字符串中的 SVG 路径拼接导致语法错误
2. Next.js 缓存可能导致旧代码仍在运行

**解决方案**:
1. 将所有 SVG 路径计算移到 JSX 外部
2. 清理 Next.js 缓存（删除 `.next` 目录）
3. 添加详细的 console.log 调试日志

**文件**: `components/MarketDashboard.tsx`

---

## 错误 11: 端口冲突

**时间**: 2025-02-10

**错误信息**:
```
Port 3000 is in use by process 39588
```

**原因分析**:
之前的 dev server 进程仍在运行，占用了默认端口 3000。

**解决方案**:
Next.js 会自动切换到可用端口（如 3004、3005），无需手动处理。如需清理：
```bash
# Windows 查找并结束进程
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F

# 或删除锁文件
rm -f .next/dev/lock
```

---

## 经验总结

### 最佳实践

1. **防御性编程**：始终使用可选链 `?.` 和空值合并 `??` 处理可能为 null 的对象
2. **分离状态**：输入状态和显示状态应该分开管理，避免相互干扰
3. **日志调试**：关键路径添加 console.log，方便追踪数据流
4. **SVG 注意事项**：
   - 路径格式必须精确，特别是弧命令的参数数量
   - 颜色属性需要实际颜色值，不能使用 CSS 类名
   - 将复杂计算移到 JSX 外部，避免模板字符串拼接错误
5. **API 返回清理**：AI 返回的 JSON 可能包含 Markdown 标记，需要预处理
6. **Next.js 缓存**：遇到奇怪问题时，尝试删除 `.next` 目录重新编译

### 待改进

- [ ] 添加更完善的错误边界处理
- [ ] 实现单元测试覆盖关键逻辑
- [ ] 添加 TypeScript 严格模式检查
- [ ] 优化加载状态和错误提示的用户体验

---

*最后更新: 2025-02-10*
