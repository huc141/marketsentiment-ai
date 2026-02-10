-- ========================================
-- MarketSentiment-AI Supabase 表结构
-- ========================================

-- 创建 watchlist 表（收藏列表）
CREATE TABLE watchlist (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,           -- 股票/加密货币代码
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX idx_watchlist_symbol ON watchlist(symbol);
CREATE INDEX idx_watchlist_created_at ON watchlist(created_at DESC);

-- 可选：添加用户ID字段（如需多用户功能）
-- ALTER TABLE watchlist ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);

-- 启用行级安全（RLS）
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许所有人读取
CREATE POLICY "Allow public read access" ON watchlist
  FOR SELECT
  USING (true);

-- RLS 策略：允许所有人插入（如需用户隔离，需修改为 user_id = auth.uid()）
CREATE POLICY "Allow public insert" ON watchlist
  FOR INSERT
  WITH CHECK (true);

-- RLS 策略：允许所有人删除
CREATE POLICY "Allow public delete" ON watchlist
  FOR DELETE
  USING (true);

-- 创建自动更新 updated_at 的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 添加触发器
CREATE TRIGGER update_watchlist_updated_at
  BEFORE UPDATE ON watchlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
