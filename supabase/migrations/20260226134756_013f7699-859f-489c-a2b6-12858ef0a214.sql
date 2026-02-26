
-- 会员表
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_no TEXT NOT NULL UNIQUE DEFAULT '',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT DEFAULT '',
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_recharged NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 充赠规则表
CREATE TABLE public.recharge_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recharge_amount NUMERIC(10,2) NOT NULL,
  bonus_amount NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 服务项目表
CREATE TABLE public.service_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 充值记录表
CREATE TABLE public.recharge_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id),
  amount NUMERIC(10,2) NOT NULL,
  bonus NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  operator_name TEXT NOT NULL DEFAULT '店员',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 消费记录表
CREATE TABLE public.consumption_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id),
  total_amount NUMERIC(10,2) NOT NULL,
  balance_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  operator_name TEXT NOT NULL DEFAULT '店员',
  is_refunded BOOLEAN NOT NULL DEFAULT false,
  refund_note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 消费明细表
CREATE TABLE public.consumption_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consumption_id UUID NOT NULL REFERENCES public.consumption_records(id),
  service_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1
);

-- 会员号序列函数
CREATE OR REPLACE FUNCTION public.generate_member_no()
RETURNS TRIGGER AS $$
DECLARE
  next_no INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(member_no FROM 2) AS INT)), 0) + 1
  INTO next_no FROM public.members;
  NEW.member_no := 'M' || LPAD(next_no::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_member_no
BEFORE INSERT ON public.members
FOR EACH ROW
WHEN (NEW.member_no IS NULL OR NEW.member_no = '')
EXECUTE FUNCTION public.generate_member_no();

-- updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 启用 RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharge_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_items ENABLE ROW LEVEL SECURITY;

-- 公开访问策略（内部店铺管理系统）
CREATE POLICY "Allow all access" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.recharge_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.service_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.recharge_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.consumption_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.consumption_items FOR ALL USING (true) WITH CHECK (true);

-- 插入初始充赠规则
INSERT INTO public.recharge_rules (recharge_amount, bonus_amount) VALUES
  (100, 20),
  (500, 150),
  (1000, 400);

-- 插入初始服务项目
INSERT INTO public.service_items (name, price, sort_order) VALUES
  ('男士剪发', 30, 1),
  ('女士剪发', 50, 2),
  ('洗剪吹', 60, 3),
  ('烫发', 200, 4),
  ('染发', 180, 5),
  ('护理', 100, 6),
  ('造型设计', 80, 7),
  ('儿童剪发', 20, 8);

-- 索引
CREATE INDEX idx_members_phone ON public.members(phone);
CREATE INDEX idx_members_member_no ON public.members(member_no);
CREATE INDEX idx_recharge_records_member ON public.recharge_records(member_id);
CREATE INDEX idx_recharge_records_created ON public.recharge_records(created_at);
CREATE INDEX idx_consumption_records_member ON public.consumption_records(member_id);
CREATE INDEX idx_consumption_records_created ON public.consumption_records(created_at);
