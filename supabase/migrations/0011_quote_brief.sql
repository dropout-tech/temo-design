-- ─────────────────────────────────────────────────────────────────────────────
-- 0011 報價設計需求單（問卷）後台可自訂
--   brief_sections：問卷「區塊」（基本資料 / 品牌訴求 / 視覺風格…）
--   brief_questions：每個區塊底下的「題目」（含類型、選項、必填等）
--   seed 由 scripts/seed-brief.ts 從 lib/quote-brief-questions.ts 產生（見本檔末尾附加段）。
-- 套用：psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f supabase/migrations/0011_quote_brief.sql
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists brief_sections (
  id          text primary key,          -- 例 basic / vision（新區塊可用任意唯一字串）
  title       text not null,
  title_en    text,
  description text,
  applies_to  text[],                     -- null = 一律顯示；否則只在這些類別顯示（brand/product/crafts）
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists brief_questions (
  id          uuid primary key default gen_random_uuid(),
  section_id  text not null references brief_sections(id) on delete cascade,
  qid         text not null,              -- 答案欄位鍵（例 email / company）
  label       text not null,
  hint        text,
  type        text not null default 'text' check (type in ('text','email','tel','paragraph','radio','checkbox')),
  required    boolean not null default false,
  options     jsonb  not null default '[]'::jsonb,   -- radio/checkbox 的選項字串陣列
  placeholder text,
  allow_other boolean not null default false,
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists brief_questions_section_idx on brief_questions(section_id, sort);

-- RLS：公開讀、authenticated 全權
alter table brief_sections  enable row level security;
alter table brief_questions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='brief_sections' and policyname='brief_sections_public_read') then
    create policy brief_sections_public_read on brief_sections for select using (true);
    create policy brief_sections_auth_all   on brief_sections for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='brief_questions' and policyname='brief_questions_public_read') then
    create policy brief_questions_public_read on brief_questions for select using (true);
    create policy brief_questions_auth_all   on brief_questions for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ===== 附加：seed（由 scripts/seed-brief.ts 產生；表為空時才執行）=====
