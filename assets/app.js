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

  /* 内置自动分类规则：关键词 → 分类 id（40+ 条） */
  var DEFAULT_RULES = [
    { kw: '美团 饿了么 外卖 麦当劳 肯德基 星巴克 瑞幸 海底捞 火锅 奶茶 咖啡 餐厅 食堂 小吃 烧烤 面馆 饺子 早餐 午餐 晚餐 饭 菜 蛋糕 水果店 便利店', cat: 'c1' },
    { kw: '滴滴 出租车 打车 地铁 公交 高铁 火车 机票 加油 停车 共享单车 哈啰 网约车 航空 铁路 12306', cat: 'c2' },
    { kw: '淘宝 天猫 京东 拼多多 唯品会 苏宁 超市 商场 百货 优衣库 无印良品 网购 快递 服饰 鞋 化妆品 屈臣氏 名创优品', cat: 'c3' },
    { kw: '房租 物业 水费 电费 燃气 煤气 宽带 供暖 中介 维修 装修', cat: 'c4' },
    { kw: '电影 KTV 游戏 网吧 景区 门票 视频会员 腾讯视频 爱奇艺 网易云 QQ音乐 B站 直播 打赏 剧本杀 桌游', cat: 'c5' },
    { kw: '医院 药房 药店 诊所 挂号 体检 医保 牙科 门诊 住院 保健品', cat: 'c6' },
    { kw: '学费 培训 课程 网课 书店 书籍 考试 报名 驾校 文具 辅导', cat: 'c7' },
    { kw: '红包 送礼 份子钱 请客 礼金 生日 转账 还款', cat: 'c8' },
    { kw: '话费 充值 手机 流量 宽带费 运营商 中国移动 中国联通 中国电信', cat: 'c9' },
    { kw: '工资 薪资 薪水 发薪', cat: 'i1' },
    { kw: '奖金 年终奖 绩效 分红', cat: 'i2' },
    { kw: '理财 基金 利息 股票 收益 余额宝', cat: 'i3' },
    { kw: '兼职 外快 劳务 稿费 佣金 提成', cat: 'i4' },
    { kw: '红包 收款 礼金', cat: 'i5' }
  ];

  /* ---------- 状态 ---------- */
  var state = {
    cats: [],
    rules: [],       // { kw: '美团 饿了么', cat: 'c1', builtin: true }
    bills: [],       // { id, type, amount, cat, remark, date: 'YYYY-MM-DD', source: 'manual'|'auto'|'recurring'|'parse' }
    recurring: [],   // { id, type, amount, cat, name, day }
    month: null,     // { y, m }
    editingId: null, // 正在编辑的账单 id
    parsePending: null // 智能识别待入账结果
  };

  var LS_KEY = 'lightbook_v1';
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

  /* ---------- 存储 ---------- */
  var STORAGE_OK = true;
  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        cats: state.cats, rules: state.rules, bills: state.bills, recurring: state.recurring
      }));
      STORAGE_OK = true;
    } catch (e) { STORAGE_OK = false; }
  }
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      state.cats = d.cats || [];
      state.rules = d.rules || [];
      state.bills = d.bills || [];
      state.recurring = d.recurring || [];
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

  /* ---------- 自动分类引擎 ----------
     输入：文本 + 账单类型
     输出：匹配到的分类 id（无匹配返回 null） */
  function autoClassify(text, type) {
    if (!text) return null;
    var t = String(text);
    var best = null, bestLen = 0;
    for (var i = 0; i < state.rules.length; i++) {
      var r = state.rules[i];
      var c = getCat(r.cat);
      if (!c || c.type !== type) continue;
      var kws = String(r.kw).split(/\s+/).filter(Boolean);
      for (var j = 0; j < kws.length; j++) {
        if (t.indexOf(kws[j]) >= 0 && kws[j].length > bestLen) {
          best = r.cat; bestLen = kws[j].length;
        }
      }
    }
    return best;
  }

  /* ---------- 智能识别：解析支付通知文本 ---------- */
  var NOISE_WORDS = ['支付凭证', '交易提醒', '到账提醒', '消费提醒', '付款成功', '交易成功', '消费记录', '支出提醒', '银行卡', '您尾号', '您于', '余额', '尊敬的', '您好', '通知', '提醒', '账单', '收款人', '付款方', '交易对方'];
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

  function parseNotify(text) {
    var t = String(text || '').replace(/\s+/g, ' ');
    if (!t) return null;
    /* 先屏蔽平台词，后续所有索引与切片均基于 s，保证位置一致 */
    var s = t.replace(/支付宝/g, 'ALIPAY').replace(/微信支付/g, 'WXPAY').replace(/云闪付/g, 'YSF').replace(/银联/g, 'UNION');
    var out = { amount: null, remark: '', date: todayStr(), type: 'expense' };

    /* 金额提取：¥ / 数字+元块 / 关键词+数字 / 中文数字 / 纯数字兜底 */
    var amtIdx = -1, amtVal = null, amtLen = 0;
    var m1 = s.match(/([¥￥]\s*)(\d+(?:\.\d{1,2})?)/);
    var m2 = s.match(/(\d+(?:\.\d{1,2})?)\s*[元块]/);
    var m3 = s.match(/(?:消费|支付|付款|支出|扣款|转账|收款|到账|收入|入账)(?:了|为|金额|人民币)?\s*[:：]?\s*(\d+(?:\.\d{1,2})?)/);
    var mCn = s.match(/([零一二两三四五六七八九十百千万]+)[元块]/);
    if (m1) { amtVal = parseFloat(m1[2]); amtIdx = s.indexOf(m1[0]); amtLen = m1[0].length; }
    else if (m2) { amtVal = parseFloat(m2[1]); amtIdx = s.indexOf(m2[0]); amtLen = m2[0].length; }
    else if (m3) { amtVal = parseFloat(m3[1]); amtIdx = s.indexOf(m3[0]); amtLen = m3[0].length; }
    else if (mCn) {
      var cnv = cnToNum(mCn[1]);
      if (cnv > 0) { amtVal = cnv; amtIdx = s.indexOf(mCn[0]); amtLen = mCn[0].length; }
    }
    if (amtVal === null) {
      /* 纯数字兜底：移除日期后取最后一个数字（口语场景：星巴克咖啡32）
         注意：日期分隔符只认「月」「-」「/」，避免把小数金额 18.5 误判成日期 */
      var clean = s
        .replace(/(20\d{2})[年\/\-.](\d{1,2})[月\/\-.](\d{1,2})日?/g, ' ')
        .replace(/\d{1,2}月\d{1,2}日?/g, ' ')
        .replace(/\d{1,2}[\/\-]\d{1,2}/g, ' ');
      var matches = [], re4 = /(?:^|[^0-9.])(\d+(?:\.\d{1,2})?)(?![0-9.])/g, mm4;
      while ((mm4 = re4.exec(clean)) !== null) matches.push(mm4);
      if (matches.length) {
        var last = matches[matches.length - 1];
        amtVal = parseFloat(last[1]);
        amtIdx = clean.indexOf(last[1]);
        amtLen = last[1].length;
      }
    }
    out.amount = amtVal;

    /* 方向识别：按屏蔽后文本关键词判断 */
    var strongIncome = /(收款|到账|入账|收入|转入|收到|退款|退回|获得)/.test(s);
    var strongExpense = /(支出|扣款|消费|购买|支付成功|付款成功|付款给|支付给|消费了|支出了|向.{1,10}付款|消费.{1,12}元|支出.{1,12}元|购买.{1,12}元)/.test(s);
    if (strongIncome && !/(支出|扣款|消费|购买)/.test(s)) out.type = 'income';
    else if (strongExpense) out.type = 'expense';
    else if (strongIncome) out.type = 'income';
    else out.type = 'expense';

    /* 商户提取 */
    out.remark = extractMerchant(s, amtIdx, amtLen);

    /* 日期提取（「月」字或 - / 分隔符才算日期，避免误伤小数金额） */
    var d = t.match(/(20\d{2})[年\/\-.](\d{1,2})[月\/\-.](\d{1,2})日?/) || t.match(/(\d{1,2})月(\d{1,2})日?/) || t.match(/(\d{1,2})[\/\-](\d{1,2})日?/);
    if (d) {
      var y = d[1].length === 4 ? parseInt(d[1], 10) : curMonth().y;
      var mm = parseInt(d[d.length === 4 ? 2 : 1], 10);
      var dd = parseInt(d[d.length === 4 ? 3 : 2], 10);
      if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
        out.date = y + '-' + pad(mm) + '-' + pad(dd);
      }
    }

    if (out.amount === null && !out.remark) return null;
    if (out.amount === null) {
      /* 尝试任意数字 */
      var any = t.match(/(\d+(?:\.\d{1,2})?)/);
      if (any) out.amount = parseFloat(any[1]);
    }
    return out;
  }

  /* ---------- 周期记账：自动生成账单 ---------- */
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
          id: uid(), type: r.type, amount: r.amount, cat: r.cat,
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
    groups.forEach(function (g) {
      var dayExp = sumOf(g.items, 'expense');
      var dayInc = sumOf(g.items, 'income');
      html += '<div class="group-label"><span>' + dayLabel(g.date) + '</span><span>' +
        (dayExp > 0 ? '支 ' + fmtMoney(dayExp) + '　' : '') +
        (dayInc > 0 ? '收 ' + fmtMoney(dayInc) : '') + '</span></div>';
      html += '<div class="bill-list">' + g.items.map(billItemHTML).join('') + '</div>';
      html += '<div style="height:6px"></div>';
    });
    container.innerHTML = html;
  }

  /* ---------- 渲染：首页 ---------- */
  function renderHome() {
    var ym = state.month;
    var list = sortBills(billsInMonth(ym));
    var exp = sumOf(list, 'expense');
    var inc = sumOf(list, 'income');
    $('sum-balance').textContent = fmtMoney(inc - exp);
    $('sum-expense').textContent = '¥' + fmtMoney(exp);
    $('sum-income').textContent = '¥' + fmtMoney(inc);
    $('sum-count').textContent = list.length;
    $('m-label').textContent = ym.y + '年' + ym.m + '月';
    $('today-sub').textContent = new Date().getFullYear() + '年' + (new Date().getMonth() + 1) + '月' + new Date().getDate() + '日';

    /* 快捷分类 */
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

    renderBillList($('bill-area'), list.slice(0, 30), false);
    $('all-month-label').textContent = ym.y + '年' + ym.m + '月';
    renderAllSheet();
  }

  function renderAllSheet() {
    var list = sortBills(billsInMonth(state.month));
    var container = $('all-bill-list');
    if (!list.length) {
      container.innerHTML = '<div class="empty"><span class="e-ico">🧾</span>本月暂无账单</div>';
      return;
    }
    renderBillList(container, list, true);
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
    renderCatChart(type);
    renderRank(type);
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
    mask.classList.add('show');
    sheet.classList.add('show');
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
      state.bills.push({ id: uid(), type: res.type, amount: res.amount, cat: cat || defaultCat(res.type).id, remark: res.remark || '自动识别账单', date: res.date, source: 'auto' });
      save();
      card.className = 'detect-card';
      card.innerHTML = '';
      renderHome();
      toast('已自动入账并分类 ✓');
    });
    card.querySelector('.dc-btn.no').addEventListener('click', function () {
      card.className = 'detect-card';
      card.innerHTML = '';
    });
  }

  /* 剪贴板不可用时降级：引导粘贴到输入框 */
  function focusClipPaste() {
    var card = $('detect-card');
    card.className = 'detect-card show dc-empty';
    card.innerHTML =
      '<div class="dc-detail">当前网络环境无法直接读取剪贴板。请先复制账单文本，再长按下方输入框选择「粘贴」，将自动识别 👇</div>' +
      '<input type="text" class="dc-input" id="dc-input" placeholder="长按此处粘贴账单文本…" autocomplete="off">';
    var inp = card.querySelector('#dc-input');
    inp.addEventListener('paste', function () { setTimeout(function () { renderDetect(inp.value); }, 80); });
    inp.addEventListener('input', function () { if (inp.value.trim()) renderDetect(inp.value); });
    setTimeout(function () { inp.focus(); }, 120);
  }

  /* 检测剪贴板（需要 HTTPS 或 localhost；否则降级为粘贴引导） */
  function detectClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (text) {
        renderDetect(text);
      }).catch(function () {
        focusClipPaste();
      });
    } else {
      focusClipPaste();
    }
  }

  /* 语音识别 */
  var voiceRec = null;
  function speechSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  function startVoice(onResult, hintEl, btnEl) {
    if (!speechSupported()) {
      toast('当前浏览器不支持语音识别，请用 Safari 并开启 HTTPS 访问');
      return;
    }
    if (voiceRec) { try { voiceRec.abort(); } catch (e) {} }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var rec = new SR();
    voiceRec = rec;
    rec.lang = 'zh-CN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    if (btnEl) { btnEl.classList.add('listening'); btnEl.innerHTML = '⏺ 聆听中…'; }
    if (hintEl) hintEl.textContent = '🎙️ 聆听中，请说出账单内容…';
    rec.onresult = function (e) {
      var text = '';
      for (var i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      if (hintEl) hintEl.textContent = '识别到：「' + text + '」';
      onResult(text);
    };
    rec.onerror = function (e) {
      toast('语音识别失败：' + (e.error === 'not-allowed' ? '请允许麦克风权限' : (e.error || '未知错误')));
    };
    rec.onend = function () {
      voiceRec = null;
      if (btnEl) { btnEl.classList.remove('listening'); btnEl.innerHTML = '🎤 语音记账'; }
      if (hintEl) hintEl.textContent = '说出「美团外卖 25 元」，自动识别并填写';
    };
    try { rec.start(); } catch (e) { toast('语音识别启动失败'); }
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

    /* 快捷分类 */
    $('quick-grid').addEventListener('click', function (e) {
      var el = e.target.closest('.quick-btn');
      if (!el) return;
      if (el.id === 'quick-more') { openSheetAdd(); return; }
      openSheetAdd({ type: el.getAttribute('data-type'), cat: el.getAttribute('data-cat') });
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
      var p = state.parsePending;
      if (!p) return;
      state.bills.push({ id: uid(), type: p.type, amount: p.amount, cat: p.cat || defaultCat(p.type).id, remark: p.remark, date: p.date, source: 'parse' });
      save();
      hideSheet('sheet-smart');
      renderHome();
      toast('已自动入账并分类 ✓');
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
    $('in-remark').addEventListener('input', function () {
      var t = this.value.trim();
      if (!t) return;
      var c = autoClassify(t, addType);
      if (c && c !== addCat) {
        addCat = c;
        renderSheetCats();
      }
    });
    $('btn-save').addEventListener('click', function () {
      var amt = parseFloat($('in-amount').value);
      if (isNaN(amt) || amt <= 0) { toast('请输入有效金额'); return; }
      var remark = $('in-remark').value.trim();
      var date = $('in-date').value || todayStr();
      var cat = addCat || (autoClassify(remark, addType) || defaultCat(addType).id);
      if (state.editingId) {
        var b = state.bills.find(function (x) { return x.id === state.editingId; });
        if (b) { b.amount = amt; b.remark = remark; b.date = date; b.cat = cat; b.type = addType; }
      } else {
        state.bills.push({ id: uid(), type: addType, amount: amt, cat: cat, remark: remark, date: date, source: 'manual' });
      }
      save();
      hideSheet('sheet-add');
      renderHome();
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
    $('btn-show-all').addEventListener('click', function () { showSheet('sheet-all'); renderAllSheet(); });

    /* 统计 */
    $('stat-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      document.querySelectorAll('#stat-tabs button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      renderStats();
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
      save(); renderAuto(); toast('规则已保存');
      hideSheet('sheet-rule');
    });
    $('rule-list').addEventListener('click', function (e) {
      var del = e.target.closest('[data-ruledel]');
      if (!del) return;
      var idx = parseInt(del.getAttribute('data-ruledel'), 10);
      state.rules.splice(idx, 1);
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
      save(); renderCatManage(); renderHome();
      toast('分类已保存');
    });
    $('btn-cat-delete').addEventListener('click', function () {
      if (!catEditing) return;
      if (!confirm('删除该分类？该分类下的账单将变为「未分类」。')) return;
      state.cats = state.cats.filter(function (c) { return c.id !== catEditing; });
      save();
      catEditing = null;
      renderCatManage();
      renderHome();
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
    $('all-close').addEventListener('click', function () { hideSheet('sheet-all'); });
    $('help-close').addEventListener('click', function () { hideSheet('sheet-help'); });
    var masks = ['sheet-mask', 'smart-mask', 'cat-mask', 'rec-mask', 'rule-mask', 'all-mask', 'help-mask'];
    masks.forEach(function (mid) {
      $(mid).addEventListener('click', function () { hideSheet(mid.replace('-mask', 'sheet-')); });
    });

    /* ---- 自动检测：剪贴板 ---- */
    $('btn-detect-clip').addEventListener('click', function () { detectClipboard(); });

    /* ---- 自动检测：语音记账（首页） ---- */
    $('btn-voice-add').addEventListener('click', function () {
      startVoice(function (text) { renderDetect(text); }, null, $('btn-voice-add'));
    });

    /* ---- 语音记账（记一笔弹层内） ---- */
    $('btn-voice').addEventListener('click', function () {
      startVoice(function (text) {
        var res = parseNotify(text);
        if (res && res.amount !== null) {
          autoFillSheet(res, false);
          toast('已识别，确认后保存 ✓');
        } else {
          $('in-remark').value = text;
          var p = $('parse-result');
          p.className = 'parse-result err';
          p.style.display = 'block';
          p.innerHTML = '未能从语音中识别出金额，已填入备注，请手动填写金额';
        }
      }, $('voice-hint'), $('btn-voice'));
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
    save();
    runRecurring();
    bindEvents();
    exposeToCharts();
    renderHome();
    renderAuto();
    if (!STORAGE_OK) {
      setTimeout(function () { toast('⚠️ 当前环境无法保存数据，账单在刷新后会丢失。建议用 Safari 打开并添加到主屏幕'); }, 600);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
