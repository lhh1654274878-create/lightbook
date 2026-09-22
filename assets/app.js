/* ============================================================
   轻记账 LightBook · 核心逻辑
   数据层 / 自动分类引擎 / 智能识别 / 周期记账 / UI 交互
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 常量与内置分类 ---------- */
  var PALETTE = [
    '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6',
    '#AF52DE', '#FF2D55', '#5AC8FA', '#FFCC00', '#8E8E93'
  ];
  var EMOJIS = ['🍜', '🍔', '☕', '🚗', '🚇', '🛍️', '🏠', '⚡', '🎮', '🎬', '💊', '📚', '🎁', '💼', '📱', '💰', '🏦', '📈', '✈️', '🐱', '🍺', '🧾', '🏥', '🎓', '🧧', '🏋️', '💄', '🎵', '📦', '🤝', '👶', '🛠️', '🚕', '🍎', '🏪', '☂️'];

  var DEFAULT_CATS = [
    { id: 'c1',  name: '餐饮',     icon: '🍜', color: '#FF9500', type: 'expense' },
    { id: 'c2',  name: '交通',     icon: '🚗', color: '#007AFF', type: 'expense' },
    { id: 'c3',  name: '购物',     icon: '🛍️', color: '#FF2D55', type: 'expense' },
    { id: 'c4',  name: '居住',     icon: '🏠', color: '#5856D6', type: 'expense' },
    { id: 'c5',  name: '娱乐',     icon: '🎮', color: '#AF52DE', type: 'expense' },
    { id: 'c6',  name: '医疗',     icon: '💊', color: '#FF3B30', type: 'expense' },
    { id: 'c7',  name: '教育',     icon: '📚', color: '#5AC8FA', type: 'expense' },
    { id: 'c8',  name: '人情',     icon: '🎁', color: '#FFCC00', type: 'expense' },
    { id: 'c9',  name: '通讯',     icon: '📱', color: '#8E8E93', type: 'expense' },
    { id: 'c10', name: '其他支出', icon: '📦', color: '#8E8E93', type: 'expense' },
    { id: 'i1',  name: '工资',     icon: '💰', color: '#34C759', type: 'income' },
    { id: 'i2',  name: '奖金',     icon: '🏆', color: '#FF9500', type: 'income' },
    { id: 'i3',  name: '理财',     icon: '📈', color: '#5856D6', type: 'income' },
    { id: 'i4',  name: '兼职',     icon: '💼', color: '#5AC8FA', type: 'income' },
    { id: 'i5',  name: '红包',     icon: '🧧', color: '#FF3B30', type: 'income' },
    { id: 'i6',  name: '其他收入', icon: '🤝', color: '#8E8E93', type: 'income' }
  ];

  /* 内置自动分类规则：关键词 → 分类 id（60+ 条）
     注意：关键词按【长度优先】匹配，越具体的词越优先命中 */
  var DEFAULT_RULES = [
    { kw: '高速 高速公路 高速费 通行费 收费站 ETC 高速ETC 过路费 路桥费 服务区', cat: 'c2' },
    { kw: '滴滴 出租车 打车 网约车 地铁 公交 高铁 火车 机票 加油 停车 共享单车 哈啰 航空 铁路 12306 航旅纵横 停车费 洗车 车险 保养 修车', cat: 'c2' },
    { kw: '美团 饿了么 外卖 麦当劳 肯德基 星巴克 瑞幸 海底捞 火锅 奶茶 咖啡 餐厅 食堂 小吃 烧烤 面馆 饺子 早餐 午餐 晚餐 饭 菜 蛋糕 水果店 便利店 蜜雪冰城 茶百道 喜茶 奈雪 汉堡 披萨 蛋糕店', cat: 'c1' },
    { kw: '淘宝 天猫 京东 拼多多 唯品会 苏宁 超市 商场 百货 优衣库 无印良品 网购 快递 服饰 鞋 化妆品 屈臣氏 名创优品 小米商城 华为商城 苹果 数码 家电 衣服 裤子 鞋包', cat: 'c3' },
    { kw: '房租 物业 水费 电费 燃气 煤气 宽带 供暖 中介 维修 装修 水电', cat: 'c4' },
    { kw: '电影 KTV 游戏 网吧 景区 门票 视频会员 腾讯视频 爱奇艺 网易云 QQ音乐 B站 直播 打赏 剧本杀 桌游 影院 演出 演唱会 健身 游泳 球馆', cat: 'c5' },
    { kw: '医院 药房 药店 诊所 挂号 体检 医保 牙科 门诊 住院 保健品 药品 医药 诊所 化验', cat: 'c6' },
    { kw: '学费 培训 课程 网课 书店 书籍 考试 报名 驾校 文具 辅导 学习 考研 公务员', cat: 'c7' },
    { kw: '红包 送礼 份子钱 请客 礼金 生日 转账 还款', cat: 'c8' },
    { kw: '话费 充值 手机 流量 宽带费 运营商 中国移动 中国联通 中国电信 话费充值', cat: 'c9' },
    { kw: '酒店 民宿 机票 火车票 高铁票 旅游 旅行 景点 门票 景区 度假 出国 签证 旅行社', cat: 'c5' },
    { kw: '工资 薪资 薪水 发薪', cat: 'i1' },
    { kw: '奖金 年终奖 绩效 分红', cat: 'i2' },
    { kw: '理财 基金 利息 股票 收益 余额宝 零钱通', cat: 'i3' },
    { kw: '兼职 外快 劳务 稿费 佣金 提成', cat: 'i4' },
    { kw: '红包 收款 礼金 转账收入', cat: 'i5' }
  ];

  /* 排除词：命中这些词时不匹配对应分类（防止误分类）
     例如「收费站」含「站」但不能归为餐饮 */
  var EXCLUDE_RULES = [
    { kw: '收费站 服务区 高速', cat: 'c1' } /* 高速场景出现的「餐厅/饭店」不归餐饮 */
  ];

  /* ---------- 状态 ---------- */
  var state = {
    cats: [],
    rules: [],       // { kw: '美团 饿了么', cat: 'c1', builtin: true }
    bills: [],       // { id, type, amount, cat, remark, date: 'YYYY-MM-DD', source: 'manual'|'auto'|'recurring'|'parse' }
    recurring: [],   // { id, type, amount, cat, name, day }
    budget: 0,       // 月支出预算（0 = 未设置）
    catBudgets: {},  // 分类预算：{ catId: 金额 }
    searchQuery: '', // 搜索关键词
    learned: [],     // 自学习纠正：{ kw, cat }
    autoOn: false,   // 自动记账开关（剪贴板轮询）
    month: null,     // { y, m }
    editingId: null, // 正在编辑的账单 id
    parsePending: null // 智能识别待入账结果
  };

  var LS_KEY = 'lightbook_v2';
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 工具 ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtMoney(n) { return (Math.round(n * 100) / 100).toFixed(2); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function monthStr(m) { return m.y + '-' + pad(m.m); }
  function curMonth() {
    var d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  }
  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
  function uid() { return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function makeBillKey(res) {
    var remark = String(res && res.remark || '').replace(/\s+/g, '').toLowerCase();
    return [res.type, Math.round(Number(res.amount) * 100), res.date, remark].join('|');
  }
  function findDuplicateBill(res) {
    var key = makeBillKey(res);
    return state.bills.find(function (bill) {
      return bill.key === key || makeBillKey(bill) === key;
    }) || null;
  }
  function saveParsedBill(res, source) {
    if (!res || !Number.isFinite(res.amount) || res.amount <= 0) return null;
    var duplicate = findDuplicateBill(res);
    if (duplicate) return duplicate;
    var cat = res.cat || autoClassify(res.remark, res.type) || (defaultCat(res.type) || {}).id;
    var bill = {
      id: uid(), key: makeBillKey(res), type: res.type, amount: Math.round(res.amount * 100) / 100,
      cat: cat, remark: res.remark || '自动识别账单', date: res.date, source: source
    };
    state.bills.push(bill);
    save();
    renderHome();
    checkBudgetWarn();
    return bill;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function hexA(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  /* 防抖：延迟执行，输入过程只触发一次 */
  function debounce(fn, ms) {
    var timer = null;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  /* ---------- 存储（节流写入） ----------
     save() 打标记，150ms 内合并多次修改为一次写入，
     beforeunload 兜底确保数据不丢 */
  var STORAGE_OK = true;
  var _saveTimer = null, _dirty = false;
  function _write() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        cats: state.cats, rules: state.rules, bills: state.bills, recurring: state.recurring, budget: state.budget, learned: state.learned || [], autoOn: !!state.autoOn, catBudgets: state.catBudgets || {}
      }));
      STORAGE_OK = true;
    } catch (e) { STORAGE_OK = false; }
  }
  function save() {
    _dirty = true;
    if (_saveTimer) return;
    _saveTimer = setTimeout(function () {
      _saveTimer = null;
      if (_dirty) { _dirty = false; _write(); }
    }, 150);
  }
  window.addEventListener('beforeunload', function () {
    if (_dirty) { _dirty = false; _write(); }
  });
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      state.cats = d.cats || [];
      state.rules = d.rules || [];
      state.bills = d.bills || [];
      state.bills.forEach(function (bill) {
        if (!bill.key) bill.key = makeBillKey(bill);
      });
      state.recurring = d.recurring || [];
      state.budget = d.budget || 0;
      state.learned = d.learned || [];
      state.autoOn = !!d.autoOn;
      state.catBudgets = d.catBudgets || {};
      return true;
    } catch (e) { return false; }
  }

  /* ---------- 分类 ---------- */
  function catsOf(type) { return state.cats.filter(function (c) { return c.type === type; }); }
  function getCat(id) {
    for (var i = 0; i < state.cats.length; i++) if (state.cats[i].id === id) return state.cats[i];
    return null;
  }
  function defaultCat(type) {
    var cs = catsOf(type);
    return cs.length ? cs[0] : null;
  }

  /* ---------- 自动分类引擎（预编译索引，避免每次 split） ----------
     输入：文本 + 账单类型
     输出：匹配到的分类 id（无匹配返回 null）
     机制：
     1. 预编译索引（关键词数组 + 排除词数组）
     2. 长度优先匹配（更具体的词优先）
     3. 排除词否决（如高速场景的「餐厅」不归餐饮）
     4. 自学习纠正：用户手动改过的分类（learnedRules）优先命中 */
  var _ruleIndex = null; // [{cat, type, kws:[...], exks:[...]}]
  function buildRuleIndex() {
    _ruleIndex = state.rules.map(function (r) {
      var c = getCat(r.cat);
      return {
        cat: r.cat,
        type: c ? c.type : null,
        kws: String(r.kw).split(/\s+/).filter(Boolean)
      };
    });
    /* 加入排除词信息 */
    _ruleIndex.forEach(function (ri) {
      ri.exks = [];
      EXCLUDE_RULES.forEach(function (ex) {
        if (ex.cat === ri.cat) ri.exks = ri.exks.concat(String(ex.kw).split(/\s+/).filter(Boolean));
      });
    });
    /* 自学习纠正规则（最高优先级） */
    var learned = state.learned || [];
    learned.forEach(function (l) {
      _ruleIndex.push({ cat: l.cat, type: getCat(l.cat) ? getCat(l.cat).type : null, kws: [l.kw], exks: [], learned: true });
    });
  }
  function autoClassify(text, type) {
    if (!text) return null;
    var t = String(text);
    var best = null, bestLen = 0;
    var rules = _ruleIndex || state.rules.map(function (r) {
      var c = getCat(r.cat);
      return { cat: r.cat, type: c ? c.type : null, kws: String(r.kw).split(/\s+/).filter(Boolean) };
    });
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.type !== type) continue;
      var kws = r.kws;
      for (var j = 0; j < kws.length; j++) {
        if (t.indexOf(kws[j]) >= 0) {
          /* 排除词否决：若命中词属于被排除词，跳过 */
          if (r.exks && r.exks.length) {
            var blocked = false;
            for (var x = 0; x < r.exks.length; x++) {
              if (kws[j].indexOf(r.exks[x]) >= 0 || r.exks[x].indexOf(kws[j]) >= 0) { blocked = true; break; }
            }
            if (blocked) continue;
          }
          if (kws[j].length > bestLen) {
            best = r.cat; bestLen = kws[j].length;
          }
        }
      }
    }
    return best;
  }

  /* ---------- 自学习纠正 ----------
     用户在记账界面手动改了分类后调用：
     记录「备注关键词 → 用户选的分类」，下次自动分类优先命中 */
  function learnFromCorrection(remark, catId) {
    if (!remark || !catId) return;
    var kw = String(remark).trim().slice(0, 12); /* 取前12字作为学习关键词 */
    if (kw.length < 2) return;
    state.learned = state.learned || [];
    /* 已有相同关键词，更新分类 */
    var found = false;
    state.learned.forEach(function (l) {
      if (l.kw === kw) { l.cat = catId; found = true; }
    });
    if (!found) state.learned.push({ kw: kw, cat: catId });
    /* 最多保留 50 条，防止膨胀 */
    if (state.learned.length > 50) state.learned = state.learned.slice(-50);
    buildRuleIndex();
    save();
  }

  /* ---------- 智能识别：解析支付通知文本 ---------- */
  var NOISE_WORDS = ['支付凭证', '交易提醒', '到账提醒', '消费提醒', '付款成功', '交易成功', '消费记录', '支出提醒', '银行卡', '您尾号', '您于', '余额', '尊敬的', '您好', '通知', '提醒', '账单', '收款人', '付款方', '交易对方', '账户', '账号', '卡号', '尾号'];
  var VERB_PREFIX = /^(向|在|于|给|花|花了|用|消费|支付|付款|购买|扣款|支出|收款|到账|收入|转入|退款|交易|使用|获得)+/;
  var VERB_SUFFIX = /(收到|到账|转入|入账|转账|支付|付款|扣款|支出|消费|购买|成功|交易|提醒|收款|退款|退回|花了|花掉)+$/;
  var VERB_MID = /(?:收到|到账|转入|入账|转账|支付|付款|扣款|支出|消费|购买|成功|交易|提醒|收款|退款|退回|花了|花掉)([\u4e00-\u9fa5]{2,14})$/;

  /* 中文数字转阿拉伯数字（支持 0-99999999） */
  function cnToNum(str) {
    var map = { '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
    var unit = { '十': 10, '百': 100, '千': 1000 };
    var result = 0, cur = 0, wan = 0;
    for (var i = 0; i < str.length; i++) {
      var c = str[i];
      if (map[c] !== undefined) cur = map[c];
      else if (unit[c]) {
        if (cur === 0) cur = 1;
        result += cur * unit[c];
        cur = 0;
      } else if (c === '万') {
        wan = (result + cur) * 10000;
        result = 0; cur = 0;
      }
    }
    return wan + result + cur;
  }

  function cleanMerchant(cand) {
    if (!cand) return '';
    var c = cand.replace(VERB_SUFFIX, '');           /* 1) 去掉结尾动词（可叠加） */
    var m = c.match(VERB_MID);                        /* 2) 去掉中间动词，保留其后商户 */
    if (m) c = m[1];
    c = c.replace(VERB_PREFIX, '');                   /* 3) 去掉开头介词/动词 */
    return c;
  }

  function extractMerchant(s, amtIdx, amtLen) {
    /* s 已屏蔽平台词（支付宝→ALIPAY 等），长度与索引一致 */
    /* 1) 优先取金额前最近的中文商户（去除日期残留） */
    if (amtIdx > 0) {
      var before = s.slice(0, amtIdx).replace(/\d{1,2}[月\/\-.]\d{1,2}日?/g, '').replace(/[\s，。、：:；;！!？?（）()【】\[\]“”"'‘’]+$/g, '');
      var mm = before.match(/([\u4e00-\u9fa5]{2,14})$/);
      if (mm) {
        var cand = cleanMerchant(mm[1]);
        var noise = NOISE_WORDS.some(function (n) { return cand.indexOf(n) >= 0; });
        if (!noise && cand.length >= 2) return cand;
      }
    }
    /* 2) 金额后方括号内的商户，如「支出 666.00 元（XX超市）」 */
    if (amtIdx >= 0 && amtLen > 0) {
      var after = s.slice(amtIdx + amtLen);
      var bm = after.match(/[（(]([\u4e00-\u9fa5A-Za-z0-9·]{2,14})[)）]/);
      if (bm) return cleanMerchant(bm[1]);
    }
    /* 3) 句式正则兜底 */
    var m = s.match(/(?:向|在|于|支付给|付款给|消费于)\s*([\u4e00-\u9fa5A-Za-z0-9·]{2,12}?)(?:付款|支付|消费|购买|扣款|支出|，|。|$)/);
    if (!m) m = s.match(/(?:在|于|向|给)\s*([\u4e00-\u9fa5A-Za-z0-9·]{2,12})(?:的|商户|公司|店)?\s*(?:消费|支付|付款|购买)/);
    return m ? cleanMerchant(m[1]) : '';
  }

  /* ============================================================
     语音口语解析器 parseVoice
     专为「语音识别结果」设计，支持常见口语说法：
     - 中文数字：二十五 / 十二块五 / 一百二 / 三十
     - 阿拉伯数字：25 / 12.5 / 25块
     - 口语句式：花了30 / 坐地铁4块 / 麦当劳二十五 / 收到工资5000
     - 收入识别：收到/收了/赚了/进账/到账
     返回 { amount, remark, date, type }，解析失败 amount 为 null
     ============================================================ */
  function extractVoiceAmt(t) {
    var out = { val: null, idx: -1, len: 0 };
    /* A1: 阿拉伯数字 + 单位（25块 / 25元 / 12.5 / 18块5） */
    var m1 = t.match(/(\d+(?:\.\d{1,2})?)\s*(?:块钱|块|元)\s*([\d零一二两三四五六七八九])?\s*(?:毛|角)?/);
    if (m1) {
      var dec1 = m1[2] ? (/^\d/.test(m1[2]) ? parseInt(m1[2], 10) : cnToNum(m1[2])) : 0;
      out.val = parseFloat(m1[1]) + dec1 * 0.1;
      out.idx = t.indexOf(m1[0]); out.len = m1[0].length; return out;
    }
    /* A2: 中文数字 + 单位（二十五元 / 十二块五 / 十五块五毛） */
    var m2 = t.match(/([零一二两三四五六七八九十百千万]+)\s*(?:块钱|块|元)\s*([零一二两三四五六七八九])?\s*(?:毛|角)?/);
    if (m2) {
      var main = cnToNum(m2[1]);
      var dec = m2[2] ? cnToNum(m2[2]) : 0;
      if (main + dec > 0) { out.val = main + dec * 0.1; out.idx = t.indexOf(m2[0]); out.len = m2[0].length; return out; }
    }
    /* B: 口语动词后的数字（花了30 / 付了25 / 消费十八） */
    var m3 = t.match(/(?:花了|花掉|付了|付给|消费|支出|用了|花费|花|买)(?:了)?\s*([零一二两三四五六七八九十百千万]+|\d+(?:\.\d{1,2})?)/);
    if (m3) {
      var v = m3[1];
      var num = /^\d/.test(v) ? parseFloat(v) : cnToNum(v);
      if (num > 0) { out.val = num; out.idx = t.indexOf(m3[0]); out.len = m3[0].length; return out; }
    }
    /* C: 中文数字兜底（麦当劳二十五 / 咖啡三十）取最后一段 */
    var m4 = t.match(/([零一二两三四五六七八九十百千万]+)/g);
    if (m4) {
      var lastCn = m4[m4.length - 1];
      var vv = cnToNum(lastCn);
      var om = lastCn.match(/^([一二两三四五六七八九])百([一二三四五六七八九])$/);
      if (om) vv = cnToNum(om[1]) * 100 + cnToNum(om[2]) * 10; /* 口语省略：一百二 = 120 */
      if (vv > 0) { out.val = vv; out.idx = t.lastIndexOf(lastCn); out.len = lastCn.length; return out; }
    }
    /* D: 纯阿拉伯数字兜底（麦当劳25） */
    var m5 = t.match(/(\d+(?:\.\d{1,2})?)/);
    if (m5) { out.val = parseFloat(m5[1]); out.idx = t.indexOf(m5[1]); out.len = m5[1].length; return out; }
    return out;
  }
  function parseVoice(text) {
    var t = String(text || '').replace(/[，。、！？!?；;：:，]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    var out = { amount: null, remark: '', date: todayStr(), type: 'expense' };
    /* 收入/支出方向 */
    if (/(收到|收了|赚了|进账|到账|收入|发工资|红包|收款|入账|转入)/.test(t)) out.type = 'income';
    else if (/(花了|花掉|付了|付给|消费|支付|支出|付款|买|打车|坐|充|交|还|吃|喝|逛)/.test(t)) out.type = 'expense';
    /* 金额 */
    var a = extractVoiceAmt(t);
    if (a.val !== null) { out.amount = a.val; }
    /* 商户：金额前的中文词（去口语动词） */
    if (a.idx > 0) {
      var before = t.slice(0, a.idx);
      var mm = before.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,12})$/);
      if (mm) {
        var c = mm[1].replace(/(在|去|到|买了|花了|付了|用了|消费|支付|坐|吃|喝|逛|交|充|买|给|收到|发了)$/, '');
        c = c.replace(/(在|去|到|买|花|付|用|坐|吃|喝|逛|交|充|给)$/, '');
        c = c.replace(/^(在|去|到|买了|花了|付了|用了|消费|支付|打车|坐|吃|喝|逛|交|充|买|给|收到|发了|花)/, '');
        c = c.replace(/^(在|去|到|买|花|付|用|坐|吃|喝|逛|交|充|给|收)/, '');
        if (c.length >= 2) out.remark = c;
      }
    }
    /* 商户：金额后的中文词（花30买咖啡 / 在肯德基吃了30） */
    if (!out.remark && a.idx >= 0 && a.len > 0) {
      var after = t.slice(a.idx + a.len);
      var am = after.match(/^(?:在|去|到|买了|花了|付了|吃|喝|买)\s*([\u4e00-\u9fa5A-Za-z0-9]{2,12})/);
      if (!am) am = after.match(/^([\u4e00-\u9fa5A-Za-z0-9]{2,12}?)(?:花了|付了|消费|用了|买|的)/);
      if (am) out.remark = am[1];
    }
    return out.amount === null ? null : out;
  }

  function normalizeNumericText(text) {
    var s = String(text || '')
      .replace(/[，]/g, ',')
      .replace(/[．]/g, '.')
      .replace(/[０-９]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 65248);
      });
    return s.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  }

  function parseNotify(text) {
    var t = normalizeNumericText(String(text || '')).replace(/\s+/g, ' ').trim();
    if (!t) return null;
    var s = t
      .replace(/支付宝/g, 'ALIPAY')
      .replace(/微信支付/g, 'WXPAY')
      .replace(/云闪付/g, 'YSF')
      .replace(/银联/g, 'UNION');
    var out = { amount: null, remark: '', date: todayStr(), type: 'expense' };
    var amtIdx = -1, amtVal = null, amtLen = 0;

    function locate(match, value) {
      amtVal = value;
      amtIdx = s.indexOf(match);
      amtLen = match.length;
    }

    var m1 = s.match(/([¥￥]\s*)(\d+(?:\.\d{1,2})?)/);
    var m2 = s.match(/(\d+(?:\.\d{1,2})?)\s*[元块]/);
    var m3 = s.match(/(?:消费|支付|付款|支出|扣款|转账|收款|到账|收入|入账)(?:了|为|金额|人民币)?\s*[:：]?\s*(\d+(?:\.\d{1,2})?)/);
    var mCn = s.match(/([零一两三四五六七八九十百千万]+)[元块]/);
    if (m1) locate(m1[0], parseFloat(m1[2]));
    else if (m2) locate(m2[0], parseFloat(m2[1]));
    else if (m3) locate(m3[0], parseFloat(m3[1]));
    else if (mCn) {
      var cnv = cnToNum(mCn[1]);
      if (cnv > 0) locate(mCn[0], cnv);
    }

    if (amtVal === null) {
      var mask = function (m) { return '\u0000'.repeat(m.length); };
      var clean = s
        .replace(/(20\d{2})[年\/\-.](\d{1,2})[月\/\-.](\d{1,2})日?/g, mask)
        .replace(/\d{1,2}月\d{1,2}日?/g, mask)
        .replace(/\d{1,2}[\/\-]\d{1,2}/g, mask)
        .replace(/([01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?/g, mask);
      var matches = [], re4 = /(?:^|[^0-9.])(\d+(?:\.\d{1,2})?)(?![0-9.])/g, mm4;
      while ((mm4 = re4.exec(clean)) !== null) {
        var candidate = parseFloat(mm4[1]);
        if (candidate > 0 && candidate <= 10000000) matches.push(mm4);
      }
      if (matches.length) {
        var last = matches[matches.length - 1];
        amtVal = parseFloat(last[1]);
        amtIdx = clean.indexOf(last[1]);
        amtLen = last[1].length;
      }
    }
    out.amount = amtVal;

    if (/(退款|退回)/.test(s) && !/(退款失败|退回失败)/.test(s)) out.type = 'income';
    else {
      var strongIncome = /(收款|到账|入账|收入|转入|收到|获得)/.test(s);
      var strongExpense = /(支出|扣款|消费|购买|支付成功|付款成功|付款给|支付给|消费了|支出了|.{0,10}付款|消费.{1,12}元|支出.{1,12}元|购买.{1,12}元)/.test(s);
      if (strongExpense) out.type = 'expense';
      else if (strongIncome) out.type = 'income';
      else out.type = 'expense';
    }

    out.remark = extractMerchant(s, amtIdx, amtLen);

    var d = t.match(/(20\d{2})[年\/\-.](\d{1,2})[月\/\-.](\d{1,2})日?/) || t.match(/(\d{1,2})月(\d{1,2})日?/) || t.match(/(\d{1,2})[\/\-](\d{1,2})日?/);
    if (d) {
      var yearPart = d[1];
      var monthPart = d[2];
      var dayPart = d[3];
      if (yearPart.length !== 4) {
        dayPart = monthPart;
        monthPart = yearPart;
        yearPart = String(curMonth().y);
      }
      var y = parseInt(yearPart, 10);
      var mm = parseInt(monthPart, 10);
      var dd = parseInt(dayPart, 10);
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) out.date = y + '-' + pad(mm) + '-' + pad(dd);
    }

    if (out.amount === null && !out.remark) return null;
    if (out.amount === null) {
      var any = t.match(/(\d+(?:\.\d{1,2})?)/);
      if (any) out.amount = parseFloat(any[1]);
    }
    return out;
  }

  function runRecurring() {
    var now = curMonth();
    var today = new Date().getDate();
    var count = 0;
    state.recurring.forEach(function (r) {
      if (r.day > today) return;
      var targetDay = Math.min(r.day, daysInMonth(now.y, now.m));
      var dateStr = now.y + '-' + pad(now.m) + '-' + pad(targetDay);
      var exists = state.bills.some(function (b) { return b.recurringId === r.id && b.date === dateStr; });
      if (!exists) {
        state.bills.push({
          id: uid(), key: makeBillKey({ type: r.type, amount: r.amount, date: dateStr, remark: r.name }),
          type: r.type, amount: r.amount, cat: r.cat,
          remark: r.name, date: dateStr, source: 'recurring', recurringId: r.id
        });
        count++;
      }
    });
    if (count > 0) save();
    return count;
  }

  /* ---------- 账单查询 ---------- */
  function billsInMonth(ym) {
    var p = ym.y + '-' + pad(ym.m);
    return state.bills.filter(function (b) { return b.date.indexOf(p) === 0; });
  }
  function sumOf(list, type) {
    return list.reduce(function (s, b) { return b.type === type ? s + b.amount : s; }, 0);
  }
  function sortBills(list) {
    return list.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }
  function groupByDay(list) {
    var groups = {};
    list.forEach(function (b) {
      (groups[b.date] = groups[b.date] || []).push(b);
    });
    var keys = Object.keys(groups).sort().reverse();
    return keys.map(function (k) { return { date: k, items: groups[k] }; });
  }
  function dayLabel(dateStr) {
    var parts = dateStr.split('-');
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    var week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    var today = todayStr();
    if (dateStr === today) return '今天';
    var yest = new Date(); yest.setDate(yest.getDate() - 1);
    var ys = yest.getFullYear() + '-' + pad(yest.getMonth() + 1) + '-' + pad(yest.getDate());
    if (dateStr === ys) return '昨天';
    return parseInt(parts[1], 10) + '月' + parseInt(parts[2], 10) + '日 周' + week;
  }

  /* ---------- 账单 DOM ---------- */
  function billItemHTML(b) {
    var c = getCat(b.cat) || { icon: '🧾', name: '未分类', color: '#8E8E93' };
    var cls = b.type === 'income' ? 'inc' : 'exp';
    var tag = '';
    if (b.source === 'auto' || b.source === 'parse') tag = '<span class="tag auto">自动</span>';
    if (b.source === 'recurring') tag = '<span class="tag auto">周期</span>';
    return '<div class="bill-item" data-id="' + b.id + '">' +
      '<div class="b-ico" style="--bc:' + hexA(c.color, 0.12) + '">' + c.icon + '</div>' +
      '<div class="b-info">' +
        '<div class="n">' + esc(b.remark || c.name) + tag + '</div>' +
        '<div class="d">' + esc(c.name) + ' · ' + esc(b.date.slice(5)) + '</div>' +
      '</div>' +
      '<div class="b-amt ' + cls + '">' + fmtMoney(b.amount) + '</div>' +
      '<button class="b-del" data-del="' + b.id + '">删除</button>' +
    '</div>';
  }

  function renderBillList(container, list, showAll) {
    var groups = groupByDay(list);
    if (!groups.length) {
      container.innerHTML = '<div class="empty"><span class="e-ico">🧾</span>本月还没有账单<br>点下方 ＋ 记一笔，或使用智能识别</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      var dayExp = sumOf(g.items, 'expense');
      var dayInc = sumOf(g.items, 'income');
      html += '<div class="group-label"><span>' + dayLabel(g.date) + '</span><span>' +
        (dayExp > 0 ? '支 ' + fmtMoney(dayExp) + '　' : '') +
        (dayInc > 0 ? '收 ' + fmtMoney(dayInc) : '') + '</span></div>';
      html += '<div class="bill-list">' + g.items.map(billItemHTML).join('') + '</div>';
      html += '<div style="height:6px"></div>';
    }
    container.innerHTML = html;
  }

  /* ---------- 预算渲染 ---------- */
  function renderBudget() {
    var box = $('budget-bar');
    if (!box) return;
    var exp = sumOf(billsInMonth(state.month), 'expense');
    if (!state.budget || state.budget <= 0) {
      /* 没有总预算但可能有分类预算 */
      var catB = state.catBudgets || {};
      var hasCatB = Object.keys(catB).some(function (k) { return catB[k] > 0; });
      if (!hasCatB) {
        box.innerHTML = '<div class="budget-empty" id="budget-set">💰 设置本月支出预算 <span>›</span></div>';
        return;
      }
    }
    var pct = state.budget > 0 ? Math.min(100, Math.round(exp / state.budget * 100)) : 0;
    var color = exp > state.budget ? 'var(--danger)' : (pct >= 80 ? 'var(--warn)' : 'var(--accent2)');
    var remain = state.budget - exp;
    var html = '';
    if (state.budget > 0) {
      html += '<div class="budget-head"><span>本月预算</span><b style="color:' + color + '">' + fmtMoney(exp) + ' / ' + fmtMoney(state.budget) + ' 元</b></div>' +
        '<div class="budget-track"><i style="width:' + pct + '%;background:' + color + '"></i></div>' +
        '<div class="budget-foot"><span>' + (remain >= 0 ? '还可花 ' + fmtMoney(remain) + ' 元' : '已超支 ' + fmtMoney(-remain) + ' 元') + '</span><span>' + pct + '%</span></div>';
    }
    /* 分类预算进度 */
    var catB = state.catBudgets || {};
    var rows = '';
    catsOf('expense').forEach(function (c) {
      var cb = catB[c.id];
      if (!cb || cb <= 0) return;
      var spent = state.bills.filter(function (b) { return b.type === 'expense' && b.cat === c.id && b.date.slice(0, 7) === monthStr(state.month); })
        .reduce(function (s, b) { return s + b.amount; }, 0);
      var cp = Math.min(100, Math.round(spent / cb * 100));
      var cc = spent > cb ? 'var(--danger)' : (cp >= 80 ? 'var(--warn)' : c.color);
      rows += '<div class="budget-head cat-b" style="margin-top:7px"><span style="color:var(--muted)">' + c.icon + ' ' + c.name + '</span><b style="color:' + cc + ';font-size:.78rem">' + fmtMoney(spent) + '/' + fmtMoney(cb) + '</b></div>' +
        '<div class="budget-track" style="height:5px;margin-top:4px"><i style="width:' + cp + '%;background:' + cc + '"></i></div>';
    });
    html += rows;
    box.innerHTML = html;
  }

  /* 分类预算弹层渲染 */
  function renderCatBudgetList() {
    var box = $('cat-budget-list');
    if (!box) return;
    var catB = state.catBudgets || {};
    var html = '';
    catsOf('expense').forEach(function (c) {
      html += '<div class="cat-budget-row">' +
        '<div class="cb-name"><span class="cb-ico" style="--bc:' + hexA(c.color, 0.12) + ';background:var(--bc)">' + c.icon + '</span>' + c.name + '</div>' +
        '<input type="number" inputmode="decimal" placeholder="不限" data-cbcat="' + c.id + '" value="' + (catB[c.id] || '') + '">' +
        '</div>';
    });
    box.innerHTML = html;
  }

  /* 设置页预算摘要 */
  function renderBudgetSummary() {
    var el = $('budget-summary');
    if (!el) return;
    el.textContent = state.budget > 0 ? '当前每月 ' + fmtMoney(state.budget) + ' 元，点击调整' : '设置每月支出预算，实时跟踪进度';
  }

  /* 今日支出汇总条 */
  function renderTodaySummary() {
    var box = $('today-summary');
    if (!box) return;
    var t = todayStr();
    var todayBills = state.bills.filter(function (b) { return b.date === t; });
    var exp = sumOf(todayBills, 'expense');
    var inc = sumOf(todayBills, 'income');
    var d = new Date();
    var week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    if (!todayBills.length) {
      box.innerHTML = '<span class="ts-label">今天（周' + week + '）支出</span><span class="ts-amt">¥0.00</span><span class="ts-count">今日无账单</span>';
      return;
    }
    box.innerHTML = '<span class="ts-label">今天（周' + week + '）支出</span>' +
      '<span class="ts-amt">¥' + fmtMoney(exp) + '</span>' +
      '<span class="ts-count">' + todayBills.filter(function (b) { return b.type === 'expense'; }).length + ' 笔' +
      (inc > 0 ? ' · 收 ¥' + fmtMoney(inc) : '') + '</span>';
  }

  /* 超支提醒（保存账单后调用，避免每次记账重复弹） */
  var _lastBudgetWarn = '';
  function checkBudgetWarn() {
    if (!state.budget || state.budget <= 0) return;
    var exp = sumOf(billsInMonth(state.month), 'expense');
    if (exp > state.budget) {
      var key = state.month.y + '-' + state.month.m + ':' + (exp > state.budget ? 'over' : '');
      if (_lastBudgetWarn !== key) {
        _lastBudgetWarn = key;
        toast('⚠️ 本月支出已超预算 ' + fmtMoney(exp - state.budget) + ' 元');
      }
    } else if (state.budget > 0 && exp >= state.budget * 0.8) {
      var key2 = state.month.y + '-' + state.month.m + ':' + '80';
      if (_lastBudgetWarn !== key2) {
        _lastBudgetWarn = key2;
        toast('📊 本月预算已使用 ' + Math.round(exp / state.budget * 100) + '%，请注意');
      }
    }
  }

  /* ---------- 渲染：首页（增量更新，避免全量重建） ---------- */
  function renderHome(full) {
    var ym = state.month;
    var list = sortBills(billsInMonth(ym));
    var exp = sumOf(list, 'expense');
    var inc = sumOf(list, 'income');

    /* 汇总数字：textContent 增量更新（无 DOM 重建） */
    $('sum-balance').textContent = fmtMoney(inc - exp);
    $('sum-expense').textContent = '¥' + fmtMoney(exp);
    $('sum-income').textContent = '¥' + fmtMoney(inc);
    $('sum-count').textContent = list.length;
    $('m-label').textContent = ym.y + '年' + ym.m + '月';
    $('today-sub').textContent = new Date().getFullYear() + '年' + (new Date().getMonth() + 1) + '月' + new Date().getDate() + '日';
    renderBudget();
    renderTodaySummary();

    /* 快捷分类：仅首次或分类变化时重建（数据改变时不重建） */
    if (full || !window.__quickRendered) {
      var qhtml = '';
      catsOf('expense').slice(0, 4).forEach(function (c) {
        qhtml += '<div class="quick-btn cat" data-cat="' + c.id + '" data-type="expense" style="--qc:' + c.color + '">' +
          '<div class="q-ico">' + c.icon + '</div><div class="q-txt">' + c.name + '</div></div>';
      });
      catsOf('income').slice(0, 2).forEach(function (c) {
        qhtml += '<div class="quick-btn cat" data-cat="' + c.id + '" data-type="income" style="--qc:' + c.color + '">' +
          '<div class="q-ico">' + c.icon + '</div><div class="q-txt">' + c.name + '</div></div>';
      });
      qhtml += '<div class="quick-btn" id="quick-more"><div class="q-ico">⋯</div><div class="q-txt">更多</div></div>';
      $('quick-grid').innerHTML = qhtml;
      window.__quickRendered = true;
    }

    /* 账单列表（数据变了必须重建；限制渲染数量 + content-visibility 虚拟化） */
    var shown = searchFilter(list);
    renderBillList($('bill-area'), shown.slice(0, 50), false);
    $('all-month-label').textContent = ym.y + '年' + ym.m + '月';
    /* 全部账单弹层：懒加载，仅打开时渲染 */
    if (window.__allSheetOpen) renderAllSheet();
    renderRepeatRow();
  }

  /* 搜索过滤 */
  function searchFilter(list) {
    var q = (state.searchQuery || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(function (b) {
      var c = getCat(b.cat) || { name: '' };
      return (b.remark && b.remark.toLowerCase().indexOf(q) >= 0) ||
             c.name.toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderAllSheet() {
    var list = sortBills(billsInMonth(state.month));
    var container = $('all-bill-list');
    if (!list.length) {
      container.innerHTML = '<div class="empty"><span class="e-ico">🧾</span>本月暂无账单</div>';
      return;
    }
    renderBillList(container, searchFilter(list), true);
  }

  /* ---------- 渲染：统计 ---------- */
  /* 暴露数据给图表模块 */
  function exposeToCharts() {
    window.__LB_STATE = state;
    window.__LB_BILLS = state.bills;
    window.__LB_CATS = state.cats;
  }
  function statType() {
    var on = document.querySelector('#stat-tabs button.on');
    return on ? on.getAttribute('data-r') : 'expense';
  }
  function renderStats() {
    exposeToCharts();
    var type = statType();
    /* 本月摘要：总额 / 日均 / 笔均 */
    var curList = billsInMonth(state.month).filter(function (b) { return b.type === type; });
    var curTotal = sumOf(curList, type);
    var today = new Date();
    var dayUsed = today.getDate();
    var avg = curTotal / dayUsed;
    var per = curList.length ? curTotal / curList.length : 0;
    $('stat-summary').innerHTML =
      '<div class="ss-item"><div class="t">本月' + (type === 'income' ? '收入' : '支出') + '</div><div class="v">' + fmtMoney(curTotal) + '</div></div>' +
      '<div class="ss-item"><div class="t">日均</div><div class="v">' + fmtMoney(avg) + '</div></div>' +
      '<div class="ss-item"><div class="t">笔均 · ' + curList.length + ' 笔</div><div class="v">' + fmtMoney(per) + '</div></div>';
    renderCalendar();
    renderWeekReport();
    /* 近6个月趋势 */
    var trend = [];
    var ym = state.month;
    for (var i = 5; i >= 0; i--) {
      var y = ym.y, m = ym.m - i;
      while (m <= 0) { m += 12; y--; }
      var mm = { y: y, m: m };
      trend.push({ label: m + '月', val: sumOf(billsInMonth(mm), type) });
    }
    renderTrend(trend, type);
    renderDailyChart();
    renderCatChart(type);
    renderRank(type);
  }

  /* ---------- 收支日历 ---------- */
  var calMonth = null;   // 日历当前显示月份 {y, m}
  var calSelected = null; // 选中的日期 'YYYY-MM-DD'
  function renderCalendar() {
    if (!calMonth) calMonth = { y: state.month.y, m: state.month.m };
    var ym = calMonth;
    $('cal-title').textContent = ym.y + '年' + ym.m + '月';
    var firstDow = new Date(ym.y, ym.m - 1, 1).getDay();
    var dim = daysInMonth(ym.y, ym.m);
    var prevDim = daysInMonth(ym.y, ym.m === 1 ? 12 : ym.m - 1);
    var todayStr2 = todayStr();
    /* 每日汇总 */
    var dayMap = {};
    state.bills.forEach(function (b) {
      if (b.date.slice(0, 7) !== monthStr(ym)) return;
      if (!dayMap[b.date]) dayMap[b.date] = { e: 0, i: 0 };
      if (b.type === 'expense') dayMap[b.date].e += b.amount;
      else dayMap[b.date].i += b.amount;
    });
    var html = '';
    ['日', '一', '二', '三', '四', '五', '六'].forEach(function (w) {
      html += '<div class="cal-dow">' + w + '</div>';
    });
    var dateObj;
    for (var cell = 0; cell < 42; cell++) {
      var dayNum, cls = 'cal-cell', key;
      if (cell < firstDow) {
        dayNum = prevDim - firstDow + 1 + cell;
        cls += ' other';
        dateObj = new Date(ym.y, ym.m - 2, dayNum);
      } else if (cell >= firstDow + dim) {
        dayNum = cell - firstDow - dim + 1;
        cls += ' other';
        dateObj = new Date(ym.y, ym.m, dayNum);
      } else {
        dayNum = cell - firstDow + 1;
        dateObj = new Date(ym.y, ym.m - 1, dayNum);
      }
      key = dateObj.getFullYear() + '-' + pad(dateObj.getMonth() + 1) + '-' + pad(dayNum);
      var d = dayMap[key];
      if (d) cls += ' has-bill';
      if (key === todayStr2) cls += ' today';
      if (key === calSelected) cls += ' sel';
      html += '<div class="' + cls + '" data-date="' + key + '">' +
        '<div class="c-d">' + dayNum + '</div>' +
        (d && d.e > 0 ? '<div class="c-e">-' + fmtMoney(d.e) + '</div>' : '') +
        (d && d.i > 0 ? '<div class="c-i">+' + fmtMoney(d.i) + '</div>' : '') +
        '</div>';
    }
    $('cal-grid').innerHTML = html;
    renderCalDayDetail();
  }
  function renderCalDayDetail() {
    var box = $('cal-day-detail');
    if (!calSelected) { box.innerHTML = ''; return; }
    var list = state.bills.filter(function (b) { return b.date === calSelected; });
    if (!list.length) {
      box.innerHTML = '<div class="cd-title">' + calSelected + ' · 无账单</div>';
      return;
    }
    var e = sumOf(list, 'expense'), i = sumOf(list, 'income');
    var html = '<div class="cd-title">' + calSelected + ' · 支 ' + fmtMoney(e) + (i > 0 ? ' · 收 ' + fmtMoney(i) : '') + '</div>';
    list.forEach(function (b) {
      var c = getCat(b.cat) || { icon: '🧾', name: '未分类' };
      html += '<div class="bill-item" style="padding:7px 4px" data-id="' + b.id + '">' +
        '<div class="b-ico" style="--bc:' + hexA(c.color, 0.12) + '">' + c.icon + '</div>' +
        '<div class="b-info"><div class="n">' + esc(b.remark || c.name) + '</div><div class="d">' + esc(c.name) + '</div></div>' +
        '<div class="b-amt ' + (b.type === 'income' ? 'inc' : 'exp') + '">' + fmtMoney(b.amount) + '</div></div>';
    });
    box.innerHTML = html;
  }

  /* ---------- 本周消费报告 ---------- */
  function weekRange(d) {
    var day = d.getDay(); /* 0=周日 */
    var diff = day === 0 ? -6 : 1 - day; /* 周一到今天 */
    var start = new Date(d);
    start.setDate(d.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  function renderWeekReport() {
    var box = $('week-report');
    if (!box) return;
    var now = new Date();
    var wkStart = weekRange(now);
    var wkEnd = new Date(wkStart);
    wkEnd.setDate(wkEnd.getDate() + 7);
    function inRange(b) {
      var t = new Date(b.date + 'T00:00:00');
      return t >= wkStart && t < wkEnd;
    }
    var weekBills = state.bills.filter(function (b) { return b.type === 'expense' && inRange(b); });
    var weekExp = weekBills.reduce(function (s, b) { return s + b.amount; }, 0);
    var daysInWeek = Math.min(7, Math.max(1, Math.floor((now - wkStart) / 86400000) + 1));
    var dailyAvg = weekExp / daysInWeek;
    var topCat = null, topAmt = 0;
    var byCat = {};
    weekBills.forEach(function (b) { byCat[b.cat] = (byCat[b.cat] || 0) + b.amount; });
    Object.keys(byCat).forEach(function (id) {
      if (byCat[id] > topAmt) { topAmt = byCat[id]; topCat = id; }
    });
    var topC = topCat ? (getCat(topCat) || { icon: '🧾', name: '未分类' }) : null;
    /* 上周对比 */
    var lastStart = new Date(wkStart);
    lastStart.setDate(lastStart.getDate() - 7);
    var lastEnd = new Date(wkStart);
    function inLastRange(b) {
      var t = new Date(b.date + 'T00:00:00');
      return t >= lastStart && t < lastEnd;
    }
    var lastExp = state.bills.filter(function (b) { return b.type === 'expense' && inLastRange(b); })
      .reduce(function (s, b) { return s + b.amount; }, 0);
    var delta = lastExp > 0 ? Math.round((weekExp - lastExp) / lastExp * 100) : (weekExp > 0 ? 100 : 0);
    var deltaCls = delta > 5 ? 'up' : (delta < -5 ? 'down' : 'flat');
    var deltaTxt = delta > 5 ? ('↑ ' + delta + '%') : (delta < -5 ? ('↓ ' + (-delta) + '%') : '持平');
    box.innerHTML = '<div class="week-report">' +
      '<div class="wr-item"><div class="t">本周支出</div><div class="v">¥' + fmtMoney(weekExp) + '</div><div class="s ' + deltaCls + '">较上周 ' + deltaTxt + '</div></div>' +
      '<div class="wr-item"><div class="t">日均支出</div><div class="v">¥' + fmtMoney(dailyAvg) + '</div><div class="s flat">' + weekBills.length + ' 笔</div></div>' +
      '<div class="wr-item"><div class="t">最大开销</div><div class="v" style="font-size:.78rem">' + (topC ? topC.icon + ' ' + topC.name : '—') + '</div><div class="s flat">' + (topC ? '¥' + fmtMoney(topAmt) : '本周无支出') + '</div></div>' +
      '</div>';
  }

  function renderRank(type) {
    var list = billsInMonth(state.month).filter(function (b) { return b.type === type; });
    var byCat = {};
    list.forEach(function (b) {
      byCat[b.cat] = (byCat[b.cat] || 0) + b.amount;
    });
    var arr = Object.keys(byCat).map(function (id) { return { id: id, val: byCat[id] }; });
    arr.sort(function (a, b) { return b.val - a.val; });
    var total = arr.reduce(function (s, a) { return s + a.val; }, 0);
    var html = '';
    if (!arr.length) { $('rank-list').innerHTML = '<div class="empty" style="padding:16px">暂无数据</div>'; return; }
    arr.slice(0, 6).forEach(function (a) {
      var c = getCat(a.id) || { icon: '🧾', name: '未分类', color: '#8E8E93' };
      var pct = total ? Math.round(a.val / total * 100) : 0;
      html += '<div class="rank-item">' +
        '<div class="r-ico" style="--bc:' + hexA(c.color, 0.12) + '">' + c.icon + '</div>' +
        '<div class="r-info"><div class="n">' + c.name + ' <span class="p">' + pct + '%</span></div>' +
        '<div class="r-bar"><i style="--bc:' + c.color + ';width:' + pct + '%"></i></div></div>' +
        '<div class="r-amt">' + fmtMoney(a.val) + '</div></div>';
    });
    $('rank-list').innerHTML = html;
  }

  /* ---------- 渲染：自动记账页 ---------- */
  function renderAuto() {
    /* 周期记账 */
    var rhtml = '';
    if (!state.recurring.length) {
      rhtml = '<div class="empty" style="padding:20px"><span class="e-ico">🔁</span>暂无周期账单</div>';
    } else {
      state.recurring.forEach(function (r) {
        var c = getCat(r.cat) || { icon: '🧾', color: '#8E8E93' };
        rhtml += '<div class="rec-item" data-rid="' + r.id + '">' +
          '<div class="r-ico" style="--bc:' + hexA(c.color, 0.12) + '">' + c.icon + '</div>' +
          '<div class="r-info"><div class="n">' + esc(r.name) + '</div>' +
          '<div class="d">每月 ' + r.day + ' 日 · ' + esc(c.name) + '</div></div>' +
          '<div class="r-amt ' + (r.type === 'income' ? 'inc' : 'exp') + '">' + (r.type === 'income' ? '+' : '−') + fmtMoney(r.amount) + '</div>' +
          '<button class="r-del" data-rdel="' + r.id + '">✕</button></div>';
      });
    }
    $('recurring-list').innerHTML = rhtml;

    /* 规则 */
    var rules = state.rules;
    var html = '';
    if (!rules.length) {
      html = '<div class="empty" style="padding:20px"><span class="e-ico">📝</span>暂无自定义规则</div>';
    } else {
      rules.forEach(function (r, idx) {
        var c = getCat(r.cat) || { name: '未知分类', color: '#8E8E93' };
        var kws = String(r.kw).split(/\s+/).filter(Boolean);
        html += '<div class="rule-item">' +
          '<div class="k">' + esc(kws.join(' / ')) + (r.builtin ? '<small>内置规则</small>' : '<small>自定义</small>') + '</div>' +
          '<span class="cat-tag" style="--bc:' + hexA(c.color, 0.12) + '">' + c.icon + ' ' + c.name + '</span>' +
          (r.builtin ? '' : '<button class="r-del" data-ruledel="' + idx + '">✕</button>') +
          '</div>';
      });
    }
    $('rule-list').innerHTML = html;
  }

  /* ---------- 记账弹层 ---------- */
  var addType = 'expense', addCat = null;

  function renderSheetCats() {
    var cs = catsOf(addType);
    if (!cs.some(function (c) { return c.id === addCat; })) addCat = cs[0] ? cs[0].id : null;
    var html = '';
    cs.forEach(function (c) {
      html += '<div class="cat-cell' + (c.id === addCat ? ' sel' : '') + '" data-cat="' + c.id + '">' +
        '<div class="c-ico" style="--bc:' + hexA(c.color, 0.12) + '">' + c.icon + '</div>' +
        '<div class="c-name">' + c.name + '</div></div>';
    });
    $('sheet-cats').innerHTML = html;
  }

  function openSheetAdd(prefill) {
    state.editingId = null;
    addType = 'expense';
    addCat = defaultCat('expense').id;
    $('sheet-title').textContent = '记一笔';
    $('in-amount').value = '';
    $('in-remark').value = '';
    $('in-date').value = todayStr();
    var pr = $('parse-result');
    pr.className = 'parse-result';
    pr.style.display = 'none';
    pr.innerHTML = '';
    document.querySelectorAll('#sheet-add .type-switch button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-t') === 'expense');
    });
    renderSheetCats();
    if (prefill) {
      if (prefill.amount) $('in-amount').value = fmtMoney(prefill.amount);
      if (prefill.remark) $('in-remark').value = prefill.remark;
      if (prefill.date) $('in-date').value = prefill.date;
      if (prefill.type) setAddType(prefill.type);
      if (prefill.cat) { addCat = prefill.cat; renderSheetCats(); }
      if (prefill.autoNote) {
        var p = $('parse-result');
        p.className = 'parse-result';
        p.style.display = 'block';
        p.innerHTML = '⚡ 自动识别：' + prefill.autoNote;
      }
    }
    showSheet('sheet-add');
    setTimeout(function () { $('in-amount').focus(); }, 350);

    /* 打开记一笔时自动检测剪贴板（无预填时静默填充） */
    if (!prefill && navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (t) {
        if (!t || !t.trim()) return;
        if ($('in-amount').value && parseFloat($('in-amount').value) > 0) return;
        var res = parseNotify(t);
        if (res && res.amount !== null) {
          autoFillSheet(res, true);
          var p = $('parse-result');
          p.className = 'parse-result';
          p.style.display = 'block';
          p.innerHTML = '⚡ 已自动识别剪贴板中的账单，确认后保存';
        }
      }).catch(function () {});
    }
  }

  function setAddType(t) {
    addType = t;
    document.querySelectorAll('#sheet-add .type-switch button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-t') === t);
    });
    renderSheetCats();
  }

  /* ---------- 分类管理弹层 ---------- */
  var catEditType = 'expense', catEditing = null;

  function renderCatManage() {
    var cs = catsOf(catEditType);
    var html = '';
    cs.forEach(function (c) {
      html += '<div class="cat-cell' + (c.id === catEditing ? ' sel' : '') + '" data-cat="' + c.id + '">' +
        '<div class="c-ico" style="--bc:' + hexA(c.color, 0.12) + '">' + c.icon + '</div>' +
        '<div class="c-name">' + c.name + '</div></div>';
    });
    html += '<div class="cat-cell add" id="cat-add-cell"><div class="c-ico">＋</div><div class="c-name">新增</div></div>';
    $('cat-manage-grid').innerHTML = html;

    if (catEditing) {
      var c = getCat(catEditing);
      $('cat-name').value = c.name;
      renderPalettes(c.icon, c.color);
      $('btn-cat-delete').style.display = 'block';
    } else {
      $('cat-name').value = '';
      renderPalettes(EMOJIS[0], PALETTE[0]);
      $('btn-cat-delete').style.display = 'none';
    }
  }

  function renderPalettes(selEmoji, selColor) {
    var eh = '';
    EMOJIS.forEach(function (e) {
      eh += '<button class="' + (e === selEmoji ? 'on' : '') + '" data-e="' + e + '">' + e + '</button>';
    });
    $('emoji-pal').innerHTML = eh;
    var ch = '';
    PALETTE.forEach(function (p) {
      ch += '<button class="' + (p === selColor ? 'on' : '') + '" data-c="' + p + '" style="background:' + p + '"></button>';
    });
    $('color-pal').innerHTML = ch;
  }

  /* ---------- 周期记账弹层 ---------- */
  var recType = 'expense', recCat = null;

  function renderRecCats() {
    var cs = catsOf(recType);
    if (!cs.some(function (c) { return c.id === recCat; })) recCat = cs[0] ? cs[0].id : null;
    var html = '';
    cs.forEach(function (c) {
      html += '<div class="cat-cell' + (c.id === recCat ? ' sel' : '') + '" data-cat="' + c.id + '">' +
        '<div class="c-ico" style="--bc:' + hexA(c.color, 0.12) + '">' + c.icon + '</div>' +
        '<div class="c-name">' + c.name + '</div></div>';
    });
    $('rec-cats').innerHTML = html;
  }

  /* ---------- 规则弹层 ---------- */
  function renderRuleCatSelect() {
    var all = state.cats.filter(function (c) { return c.type === 'expense'; })
      .concat(state.cats.filter(function (c) { return c.type === 'income'; }));
    var html = '';
    all.forEach(function (c) {
      html += '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>';
    });
    $('rule-cat').innerHTML = html;
  }

  /* ---------- 弹层通用 ---------- */
  var openSheets = {};
  function showSheet(name) {
    openSheets[name] = true;
    var mask = $(name + '-mask');
    var sheet = $(name);
    if (mask) mask.classList.add('show');
    if (sheet) sheet.classList.add('show');
  }
  function hideSheet(name) {
    openSheets[name] = false;
    var mask = $(name + '-mask');
    var sheet = $(name);
    if (mask) mask.classList.remove('show');
    if (sheet) sheet.classList.remove('show');
  }
  function hideAllSheets() {
    ['sheet-add', 'sheet-smart', 'sheet-cat', 'sheet-rec', 'sheet-rule', 'sheet-all', 'sheet-help'].forEach(hideSheet);
  }

  /* ---------- 数据导入导出 ---------- */
  function exportJSON() {
    var data = { app: 'lightbook', version: 1, exportedAt: new Date().toISOString(),
      cats: state.cats, rules: state.rules, bills: state.bills, recurring: state.recurring };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '轻记账备份_' + todayStr() + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('JSON 备份已导出');
  }
  function exportCSV() {
    var rows = [['日期', '类型', '分类', '金额', '备注', '来源']];
    state.bills.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (b) {
      var c = getCat(b.cat) || { name: '未分类' };
      rows.push([b.date, b.type === 'income' ? '收入' : '支出', c.name, b.amount, b.remark || '', b.source]);
    });
    var csv = '\ufeff' + rows.map(function (r) {
      return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '轻记账账单_' + todayStr() + '.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('CSV 已导出');
  }

  /* ---------- 示例数据 ---------- */
  function loadDemo() {
    var now = curMonth();
    var y = now.y, m = now.m;
    var dstr = function (dd) { return y + '-' + pad(m) + '-' + pad(dd); };
    var todayD = new Date().getDate();
    var demo = [
      { type: 'expense', amount: 25.5, cat: 'c1', remark: '美团外卖', date: dstr(Math.max(1, todayD)), source: 'auto' },
      { type: 'expense', amount: 18, cat: 'c1', remark: '瑞幸咖啡', date: dstr(Math.max(1, todayD - 1)), source: 'auto' },
      { type: 'expense', amount: 320, cat: 'c3', remark: '京东商城 日用品', date: dstr(Math.max(1, todayD - 1)), source: 'auto' },
      { type: 'expense', amount: 12.8, cat: 'c2', remark: '滴滴出行', date: dstr(Math.max(1, todayD - 2)), source: 'auto' },
      { type: 'expense', amount: 120, cat: 'c4', remark: '电费', date: dstr(Math.max(1, todayD - 3)), source: 'auto' },
      { type: 'expense', amount: 68, cat: 'c5', remark: '视频会员', date: dstr(Math.max(1, todayD - 3)), source: 'auto' },
      { type: 'income', amount: 12000, cat: 'i1', remark: '8月工资', date: dstr(10), source: 'recurring' },
      { type: 'income', amount: 850, cat: 'i4', remark: '设计兼职', date: dstr(Math.max(1, todayD - 5)), source: 'manual' },
      { type: 'expense', amount: 45, cat: 'c1', remark: '海底捞', date: dstr(Math.max(1, todayD - 6)), source: 'auto' },
      { type: 'expense', amount: 200, cat: 'c8', remark: '朋友生日礼金', date: dstr(Math.max(1, todayD - 7)), source: 'manual' },
      { type: 'expense', amount: 3000, cat: 'c4', remark: '房租', date: dstr(1), source: 'recurring', recurringId: 'rdemo1' },
      { type: 'expense', amount: 88, cat: 'c6', remark: '药店买药', date: dstr(Math.max(1, todayD - 8)), source: 'auto' },
      { type: 'expense', amount: 52, cat: 'c9', remark: '话费充值', date: dstr(Math.max(1, todayD - 4)), source: 'auto' },
      { type: 'expense', amount: 39.9, cat: 'c7', remark: '购书《经济学原理》', date: dstr(Math.max(1, todayD - 9)), source: 'auto' }
    ];
    demo.forEach(function (d) { state.bills.push({ id: uid(), cat: d.cat, remark: d.remark, date: d.date, amount: d.amount, type: d.type, source: d.source, recurringId: d.recurringId }); });
    /* 上月几笔 */
    var pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y;
    var pd = function (dd) { return py + '-' + pad(pm) + '-' + pad(dd); };
    state.bills.push(
      { id: uid(), type: 'income', amount: 12000, cat: 'i1', remark: '7月工资', date: pd(10), source: 'recurring' },
      { id: uid(), type: 'expense', amount: 3000, cat: 'c4', remark: '房租', date: pd(1), source: 'recurring' },
      { id: uid(), type: 'expense', amount: 1560, cat: 'c3', remark: '淘宝 夏季衣物', date: pd(15), source: 'auto' },
      { id: uid(), type: 'expense', amount: 480, cat: 'c5', remark: '电影 + KTV', date: pd(20), source: 'manual' },
      { id: uid(), type: 'expense', amount: 220, cat: 'c2', remark: '地铁月卡 + 打车', date: pd(22), source: 'auto' }
    );
    save();
    toast('示例数据已载入');
  }


  function recentRepeats() {
    var seen = {};
    var out = [];
    for (var i = state.bills.length - 1; i >= 0 && out.length < 6; i--) {
      var b = state.bills[i];
      if (!b || !(Number(b.amount) > 0)) continue;
      var key = [b.type, b.cat, b.remark || '', b.amount].join('|');
      if (seen[key]) continue;
      seen[key] = true;
      out.push(b);
    }
    return out;
  }

  function renderRepeatRow() {
    var row = $('repeat-row');
    if (!row) return;
    var items = recentRepeats();
    row._items = items;
    if (!items.length) {
      row.innerHTML = '<button class="repeat-chip" type="button" data-demo="1">＋ 先记一笔，之后点这里再记</button>';
      return;
    }
    row.innerHTML = items.map(function (b, i) {
      var c = getCat(b.cat) || { icon: '🧾', name: '未分类' };
      var label = b.remark || c.name;
      return '<button class="repeat-chip' + (b.type === 'income' ? ' inc' : '') + '" type="button" data-i="' + i + '">' +
        '<span>' + c.icon + '</span><b>' + esc(label) + '</b><em>' + (b.type === 'income' ? '+' : '') + fmtMoney(b.amount) + '</em></button>';
    }).join('');
  }

  function offerUndo(bill) {
    if (!bill) return;
    var card = $('detect-card');
    if (!card) { toast('已入账 ¥' + fmtMoney(bill.amount)); return; }
    var cat = getCat(bill.cat) || { name: '未分类', icon: '🧾' };
    card.className = 'detect-card show';
    card.innerHTML =
      '<div class="dc-row"><div class="dc-info">' +
        '<div class="dc-amt">已记入 ¥' + fmtMoney(bill.amount) + '</div>' +
        '<div class="dc-detail">' + esc(bill.remark || cat.name) + ' · ' + cat.name + ' · 今天</div>' +
      '</div><div class="dc-actions"><button class="dc-btn no" id="btn-undo" type="button">撤销</button></div></div>';
    card.querySelector('#btn-undo').addEventListener('click', function () {
      state.bills = state.bills.filter(function (item) { return item.id !== bill.id; });
      save();
      renderHome();
      card.className = 'detect-card';
      card.innerHTML = '';
      toast('已撤销刚才那笔');
    });
  }

  function quickRepeatBill(b) {
    var cat = b.cat || autoClassify(b.remark, b.type) || (defaultCat(b.type) || {}).id;
    var bill = {
      id: uid(),
      key: makeBillKey({ type: b.type, amount: b.amount, date: todayStr(), remark: b.remark }) + '|' + Date.now().toString(36),
      type: b.type,
      amount: Math.round(Number(b.amount) * 100) / 100,
      cat: cat,
      remark: b.remark || '再记一笔',
      date: todayStr(),
      source: 'repeat'
    };
    state.bills.push(bill);
    save();
    renderHome();
    checkBudgetWarn();
    offerUndo(bill);
  }

  function appPageUrl() {
    if (location.protocol === 'file:') return 'https://lhh1654274878-create.github.io/lightbook/light-book.html';
    var path = location.pathname || '/';
    if (/index\.html$/.test(path)) path = path.replace(/index\.html$/, 'light-book.html');
    else if (!/light-book\.html$/.test(path)) path = path.replace(/\/$/, '') + '/light-book.html';
    return location.origin + path;
  }

  function showShortcutHelp() {
    var card = $('detect-card');
    var prefix = appPageUrl() + '?auto=1&add=';
    card.className = 'detect-card show';
    card.innerHTML =
      '<div class="dc-detail" style="white-space:normal;line-height:1.55">从支付宝或微信通知点分享，即可自动识别金额并分类入账。只需设置一次：</div>' +
      '<div class="dc-detail" style="white-space:normal;line-height:1.7;margin-top:6px">1. 打开「快捷指令」→ 新建，打开「在共享表单中显示」<br>2. 添加操作「打开 URL」<br>3. 网址填下面这段，末尾接上变量「快捷指令输入」。中文会被自动编码</div>' +
      '<textarea class="dc-input" id="shortcut-url" rows="2" readonly></textarea>' +
      '<div class="dc-batch-actions">' +
        '<button class="dc-btn no" id="shortcut-copy" type="button">复制网址</button>' +
        '<button class="dc-btn ok" id="shortcut-test" type="button">用示例试一次</button>' +
      '</div>';
    card.querySelector('#shortcut-url').value = prefix;
    card.querySelector('#shortcut-copy').addEventListener('click', function () {
      var text = prefix;
      var done = function () { toast('已复制，粘贴到快捷指令的打开 URL'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          card.querySelector('#shortcut-url').focus();
          toast('请长按网址手动复制');
        });
      } else {
        card.querySelector('#shortcut-url').focus();
        toast('请长按网址手动复制');
      }
    });
    card.querySelector('#shortcut-test').addEventListener('click', function () {
      bookFromText('美团外卖25元', true);
    });
  }

  function bookFromText(text, autoSave) {
    var res = parseVoice(text) || parseNotify(text);
    if (!res || res.amount === null) {
      toast('没识别出金额，请换一种说法');
      openSheetAdd({ remark: String(text || '').slice(0, 30) });
      return null;
    }
    if (!autoSave) {
      showDetectSingle(res);
      return res;
    }
    if (findDuplicateBill(res)) {
      toast('这笔已经记过，未重复入账');
      return null;
    }
    var saved = saveParsedBill(res, 'shortcut');
    if (saved) offerUndo(saved);
    return saved;
  }

  /* ============================================================
     自动检测：剪贴板识别 / 语音记账 / 粘贴即识别
     ============================================================ */

  /* 解析文本并填充记账弹层表单 */
  function autoFillSheet(res, silent) {
    if (!res) return;
    setAddType(res.type);
    if (res.amount !== null) $('in-amount').value = fmtMoney(res.amount);
    if (res.remark) $('in-remark').value = res.remark;
    if (res.date) $('in-date').value = res.date;
    var cat = autoClassify(res.remark, res.type);
    if (cat) { addCat = cat; renderSheetCats(); }
    if (!silent) {
      var p = $('parse-result');
      p.className = 'parse-result';
      p.style.display = 'block';
      var catName = cat && getCat(cat) ? getCat(cat).name : '未匹配';
      p.innerHTML = '⚡ 自动识别：¥' + fmtMoney(res.amount) + ' · ' + esc(res.remark || '未知商户') + ' · 分类「' + catName + '」';
    }
  }

  /* 渲染首页检测卡 */
  /* 待入账暂存列表（支持连续语音多句） */
  var detectPending = [];

  function renderDetect(text) {
    var card = $('detect-card');
    if (!text || !String(text).trim()) {
      card.className = 'detect-card show dc-empty';
      card.innerHTML = '<div class="dc-detail">📋 未检测到账单文本，请先复制支付通知</div>';
      return;
    }
    var res = parseNotify(String(text));
    if (!res || res.amount === null) {
      card.className = 'detect-card show dc-empty';
      card.innerHTML = '<div class="dc-detail">⚠️ 未能识别出有效金额，请检查文本格式</div>';
      return;
    }
    /* 单条识别：直接显示确认卡片 */
    if (!voiceListening) {
      showDetectSingle(res);
      return;
    }
    /* 连续语音：累积到批量列表 */
    detectPending.push(res);
    renderDetectBatch();
  }

  function showDetectSingle(res) {
    var card = $('detect-card');
    var cat = autoClassify(res.remark, res.type);
    var c = getCat(cat) || defaultCat(res.type) || { name: '未分类', color: '#8E8E93', icon: '🧾' };
    card.className = 'detect-card show';
    card.innerHTML =
      '<div class="dc-row">' +
        '<div style="font-size:1.4rem">' + c.icon + '</div>' +
        '<div class="dc-info">' +
          '<div class="dc-amt ' + (res.type === 'income' ? 'inc' : '') + '">' + (res.type === 'income' ? '+' : '−') + '¥' + fmtMoney(res.amount) + '</div>' +
          '<div class="dc-detail">' + esc(res.remark || '未知商户') + ' · ' + c.name + ' · ' + res.date + '</div>' +
        '</div>' +
        '<div class="dc-actions">' +
          '<button class="dc-btn no">忽略</button>' +
          '<button class="dc-btn ok">一键入账</button>' +
        '</div>' +
      '</div>';
    card.querySelector('.dc-btn.ok').addEventListener('click', function () {
      var isNew = !findDuplicateBill(res);
      var saved = saveParsedBill(Object.assign({}, res, { cat: cat }), 'auto');
      card.className = 'detect-card';
      card.innerHTML = '';
      if (isNew && saved) toast('已自动入账并分类 ✓');
      else toast('该账单似乎已记录，已防止重复入账');
    });
    card.querySelector('.dc-btn.no').addEventListener('click', function () {
      card.className = 'detect-card';
      card.innerHTML = '';
    });
  }

  /* 连续语音批量列表 */
  function renderDetectBatch() {
    var card = $('detect-card');
    if (!detectPending.length) {
      card.className = 'detect-card';
      card.innerHTML = '';
      return;
    }
    card.className = 'detect-card show';
    var html = '<div class="dc-batch">';
    var totalExp = 0, totalInc = 0;
    detectPending.forEach(function (r, idx) {
      var c2 = getCat(autoClassify(r.remark, r.type)) || defaultCat(r.type) || { name: '未分类', color: '#8E8E93', icon: '🧾' };
      if (r.type === 'expense') totalExp += r.amount; else totalInc += r.amount;
      html += '<div class="dc-batch-item" data-idx="' + idx + '">' +
        '<span>' + c2.icon + '</span>' +
        '<span class="bi-amt ' + (r.type === 'income' ? 'inc' : '') + '">' + (r.type === 'income' ? '+' : '−') + '¥' + fmtMoney(r.amount) + '</span>' +
        '<span class="bi-info">' + esc(r.remark || '未知商户') + ' · ' + c2.name + '</span>' +
        '<button class="bi-x" data-rm="' + idx + '">✕</button>' +
      '</div>';
    });
    html += '</div>';
    html += '<div class="dc-batch-actions">' +
      '<button class="dc-btn no" id="dc-batch-clear">清空</button>' +
      '<button class="dc-btn ok" id="dc-batch-save">全部入账 ' +
        (totalExp > 0 ? '−¥' + fmtMoney(totalExp) : '') + (totalInc > 0 ? ' +¥' + fmtMoney(totalInc) : '') + '</button>' +
      '</div>';
    html += '<div class="dc-batch-tip">已连续识别 ' + detectPending.length + ' 条，可逐条移除或一键全部入账</div>';
    card.innerHTML = html;
    card.querySelector('#dc-batch-save').addEventListener('click', function () {
      var added = 0;
      detectPending.forEach(function (r) {
        if (!findDuplicateBill(r)) {
          saveParsedBill(r, 'auto');
          added++;
        }
      });
      var duplicates = detectPending.length - added;
      detectPending = [];
      card.className = 'detect-card';
      card.innerHTML = '';
      renderHome();
      checkBudgetWarn();
      if (added > 0) toast('已入账 ' + added + ' 笔 ✓' + (duplicates > 0 ? '，跳过 ' + duplicates + ' 笔重复' : ''));
      else toast('该账单似乎已记录，已防止重复入账');
    });
    card.querySelector('#dc-batch-clear').addEventListener('click', function () {
      detectPending = [];
      card.className = 'detect-card';
      card.innerHTML = '';
    });
    /* 逐条移除 */
    var rmBtns = card.querySelectorAll('.bi-x');
    for (var i = 0; i < rmBtns.length; i++) {
      rmBtns[i].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-rm'), 10);
        detectPending.splice(idx, 1);
        renderDetectBatch();
      });
    }
  }

  /* 剪贴板不可用时降级：引导粘贴到输入框 */
  function focusClipPaste(hint) {
    var card = $('detect-card');
    card.className = 'detect-card show dc-empty';
    card.innerHTML =
      '<div class="dc-detail">' + (hint || '当前环境无法直接读取剪贴板。请先复制账单文本，再长按下方输入框选择「粘贴」，将自动识别 👇') + '</div>' +
      '<textarea class="dc-input" id="dc-input" rows="4" autocomplete="off"></textarea>';
    var inp = card.querySelector('#dc-input');
    inp.addEventListener('paste', function () { setTimeout(function () { renderDetect(inp.value); }, 80); });
    inp.addEventListener('input', function () { if (inp.value.trim()) renderDetect(inp.value); });
    setTimeout(function () { inp.focus(); }, 120);
  }

  /* 检测剪贴板（需要 HTTPS 或 localhost；否则降级为粘贴引导） */
  function detectClipboard() {
    if (!(navigator.clipboard && navigator.clipboard.readText)) {
      focusClipPaste();
      return;
    }
    navigator.clipboard.readText().then(function (text) {
      if (text && String(text).trim()) { renderDetect(text); return; }
      focusClipPaste('剪贴板为空。请先复制账单文本，或直接粘贴到下方 👇');
    }).catch(function () {
      focusClipPaste('iOS 未授权读取剪贴板。可直接粘贴到下方，识别结果一致 👇');
    });
  }

  /* ============================================================
     消费即自动记账：剪贴板后台轮询
     开启后每 4 秒检查一次剪贴板，发现新支付通知自动解析并记录
     特点：
     1. 零操作：复制支付通知 → 自动入账（免去手动点按钮）
     2. 去重：同一通知只记一次（记录最近处理过的文本指纹）
     3. 静默模式：不打断当前操作，入账后 Toast 轻提示
     ============================================================ */
  var autoTimer = null;
  var lastClipText = '';
  var processedFingerprints = {}; /* 文本指纹 → 时间戳，防止重复记账 */

  function clipFingerprint(text) {
    var s = String(text || '').replace(/\s+/g, '').slice(0, 80);
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return h.toString(16) + '_' + s.length;
  }

  function autoOnChanged() {
    save();
    renderAutoToggle();
  }

  function startAutoDetect() {
    if (autoTimer) return;
    autoTimer = setInterval(function () {
      if (!state.autoOn) return;
      if (!navigator.clipboard || !navigator.clipboard.readText) return;
      navigator.clipboard.readText().then(function (text) {
        if (!text || !String(text).trim()) return;
        if (text === lastClipText) return;
        lastClipText = text;
        var fp = clipFingerprint(text);
        var now = Date.now();
        /* 去重：60 分钟内相同文本只处理一次 */
        if (processedFingerprints[fp] && now - processedFingerprints[fp] < 3600000) return;
        processedFingerprints[fp] = now;
        var res = parseNotify(text);
        if (!res || res.amount === null) return; /* 非支付通知，忽略 */
        if (findDuplicateBill(res)) return;
        var saved = saveParsedBill(res, 'auto');
        if (!saved) return;
        toast((res.type === 'income' ? '自动记录收入' : '自动记录支出') + ' ¥' + fmtMoney(res.amount) + ' · ' + (getCat(saved.cat) || { name: '未分类' }).name);
      }).catch(function () { /* 权限未授予时静默 */ });
    }, 4000);
  }
  function stopAutoDetect() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }
  function syncAutoDetect() {
    if (state.autoOn) startAutoDetect();
    else stopAutoDetect();
  }
  function renderAutoToggle() {
    var el = $('auto-toggle');
    if (!el) return;
    el.classList.toggle('on', !!state.autoOn);
    el.querySelector('.at-txt').textContent = state.autoOn ? '自动记账已开启' : '自动记账已关闭';
    el.querySelector('.at-sub').textContent = state.autoOn ? '复制支付通知后自动入账' : '点击开启，消费即自动记账';
    el.querySelector('.at-sw').textContent = state.autoOn ? 'ON' : 'OFF';
  }

  /* 语音结果统一处理：口语解析优先，失败降级为通知解析 */
  function handleVoiceResult(text) {
    if (!text || !String(text).trim()) return;
    var t = String(text).trim();
    var res = parseVoice(t) || parseNotify(t);
    if (!res || res.amount === null) {
      /* 解析失败：打开记账弹层，把识别文本填入备注，引导手动补金额 */
      toast('未能自动识别金额，已填入备注');
      openSheetAdd({ remark: t.slice(0, 30), autoNote: '语音识别：' + t.slice(0, 30) });
      return;
    }
    /* 记账弹层已打开：直接填充当前表单 */
    if (openSheets['sheet-add']) {
      autoFillSheet(res, false);
      var cName = autoClassify(res.remark, res.type);
      toast('已识别：¥' + fmtMoney(res.amount) + (res.remark ? ' ' + res.remark : '') + (cName && getCat(cName) ? ' · ' + getCat(cName).name : ''));
      return;
    }
    /* 未打开：打开记账弹层并预填，用户确认后保存 */
    stopVoice();
    openSheetAdd({
      amount: res.amount,
      remark: res.remark || '',
      type: res.type,
      cat: autoClassify(res.remark, res.type) || undefined,
      autoNote: '语音识别：¥' + fmtMoney(res.amount) + (res.remark ? ' · ' + res.remark : '')
    });
  }

  /* 语音识别（持续聆听模式）
     特点：
     1. 识别结束自动重启，无需重复点击，可连续说多句
     2. interimResults 实时反馈（降低卡顿感）
     3. 每句结果独立回调，支持连续入账
     4. 页签切换 / 再次点击自动停止，避免残留进程 */
  var voiceRec = null;
  var voiceListening = false;
  var voiceBtn = null, voiceHint = null, voiceOnResult = null;
  var voiceRestartTimer = null;

  function speechSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  function voiceUI(recording) {
    if (voiceBtn) {
      voiceBtn.classList.toggle('listening', recording);
      voiceBtn.innerHTML = recording ? '⏺ 聆听中…' : '🎤 语音记账';
    }
    if (voiceHint) {
      if (recording) voiceHint.textContent = '🎙️ 请说出账单，如「美团外卖25元」「坐地铁4块」「收到工资5000」';
      else voiceHint.textContent = '试说：美团25元 · 坐地铁4块 · 收到工资5000 · 咖啡三十';
    }
  }
  function stopVoice() {
    voiceListening = false;
    if (voiceRestartTimer) { clearTimeout(voiceRestartTimer); voiceRestartTimer = null; }
    if (voiceRec) {
      try {
        voiceRec.onend = null;
        voiceRec.onresult = null;
        voiceRec.onerror = null;
        voiceRec.abort();
      } catch (e) {}
      voiceRec = null;
    }
    voiceUI(false);
  }
  function startVoice(onResult, hintEl, btnEl) {
    if (!speechSupported()) {
      toast('当前浏览器不支持语音识别，请用 Safari 并开启 HTTPS 访问');
      return;
    }
    /* 再次点击 = 停止 */
    if (voiceListening) { stopVoice(); toast('语音已停止'); return; }
    /* 停止上一次残留 */
    if (voiceRec) { try { voiceRec.abort(); } catch (e) {} voiceRec = null; }

    voiceOnResult = onResult;
    voiceBtn = btnEl || null;
    voiceHint = hintEl || null;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var rec = new SR();
    voiceRec = rec;
    voiceListening = true;
    rec.lang = 'zh-CN';
    rec.interimResults = true;    /* 实时反馈，降低卡顿感 */
    rec.maxAlternatives = 1;
    rec.continuous = true;        /* 连续识别，一句结束不断开 */
    voiceUI(true);

    var finalText = '';
    rec.onresult = function (e) {
      var interim = '', finals = [];
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var res = e.results[i];
        if (res.isFinal) {
          finals.push(res[0].transcript);
          finalText = '';
        } else {
          interim += res[0].transcript;
        }
      }
      /* 实时反馈（interim） */
      if (voiceHint && interim) voiceHint.textContent = '🎙️ ' + interim + '…';
      /* 每句最终结果独立回调 → 支持连续多句入账 */
      if (finals.length && voiceOnResult) {
        finals.forEach(function (t) {
          if (voiceHint) voiceHint.textContent = '识别到：「' + t + '」';
          voiceOnResult(t);
        });
      }
    };
    rec.onerror = function (e) {
      if (!voiceListening) return;
      if (e.error === 'not-allowed') {
        voiceListening = false;
        toast('请允许麦克风权限（设置 → Safari → 麦克风）');
        voiceUI(false);
      } else if (e.error === 'no-speech') {
        /* 无语音，静默等待下一轮 */
      } else if (e.error === 'aborted') {
        /* 主动停止，忽略 */
      } else {
        toast('语音识别错误：' + (e.error || '未知'));
      }
    };
    rec.onend = function () {
      /* 持续聆听：识别自然结束后自动重启（除非被主动停止） */
      if (voiceListening) {
        try {
          rec.start();
          if (voiceHint) voiceHint.textContent = '🎙️ 持续聆听中…';
        } catch (e) {
          voiceListening = false;
          voiceRec = null;
          voiceUI(false);
        }
      } else {
        voiceRec = null;
        voiceUI(false);
      }
    };
    try { rec.start(); } catch (e) { toast('语音识别启动失败'); }
  }
  /* 页签切换时自动停止语音，释放资源 */
  function stopVoiceOnTab() {
    if (voiceListening) stopVoice();
  }

  /* 粘贴即识别 */
  function bindPasteAuto(el) {
    el.addEventListener('paste', function () {
      setTimeout(function () {
        var res = parseNotify(el.value);
        if (res && res.amount !== null) autoFillSheet(res, false);
      }, 80);
    });
  }

  /* ============================================================
     事件绑定
     ============================================================ */
  function bindEvents() {
    /* Tab 切换 */
    document.querySelectorAll('.tabbar button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stopVoiceOnTab(); /* 切换页签时停止语音，释放麦克风 */
        document.querySelectorAll('.tabbar button').forEach(function (b) { b.classList.remove('on'); });
        document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('on');
        var page = $('page-' + btn.getAttribute('data-page'));
        page.classList.add('active');
        if (btn.getAttribute('data-page') === 'stats') renderStats();
        if (btn.getAttribute('data-page') === 'auto') renderAuto();
      });
    });

    /* 月份切换 */
    $('m-prev').addEventListener('click', function () {
      state.month.m--; if (state.month.m < 1) { state.month.m = 12; state.month.y--; }
      renderHome();
    });
    $('m-next').addEventListener('click', function () {
      state.month.m++; if (state.month.m > 12) { state.month.m = 1; state.month.y++; }
      renderHome();
    });

    /* FAB / 记一笔 */
    $('fab').addEventListener('click', function () { openSheetAdd(); });

    /* 快捷分类：单击打开记账（记住上次分类），长按快速记录 */
    var quickPressTimer = null;
    $('quick-grid').addEventListener('touchstart', function (e) {
      var el = e.target.closest('.quick-btn');
      if (!el || el.id === 'quick-more') return;
      quickPressTimer = setTimeout(function () {
        /* 长按：直接快速记录该分类 */
        var type = el.getAttribute('data-type');
        var cat = el.getAttribute('data-cat');
        var c = getCat(cat);
        openSheetAdd({ type: type, cat: cat, amount: '' });
        if (c) toast('快速记账：' + c.name + '，直接输金额保存');
      }, 600);
    });
    $('quick-grid').addEventListener('touchend', function () { if (quickPressTimer) { clearTimeout(quickPressTimer); quickPressTimer = null; } });
    $('quick-grid').addEventListener('click', function (e) {
      var el = e.target.closest('.quick-btn');
      if (!el) return;
      if (el.id === 'quick-more') { openSheetAdd(); return; }
      openSheetAdd({ type: el.getAttribute('data-type'), cat: el.getAttribute('data-cat') });
    });
    /* 快捷金额按钮 */
    $('amt-quick').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      $('in-amount').value = b.getAttribute('data-v');
      $('in-amount').focus();
    });

    /* 智能识别 */
    function openSmartSheet() {
      showSheet('sheet-smart');
      $('in-notify').value = '';
      var pb = $('parse-result-big');
      pb.className = 'parse-result';
      pb.style.display = 'none';
      pb.innerHTML = '';
      $('btn-parse-save').style.display = 'none';
    }
    $('smart-bar').addEventListener('click', openSmartSheet);
    $('smart-bar2').addEventListener('click', openSmartSheet);

    $('btn-smart-parse').addEventListener('click', function () {
      var t = $('in-remark').value;
      if (!t) { toast('请先输入备注或商户名'); return; }
      var res = parseNotify(t);
      if (res && res.amount !== null) {
        var c = autoClassify(res.remark, 'expense');
        var note = '识别到金额 ¥' + fmtMoney(res.amount) + (res.remark ? ' · ' + res.remark : '') + (c ? ' · 分类「' + getCat(c).name + '」' : '');
        if (res.type === 'income') { setAddType('income'); }
        if (c) { addCat = c; renderSheetCats(); }
        if (res.amount) $('in-amount').value = fmtMoney(res.amount);
        if (res.remark) $('in-remark').value = res.remark;
        if (res.date) $('in-date').value = res.date;
        var p = $('parse-result');
        p.className = 'parse-result';
        p.style.display = 'block';
        p.innerHTML = '⚡ ' + note;
        toast('已自动识别');
      } else {
        var pp = $('parse-result');
        pp.className = 'parse-result err';
        pp.style.display = 'block';
        pp.innerHTML = '未能识别出金额，请确认文本包含金额（如：美团 25 元）';
      }
    });

    /* 智能识别弹层 */
    $('btn-parse-go').addEventListener('click', function () {
      var t = $('in-notify').value.trim();
      if (!t) { toast('请粘贴账单文本'); return; }
      var res = parseNotify(t);
      var box = $('parse-result-big');
      if (!res || res.amount === null) {
        box.className = 'parse-result err';
        box.style.display = 'block';
        box.innerHTML = '⚠️ 未能识别有效金额，请检查文本格式';
        $('btn-parse-save').style.display = 'none';
        return;
      }
      var cat = autoClassify(res.remark, res.type);
      state.parsePending = { amount: res.amount, remark: res.remark || '智能识别账单', date: res.date, type: res.type, cat: cat };
      box.className = 'parse-result';
      box.style.display = 'block';
      box.innerHTML = '✅ 识别成功<br>' +
        '<b>金额：</b>¥' + fmtMoney(res.amount) +
        '　<b>方向：</b>' + (res.type === 'income' ? '收入' : '支出') +
        '<br><b>商户：</b>' + esc(res.remark || '未识别') +
        '<br><b>日期：</b>' + res.date +
        '<br><b>智能分类：</b>' + (cat && getCat(cat) ? getCat(cat).icon + ' ' + getCat(cat).name : '未匹配（保存后可在记账页调整）');
      $('btn-parse-save').style.display = 'block';
    });
    $('btn-parse-save').addEventListener('click', function () {
      var pending = state.parsePending;
      if (!pending) return;
      var isNew = !findDuplicateBill(pending);
      var saved = saveParsedBill(pending, 'parse');
      hideSheet('sheet-smart');
      state.parsePending = null;
      if (isNew && saved) toast('已自动入账并分类 ✓');
      else toast('该账单似乎已记录，已防止重复入账');
    });
    document.querySelectorAll('.parse-sample').forEach(function (s) {
      s.addEventListener('click', function () { $('in-notify').value = s.getAttribute('data-s'); });
    });

    /* 记账弹层内部 */
    document.querySelectorAll('#sheet-add .type-switch button').forEach(function (b) {
      b.addEventListener('click', function () { setAddType(b.getAttribute('data-t')); });
    });
    $('sheet-cats').addEventListener('click', function (e) {
      var cell = e.target.closest('.cat-cell');
      if (cell) { addCat = cell.getAttribute('data-cat'); renderSheetCats(); }
    });
    var onRemarkInput = debounce(function () {
      var t = $('in-remark').value.trim();
      if (!t) return;
      var c = autoClassify(t, addType);
      if (c && c !== addCat) {
        addCat = c;
        renderSheetCats();
      }
    }, 180);
    $('in-remark').addEventListener('input', onRemarkInput);
    $('btn-save').addEventListener('click', function () {
      var amt = parseFloat($('in-amount').value);
      if (isNaN(amt) || amt <= 0) { toast('请输入有效金额'); return; }
      var remark = $('in-remark').value.trim();
      var date = $('in-date').value || todayStr();
      var autoCat = remark ? (autoClassify(remark, addType) || null) : null;
      var cat = addCat || (autoClassify(remark, addType) || defaultCat(addType).id);
      /* 自学习：用户手动选择的分类与自动分类不同时，记录纠正 */
      if (remark && addCat && autoCat && addCat !== autoCat) {
        learnFromCorrection(remark, addCat);
      }
      if (state.editingId) {
        var b = state.bills.find(function (x) { return x.id === state.editingId; });
        if (b) { b.amount = amt; b.remark = remark; b.date = date; b.cat = cat; b.type = addType; b.key = makeBillKey(b); }
      } else {
        state.bills.push({ id: uid(), key: makeBillKey({ type: addType, amount: amt, date: date, remark: remark }), type: addType, amount: amt, cat: cat, remark: remark, date: date, source: 'manual' });
      }
      save();
      hideSheet('sheet-add');
      renderHome();
      checkBudgetWarn();
      toast(state.editingId ? '账单已更新' : '已记一笔 ✓');
    });

    /* 账单点击编辑 / 滑动删除（touch） */
    $('bill-area').addEventListener('click', function (e) {
      var del = e.target.closest('.b-del');
      if (del) {
        e.stopPropagation();
        var id = del.getAttribute('data-del');
        state.bills = state.bills.filter(function (b) { return b.id !== id; });
        save(); renderHome(); toast('已删除');
        return;
      }
      var item = e.target.closest('.bill-item');
      if (item) {
        var bid = item.getAttribute('data-id');
        var bill = state.bills.find(function (b) { return b.id === bid; });
        if (bill) {
          state.editingId = bill.id;
          addType = bill.type; addCat = bill.cat;
          $('sheet-title').textContent = '编辑账单';
          $('in-amount').value = fmtMoney(bill.amount);
          $('in-remark').value = bill.remark || '';
          $('in-date').value = bill.date;
          var pr2 = $('parse-result');
          pr2.className = 'parse-result';
          pr2.style.display = 'none';
          pr2.innerHTML = '';
          document.querySelectorAll('#sheet-add .type-switch button').forEach(function (bb) {
            bb.classList.toggle('on', bb.getAttribute('data-t') === bill.type);
          });
          renderSheetCats();
          showSheet('sheet-add');
        }
      }
    });
    /* 左滑删除 */
    var touchX = null;
    $('bill-area').addEventListener('touchstart', function (e) {
      var item = e.target.closest('.bill-item');
      if (!item) return;
      touchX = e.touches[0].clientX;
      item._swiping = false;
    }, { passive: true });
    $('bill-area').addEventListener('touchmove', function (e) {
      var item = e.target.closest('.bill-item');
      if (!item || touchX === null) return;
      var dx = e.touches[0].clientX - touchX;
      if (dx < -30) { item.classList.add('swiping'); item._swiping = true; }
      else if (dx > 10) { item.classList.remove('swiping'); }
    }, { passive: true });
    $('bill-area').addEventListener('touchend', function (e) {
      touchX = null;
      document.querySelectorAll('.bill-item.swiping').forEach(function (i) {
        setTimeout(function () { i.classList.remove('swiping'); }, 1600);
      });
    }, { passive: true });
    /* 全部账单页 */
    $('all-bill-list').addEventListener('click', function (e) {
      var del = e.target.closest('.b-del');
      if (del) {
        var id = del.getAttribute('data-del');
        state.bills = state.bills.filter(function (b) { return b.id !== id; });
        save(); renderHome(); toast('已删除');
        return;
      }
      var item = e.target.closest('.bill-item');
      if (item) {
        var bill = state.bills.find(function (b) { return b.id === item.getAttribute('data-id'); });
        if (bill) { hideSheet('sheet-all'); editBill(bill); }
      }
    });
    function editBill(bill) {
      state.editingId = bill.id;
      addType = bill.type; addCat = bill.cat;
      $('sheet-title').textContent = '编辑账单';
      $('in-amount').value = fmtMoney(bill.amount);
      $('in-remark').value = bill.remark || '';
      $('in-date').value = bill.date;
      var pr3 = $('parse-result');
      pr3.className = 'parse-result';
      pr3.style.display = 'none';
      pr3.innerHTML = '';
      document.querySelectorAll('#sheet-add .type-switch button').forEach(function (bb) {
        bb.classList.toggle('on', bb.getAttribute('data-t') === bill.type);
      });
      renderSheetCats();
      showSheet('sheet-add');
    }
    $('btn-show-all').addEventListener('click', function () {
      window.__allSheetOpen = true;
      showSheet('sheet-all');
      renderAllSheet();
    });

    /* 搜索（防抖 200ms） */
    var onSearch = debounce(function () {
      state.searchQuery = $('search-input').value;
      var box = $('search-box');
      if ($('search-input').value.trim()) box.classList.add('has-q');
      else box.classList.remove('has-q');
      renderHome();
    }, 200);
    $('search-input').addEventListener('input', onSearch);
    $('search-input').addEventListener('keyup', function (e) { if (e.key === 'Enter') { e.target.blur(); } });
    $('search-clear').addEventListener('click', function () {
      $('search-input').value = '';
      state.searchQuery = '';
      $('search-box').classList.remove('has-q');
      renderHome();
    });

    /* 预算 */
    function openBudgetSheet() {
      $('budget-amount').value = state.budget > 0 ? String(state.budget) : '';
      renderCatBudgetList();
      showSheet('sheet-budget');
    }
    $('btn-manage-budget').addEventListener('click', openBudgetSheet);
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'budget-set') openBudgetSheet();
    });
    $('budget-quick').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) $('budget-amount').value = b.getAttribute('data-v');
    });
    $('btn-budget-save').addEventListener('click', function () {
      /* 总预算（可为空 = 不设总预算） */
      var v = parseFloat($('budget-amount').value);
      if (!isNaN(v) && v > 0) state.budget = v;
      /* 分类预算 */
      var catB = {};
      var inputs = $('cat-budget-list').querySelectorAll('input[data-cbcat]');
      for (var i = 0; i < inputs.length; i++) {
        var cv = parseFloat(inputs[i].value);
        if (!isNaN(cv) && cv > 0) catB[inputs[i].getAttribute('data-cbcat')] = cv;
      }
      state.catBudgets = catB;
      save();
      hideSheet('sheet-budget');
      renderHome(true);
      renderBudgetSummary();
      toast('预算已保存 🎯');
    });
    $('btn-budget-clear').addEventListener('click', function () {
      state.budget = 0;
      state.catBudgets = {};
      save();
      hideSheet('sheet-budget');
      renderHome(true);
      renderBudgetSummary();
      toast('预算已清除');
    });

    /* 统计 */
    $('stat-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      document.querySelectorAll('#stat-tabs button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      renderStats();
    });
    /* 收支日历交互 */
    $('cal-prev').addEventListener('click', function () {
      calMonth.m--; if (calMonth.m < 1) { calMonth.m = 12; calMonth.y--; }
      renderCalendar();
    });
    $('cal-next').addEventListener('click', function () {
      calMonth.m++; if (calMonth.m > 12) { calMonth.m = 1; calMonth.y++; }
      renderCalendar();
    });
    $('cal-grid').addEventListener('click', function (e) {
      var cell = e.target.closest('.cal-cell');
      if (!cell) return;
      calSelected = cell.getAttribute('data-date');
      renderCalendar();
    });

    /* 自动记账页 */
    $('btn-add-recurring').addEventListener('click', function () {
      recType = 'expense'; recCat = defaultCat('expense').id;
      $('rec-amount').value = ''; $('rec-name').value = ''; $('rec-day').value = '1';
      document.querySelectorAll('#rec-type-switch button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === 'expense'); });
      renderRecCats();
      showSheet('sheet-rec');
    });
    document.querySelectorAll('#rec-type-switch button').forEach(function (b) {
      b.addEventListener('click', function () {
        recType = b.getAttribute('data-t');
        document.querySelectorAll('#rec-type-switch button').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-t') === recType); });
        renderRecCats();
      });
    });
    $('rec-cats').addEventListener('click', function (e) {
      var cell = e.target.closest('.cat-cell');
      if (cell) { recCat = cell.getAttribute('data-cat'); renderRecCats(); }
    });
    $('btn-rec-save').addEventListener('click', function () {
      var amt = parseFloat($('rec-amount').value);
      if (isNaN(amt) || amt <= 0) { toast('请输入有效金额'); return; }
      var name = $('rec-name').value.trim() || '周期账单';
      var day = parseInt($('rec-day').value, 10);
      if (isNaN(day) || day < 1 || day > 31) { toast('日期需在 1-31'); return; }
      state.recurring.push({ id: uid(), type: recType, amount: amt, cat: recCat || defaultCat(recType).id, name: name, day: day });
      save();
      hideSheet('sheet-rec');
      renderAuto();
      runRecurring();
      renderHome();
      toast('周期账单已保存，每月自动记账 🔁');
    });
    $('recurring-list').addEventListener('click', function (e) {
      var del = e.target.closest('[data-rdel]');
      if (!del) return;
      var rid = del.getAttribute('data-rdel');
      state.recurring = state.recurring.filter(function (r) { return r.id !== rid; });
      /* 同时删除该周期已生成的账单 */
      state.bills = state.bills.filter(function (b) { return b.recurringId !== rid; });
      save(); renderAuto(); renderHome(); toast('周期账单已删除');
    });

    $('btn-add-rule').addEventListener('click', function () {
      $('rule-keyword').value = '';
      renderRuleCatSelect();
      showSheet('sheet-rule');
    });
    $('btn-rule-save').addEventListener('click', function () {
      var kw = $('rule-keyword').value.trim();
      if (!kw) { toast('请输入关键词'); return; }
      state.rules.push({ kw: kw, cat: $('rule-cat').value, builtin: false });
      buildRuleIndex();
      save(); renderAuto(); toast('规则已保存');
      hideSheet('sheet-rule');
    });
    $('rule-list').addEventListener('click', function (e) {
      var del = e.target.closest('[data-ruledel]');
      if (!del) return;
      var idx = parseInt(del.getAttribute('data-ruledel'), 10);
      state.rules.splice(idx, 1);
      buildRuleIndex();
      save(); renderAuto(); toast('规则已删除');
    });

    /* 设置 */
    $('btn-manage-cats').addEventListener('click', function () {
      catEditType = 'expense'; catEditing = null;
      document.querySelectorAll('#cat-type-switch button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === 'expense'); });
      renderCatManage();
      showSheet('sheet-cat');
    });
    document.querySelectorAll('#cat-type-switch button').forEach(function (b) {
      b.addEventListener('click', function () {
        catEditType = b.getAttribute('data-t');
        catEditing = null;
        document.querySelectorAll('#cat-type-switch button').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-t') === catEditType); });
        renderCatManage();
      });
    });
    $('cat-manage-grid').addEventListener('click', function (e) {
      var cell = e.target.closest('.cat-cell');
      if (!cell) return;
      if (cell.id === 'cat-add-cell') {
        catEditing = null;
        $('cat-name').value = '';
        renderPalettes(EMOJIS[Math.floor(Math.random() * EMOJIS.length)], PALETTE[Math.floor(Math.random() * PALETTE.length)]);
        $('btn-cat-delete').style.display = 'none';
        return;
      }
      catEditing = cell.getAttribute('data-cat');
      var c = getCat(catEditing);
      $('cat-name').value = c.name;
      renderPalettes(c.icon, c.color);
      $('btn-cat-delete').style.display = 'block';
      renderCatManage();
    });
    $('emoji-pal').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var sel = b.getAttribute('data-e');
      $('emoji-pal').querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      window._catEmoji = sel;
    });
    $('color-pal').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var sel = b.getAttribute('data-c');
      $('color-pal').querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      window._catColor = sel;
    });
    $('btn-cat-save').addEventListener('click', function () {
      var name = $('cat-name').value.trim();
      if (!name) { toast('请输入分类名称'); return; }
      var icon = window._catEmoji || EMOJIS[0];
      var color = window._catColor || PALETTE[0];
      if (catEditing) {
        var c = getCat(catEditing);
        if (c) { c.name = name; c.icon = icon; c.color = color; }
      } else {
        state.cats.push({ id: uid(), name: name, icon: icon, color: color, type: catEditType });
      }
      buildRuleIndex();
      save(); renderCatManage(); renderHome(true); renderStats();
      toast('分类已保存');
    });
    $('btn-cat-delete').addEventListener('click', function () {
      if (!catEditing) return;
      if (!confirm('删除该分类？该分类下的账单将变为「未分类」。')) return;
      state.cats = state.cats.filter(function (c) { return c.id !== catEditing; });
      buildRuleIndex();
      save();
      catEditing = null;
      renderCatManage();
      renderHome(true);
      toast('分类已删除');
    });

    $('btn-export').addEventListener('click', function () {
      exportJSON();
      setTimeout(exportCSV, 300);
    });
    $('btn-import').addEventListener('click', function () { $('file-import').click(); });
    $('file-import').addEventListener('change', function () {
      var f = this.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var d = JSON.parse(reader.result);
          if (!d.bills) throw new Error('bad');
          state.cats = d.cats || state.cats;
          state.rules = d.rules || state.rules;
          state.bills = d.bills;
          state.recurring = d.recurring || state.recurring;
          save(); renderHome(); renderAuto(); renderStats();
          toast('数据导入成功 ✓');
        } catch (e) {
          toast('导入失败：文件格式不正确');
        }
      };
      reader.readAsText(f);
      this.value = '';
    });
    $('btn-demo').addEventListener('click', function () {
      if (!confirm('载入示例数据将追加示例账单，确定？')) return;
      loadDemo();
      renderHome();
    });
    $('btn-clear').addEventListener('click', function () {
      if (!confirm('确定清空全部账单、分类、规则和周期设置？此操作不可恢复。')) return;
      localStorage.removeItem(LS_KEY);
      initData();
      renderHome(); renderAuto(); renderStats();
      toast('已清空全部数据');
    });
    $('btn-help').addEventListener('click', function () { showSheet('sheet-help'); });

    /* 弹层关闭 */
    $('sheet-close').addEventListener('click', function () { hideSheet('sheet-add'); });
    $('smart-close').addEventListener('click', function () { hideSheet('sheet-smart'); });
    $('cat-close').addEventListener('click', function () { hideSheet('sheet-cat'); });
    $('rec-close').addEventListener('click', function () { hideSheet('sheet-rec'); });
    $('rule-close').addEventListener('click', function () { hideSheet('sheet-rule'); });
    $('all-close').addEventListener('click', function () { window.__allSheetOpen = false; hideSheet('sheet-all'); });
    $('budget-close').addEventListener('click', function () { hideSheet('sheet-budget'); });
    $('help-close').addEventListener('click', function () { hideSheet('sheet-help'); });
    var masks = ['sheet-add-mask', 'smart-mask', 'cat-mask', 'rec-mask', 'rule-mask', 'all-mask', 'budget-mask', 'help-mask'];
    masks.forEach(function (mid) {
      $(mid).addEventListener('click', function () {
        if (mid === 'all-mask') window.__allSheetOpen = false;
        hideSheet(mid.replace('-mask', 'sheet-'));
      });
    });

    /* ---- 自动检测：剪贴板 ---- */
    $('btn-detect-clip').addEventListener('click', function () { detectClipboard(); });

    /* iPhone 无法稳定后台读剪贴板，不再提供轮询开关。 */
    if ($('auto-toggle')) {
      $('auto-toggle').addEventListener('click', function () {
        toast('iPhone 不支持后台读取通知，请用上方常用账单、语音或分享入账');
      });
    }
    if ($('repeat-row')) {
      $('repeat-row').addEventListener('click', function (e) {
        var btn = e.target.closest('.repeat-chip');
        if (!btn) return;
        if (btn.getAttribute('data-demo')) { openSheetAdd(); return; }
        var items = $('repeat-row')._items || [];
        var bill = items[parseInt(btn.getAttribute('data-i'), 10)];
        if (bill) quickRepeatBill(bill);
      });
    }
    if ($('btn-shortcut')) {
      $('btn-shortcut').addEventListener('click', showShortcutHelp);
    }

    /* ---- 自动检测：语音记账（首页） ---- */
    $('btn-voice-add').addEventListener('click', function () {
      startVoice(handleVoiceResult, null, $('btn-voice-add'));
    });

    /* ---- 语音记账（记一笔弹层内） ---- */
    $('btn-voice').addEventListener('click', function () {
      startVoice(handleVoiceResult, $('voice-hint'), $('btn-voice'));
    });

    /* ---- 粘贴即识别 ---- */
    bindPasteAuto($('in-remark'));
    bindPasteAuto($('in-amount'));
    $('in-notify').addEventListener('paste', function () {
      setTimeout(function () {
        if ($('in-notify').value.trim()) $('btn-parse-go').click();
      }, 80);
    });
  }

  /* ---------- 初始化 ---------- */
  function initData() {
    state.cats = DEFAULT_CATS.map(function (c) { return Object.assign({}, c); });
    state.rules = DEFAULT_RULES.map(function (r) { return { kw: r.kw, cat: r.cat, builtin: true }; });
    state.bills = [];
    state.recurring = [];
    save();
  }

  function init() {
    state.month = curMonth();
    var ok = load();
    if (!ok || !state.cats.length) initData();
    /* 合并内置分类缺失 */
    DEFAULT_CATS.forEach(function (dc) {
      if (!state.cats.some(function (c) { return c.id === dc.id; })) state.cats.push(Object.assign({}, dc));
    });
    /* 合并内置规则缺失 */
    DEFAULT_RULES.forEach(function (dr) {
      if (!state.rules.some(function (r) { return r.kw === dr.kw; })) state.rules.push({ kw: dr.kw, cat: dr.cat, builtin: true });
    });
    buildRuleIndex();
    save();
    runRecurring();
    bindEvents();
    exposeToCharts();
    renderHome(true);
    renderBudgetSummary();
    renderAuto();
    stopAutoDetect();
    renderRepeatRow();
    setTimeout(checkBudgetWarn, 800);
    setTimeout(handleLaunchParams, 600);
    if (!STORAGE_OK) {
      setTimeout(function () { toast('⚠️ 当前环境无法保存数据，账单在刷新后会丢失。建议用 Safari 打开并添加到主屏幕'); }, 600);
    }
  }

  /* ============================================================
     一键记账：URL 参数入口（配合 iOS 快捷指令 / 语音 Siri）
     用法：
     https://站点/?add=美团外卖25元
        → 自动解析文本，弹出记账确认
     https://站点/?amt=25&note=美团&cat=c1&type=expense
        → 直接填充记账弹层
     https://站点/?auto=1&add=滴滴12元
        → 跳过确认，直接入账
     ============================================================ */
  function handleLaunchParams() {
    try {
      var q = location.search;
      var h = location.hash;
      if (!q && !h) return;
      var params = {};
      var str = (q || h).replace(/^[?#]/, '');
      str.split('&').forEach(function (kv) {
        var i = kv.indexOf('=');
        if (i > 0) {
          var k = decodeURIComponent(kv.slice(0, i));
          var v = decodeURIComponent(kv.slice(i + 1));
          params[k] = v;
        }
      });
      /* 清理地址栏，防止重复触发 */
      if (history.replaceState) history.replaceState(null, '', location.pathname);

      if (params.auto === '1' && params.add) {
        /* 直接入账模式（快捷指令"立即记账"） */
        var r = parseNotify(params.add);
        if (r && r.amount !== null) {
          if (!findDuplicateBill(r)) {
            var saved = saveParsedBill(r, 'shortcut');
            if (saved) toast('已快捷入账 ¥' + fmtMoney(r.amount) + ' · ' + (getCat(saved.cat) || { name: '未分类' }).name);
          } else toast('该账单似乎已记录，已防止重复入账');
        } else {
          toast('未能识别金额，请检查内容');
        }
        return;
      }
      if (params.add) {
        /* 文本解析模式：自动识别并弹出确认 */
        var res = parseNotify(params.add);
        if (res && res.amount !== null) {
          showDetectSingle(res);
          /* 滚动到检测卡片并高亮 */
          var dc = $('detect-card');
          if (dc) { dc.scrollIntoView({ behavior: 'smooth', block: 'center' }); dc.classList.add('flash'); setTimeout(function () { dc.classList.remove('flash'); }, 1600); }
          toast('已识别，请确认入账');
        } else {
          openSheetAdd({ remark: params.add, autoNote: '已填入备注，请补金额或直接识别' });
        }
        return;
      }
      if (params.amt || params.note) {
        /* 参数填充模式（快捷指令"填表记账"） */
        var pf = {
          amount: parseFloat(params.amt) || '',
          remark: params.note || '',
          date: params.date || todayStr()
        };
        if (params.type === 'income') pf.type = 'income';
        if (params.cat) pf.cat = params.cat;
        if (params.note) pf.autoNote = '快捷指令已填入：' + params.note + (params.amt ? ' ' + params.amt + '元' : '');
        openSheetAdd(pf);
      }
    } catch (e) { /* 参数解析失败静默 */ }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