do $$ begin
if not exists (select 1 from brief_sections) then
  insert into brief_sections (id, title, title_en, description, applies_to, sort) values ('basic', '基本資料', 'BASIC INFO', '這些資料用於後續合約擬定，請務必填寫真實資訊。', null, 0);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('basic', 'company', '企業名稱', '若暫無請寫「無」', 'text', true, '[]'::jsonb, '例：提摩設計', false, 0);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('basic', 'name', '專案負責人姓名', null, 'text', true, '[]'::jsonb, '請填寫真實姓名', false, 1);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('basic', 'phone', '聯絡電話', null, 'tel', true, '[]'::jsonb, '+886-9XX-XXX-XXX', false, 2);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('basic', 'email', '電子郵件', null, 'email', true, '[]'::jsonb, 'your@email.com', false, 3);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('basic', 'address', '公司地址', '請填寫真實地址', 'text', true, '[]'::jsonb, '台北市⋯', false, 4);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('basic', 'taxId', '公司統編', '若無，可填寫負責人身分證', 'text', true, '[]'::jsonb, '8 位統編', false, 5);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('basic', 'invoice', '是否需要開立發票？', '若需要開立發票，將由合作夥伴公司開立', 'radio', true, '["是（報價 +5% 稅金）","否"]'::jsonb, null, false, 6);
  insert into brief_sections (id, title, title_en, description, applies_to, sort) values ('vision', '品牌訴求', 'BRAND VISION', '讓我們更聚焦您對品牌的想像，有助於後續定位與視覺發展。', null, 1);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('vision', 'origin', '想成立品牌的起源或初衷是什麼？', '為什麼選擇以品牌發展，而不只是單純販售？歡迎詳答', 'paragraph', true, '[]'::jsonb, '說說品牌的故事⋯', false, 0);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('vision', 'services', '品牌的主要服務或商品內容', null, 'paragraph', true, '[]'::jsonb, null, false, 1);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('vision', 'audience', '未來主要面向的消費者（TA）', '可複選；若有特殊族群可在最後一格補充', 'checkbox', true, '["嬰幼兒族群 (0-7 歲)","年輕族群、學生 (20-35 歲)","小資家庭 (35-45 歲)","中老年 (50 以上)","單身上班族"]'::jsonb, null, true, 2);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('vision', 'uniqueness', '與市場上其他同行相比，您的品牌有什麼樣的獨特性？', null, 'paragraph', true, '[]'::jsonb, null, false, 3);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('vision', 'positioning', '希望這個品牌在市場上的角色與定位', '例如：創新、環保、舒適、設計感', 'text', true, '[]'::jsonb, null, false, 4);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('vision', 'personality', '假設您的品牌是一個人，您會怎麼向他人介紹它？', null, 'paragraph', true, '[]'::jsonb, null, false, 5);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('vision', 'competitors', '請提供 3 個您認為的對標品牌或競爭品牌', null, 'paragraph', true, '[]'::jsonb, null, false, 6);
  insert into brief_sections (id, title, title_en, description, applies_to, sort) values ('style', '視覺風格', 'VISUAL STYLE', '讓我們更了解您要的視覺方向，若有範例圖片之後可再提供給設計師。', null, 2);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('style', 'styleDirection', '整體視覺風格偏好', '可複選', 'checkbox', true, '["簡約自然（日系留白感）","可愛插畫風（親和力強、童趣）","復古設計風（溫暖、時代手繪感）","時尚潮感（搶眼有態度）","專業質感（色調乾淨、簡約、高級感、大地色）","溫馨低調（溫暖平易近人）","未來機能性科技感","賽博龐克 cyberpunk","港式風格","台灣在地","法式浪漫","東南亞風格（泰式、越南、馬來⋯）"]'::jsonb, null, true, 0);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('style', 'colorDirection', '色彩方向偏好', '可複選', 'checkbox', true, '["柔和溫暖色系（奶油色、豆沙色、橄欖綠）","清新自然色系（米色、淺木色、綠系⋯）","高對比撞色（紅藍、黑黃⋯等視覺強烈組合）","黑白灰極簡風格","暖色可愛系（粉紅、鵝黃、天空藍⋯）","時尚高級感（大地色系、莫蘭迪色系）"]'::jsonb, null, true, 1);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('style', 'inspirations', '平時喜歡或關注的品牌／空間／設計案例？', '說說吸引您的地方，可附連結', 'paragraph', false, '[]'::jsonb, null, false, 2);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('style', 'applications', '未來品牌應用的重點項目', '可複選', 'checkbox', false, '["包裝設計","官方網站／社群視覺","門市空間設計","展場／市集活動延伸","品牌週邊（明信片、提袋、貼紙等）"]'::jsonb, null, true, 3);
  insert into brief_sections (id, title, title_en, description, applies_to, sort) values ('outlook', '願景與體驗', 'EXPERIENCE & OUTLOOK', '辛苦了！這部分讓我們了解您對品牌未來的期待。', null, 3);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('outlook', 'customerExperience', '希望顧客在門市或服務中能體驗到什麼？', null, 'paragraph', false, '[]'::jsonb, null, false, 0);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('outlook', 'fiveYearGoal', '對於品牌 5 年內的發展目標與期待？', null, 'paragraph', false, '[]'::jsonb, null, false, 1);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('outlook', 'fiveKeywords', '請用 5 個詞語形容這個品牌給顧客的感受或印象', '例：溫暖、安心、有趣、天然、療癒、舒適、高級⋯', 'text', false, '[]'::jsonb, null, false, 2);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('outlook', 'association', '希望未來客戶一看到您的品牌就聯想到什麼畫面或代名詞？', null, 'paragraph', false, '[]'::jsonb, null, false, 3);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('outlook', 'channels', '未來產品銷售的主要通路', null, 'checkbox', false, '["門市（餐廳、實體門市、街邊店）","百貨公司／商城（櫃位、店面）","官網","展覽","電商平台（MOMO、蝦皮、露天⋯）"]'::jsonb, null, true, 4);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('outlook', 'slogan', '是否已有 Slogan？', null, 'text', false, '[]'::jsonb, '若有，請寫下', false, 5);
  insert into brief_sections (id, title, title_en, description, applies_to, sort) values ('brand-detail', '名片 / 文宣細節', 'BRAND COLLATERAL', '若有名片、菜單或文宣設計需求，請協助填寫以下細節。可全部留空。', array['brand']::text[], 4);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('brand-detail', 'cardInfo', '名片需要放上的詳細資訊', '建議 6 項以內，避免名片資訊過於擁擠', 'checkbox', false, '["中文名","英文名","職稱","個人電話","公司電話","統編","地址","網站（網址、QR 皆可）","社群媒體（IG、FB）","LINE（建議放 QR）","SLOGAN","產品服務"]'::jsonb, null, true, 0);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('brand-detail', 'cardMaterial', '名片材質偏好', null, 'radio', false, '["一般紙張（銅西、銅版、雪銅）— 僅限數位印刷","UV 紙張（雙面亮／霧、局部上光）— 僅限數位印刷","高級厚磅美術紙","由設計師為您量身精選（多數客戶推薦）"]'::jsonb, null, false, 1);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('brand-detail', 'cardFinish', '後加工選擇', '可複選，適用高級版方案；最多建議 1–3 種', 'checkbox', false, '["上光（光影變化）","導圓角","燙色（燙金、燙銀、霧金屬⋯）","特殊造型、軋型","雷射雕刻","打凸","打凹","壓印","壓線","對裱","由設計師量身精選"]'::jsonb, null, false, 2);
  insert into brief_sections (id, title, title_en, description, applies_to, sort) values ('product-detail', '包裝設計細節', 'PACKAGING DETAIL', '辛苦了！這是針對包裝設計的最後一段。', array['product']::text[], 5);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('product-detail', 'products', '產品的主要銷售內容', '若有多類產品，請以 1. 2. 3. 標示品項及用途', 'paragraph', true, '[]'::jsonb, null, false, 0);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('product-detail', 'labels', '是否已有完整的法定標籤／仿單？', '若沒有，請先確認法定規範格式及內容', 'radio', true, '["有","沒有","還在更新中，之後提供","設計師不用協助，包裝印出後自行處理"]'::jsonb, null, false, 1);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('product-detail', 'dieline', '是否已有包裝刀模？（ai / pdf）', null, 'radio', true, '["有，會提供給設計師","沒有，須設計師另外設計刀模結構（價格另計）"]'::jsonb, null, false, 2);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('product-detail', 'printAssist', '是否需要協助印刷？', null, 'radio', true, '["是","否"]'::jsonb, null, false, 3);
  insert into brief_sections (id, title, title_en, description, applies_to, sort) values ('crafts-detail', '工藝專案細節', 'CRAFTS DETAIL', '讓我們更了解您對工藝專案的想像。', array['crafts']::text[], 6);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('crafts-detail', 'craftsConcept', '想像中的工藝主題或概念', '例：產地材料、文化敘事、聯名故事⋯', 'paragraph', false, '[]'::jsonb, null, false, 0);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('crafts-detail', 'craftsMaterial', '偏好或想嘗試的材質', '可寫多種：陶、木、金屬、玻璃、複合媒材⋯', 'text', false, '[]'::jsonb, null, false, 1);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('crafts-detail', 'craftsQuantity', '預計製作數量／規模', null, 'text', false, '[]'::jsonb, '例：限量 50 件、單件藝術裝置⋯', false, 2);
  insert into brief_questions (section_id, qid, label, hint, type, required, options, placeholder, allow_other, sort) values ('crafts-detail', 'craftsChannel', '預計展示或銷售的場域', null, 'paragraph', false, '[]'::jsonb, null, false, 3);
end if;
end $$;
