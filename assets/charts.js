/* ============================================================
   轻记账 LightBook · 统计图表 (ECharts)
   优化：实例缓存（不销毁重建）、Canvas 渲染器（更流畅）、
        懒初始化（首次进入统计页才创建）、resize 节流
   ============================================================ */
(function () {
  'use strict';

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();

  var charts = {};

  /* 实例缓存：同一容器只 init 一次，后续 setOption 更新（避免 dispose 重建开销） */
  function getChart(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    if (charts[id]) return charts[id];
    var c = echarts.init(el, null, { renderer: 'canvas' });
    charts[id] = c;
    /* resize 节流（150ms），避免快速切换时反复触发 */
    var t = null;
    window.addEventListener('resize', function () {
      if (t) return;
      t = setTimeout(function () { t = null; c.resize(); }, 150);
    });
    return c;
  }

  /* 趋势柱状图 */
  window.renderTrend = function (data, type) {
    var c = getChart('chart-trend');
    if (!c) return;
    var color = type === 'income' ? accent2 : accent;
    var base = type === 'income' ? '#e8f8ec' : 'rgba(0,122,255,0.14)';
    c.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: 'rgba(28,28,30,.92)',
        borderWidth: 0,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: function (p) {
          var v = p[0] && p[0].value ? p[0].value : 0;
          return p[0].axisValue + '<br>' + (type === 'income' ? '收入' : '支出') + ': ¥' + Number(v).toFixed(2);
        }
      },
      grid: { left: 8, right: 8, top: 24, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(function (d) { return d.label; }),
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: muted, fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLabel: {
          color: muted, fontSize: 10,
          formatter: function (v) { return v >= 10000 ? (v / 10000).toFixed(1) + 'w' : v; }
        }
      },
      series: [{
        type: 'bar',
        data: data.map(function (d, i) {
          var isLast = i === data.length - 1;
          return {
            value: d.val,
            itemStyle: {
              borderRadius: [6, 6, 6, 6],
              color: isLast ? color : base
            }
          };
        }),
        barWidth: 22
      }]
    }, true);
  };

  /* 本月每日支出柱状图 */
  window.renderDailyChart = function () {
    var c = getChart('chart-daily');
    if (!c) return;
    var ym = window.__LB_STATE ? window.__LB_STATE.month : { y: new Date().getFullYear(), m: new Date().getMonth() + 1 };
    var p = ym.y + '-' + (ym.m < 10 ? '0' + ym.m : ym.m);
    var bills = window.__LB_BILLS ? window.__LB_BILLS.filter(function (b) { return b.type === 'expense' && b.date.indexOf(p) === 0; }) : [];
    var dim = new Date(ym.y, ym.m, 0).getDate();
    var byDay = new Array(dim + 1).fill(0);
    bills.forEach(function (b) {
      var day = parseInt(b.date.slice(8, 10), 10);
      if (day >= 1 && day <= dim) byDay[day] += b.amount;
    });
    var days = [];
    for (var d = 1; d <= dim; d++) days.push(d);
    var today = new Date().getDate();
    var todayIdx = ym.y === new Date().getFullYear() && ym.m === new Date().getMonth() + 1 ? today : -1;
    var maxVal = Math.max.apply(null, byDay.slice(1));
    if (!maxVal) maxVal = 1;

    c.setOption({
      animation: false,
      grid: { left: 8, right: 8, top: 24, bottom: 4, containLabel: true },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: 'rgba(28,28,30,.92)',
        borderWidth: 0,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: function (ps) {
          var p0 = ps[0];
          return ym.m + '月' + p0.name + '日<br>支出: ¥' + Number(p0.value).toFixed(2);
        }
      },
      xAxis: {
        type: 'category',
        data: days.map(function (d) { return String(d); }),
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: {
          color: muted, fontSize: 10,
          formatter: function (v) {
            var n = parseInt(v, 10);
            return (n % 5 === 1 || n === 1 || n === dim || n === todayIdx) ? v : '';
          }
        }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: rule, type: 'dashed' } },
        axisLabel: {
          color: muted, fontSize: 10,
          formatter: function (v) { return v >= 10000 ? (v / 10000).toFixed(1) + 'w' : v; }
        }
      },
      series: [{
        type: 'bar',
        data: days.map(function (d) {
          return {
            value: Math.round(byDay[d] * 100) / 100,
            itemStyle: {
              borderRadius: [3, 3, 0, 0],
              color: d === todayIdx ? accent2 : (byDay[d] > 0 ? accent : 'rgba(0,122,255,0.08)')
            }
          };
        }),
        barCategoryGap: '20%'
      }]
    }, true);
  };

  /* 分类占比环形图 */
  window.renderCatChart = function (type) {
    var c = getChart('chart-cat');
    if (!c) return;
    var ym = window.__LB_STATE ? window.__LB_STATE.month : { y: new Date().getFullYear(), m: new Date().getMonth() + 1 };
    var p = ym.y + '-' + (ym.m < 10 ? '0' + ym.m : ym.m);
    var bills = window.__LB_BILLS ? window.__LB_BILLS.filter(function (b) { return b.type === type && b.date.indexOf(p) === 0; }) : [];
    var byCat = {};
    bills.forEach(function (b) { byCat[b.cat] = (byCat[b.cat] || 0) + b.amount; });
    var arr = Object.keys(byCat).map(function (id) { return { id: id, val: byCat[id] }; });
    arr.sort(function (a, b) { return b.val - a.val; });
    var total = arr.reduce(function (s, a) { return s + a.val; }, 0);

    function findCat(id) {
      var cats = window.__LB_CATS || [];
      for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i];
      return null;
    }

    if (!arr.length) {
      c.setOption({
        animation: false,
        title: {
          text: '暂无数据', left: 'center', top: 'middle',
          textStyle: { color: muted, fontSize: 13, fontWeight: 400 }
        }
      }, true);
      return;
    }

    var colors = arr.map(function (a) {
      var cat = findCat(a.id);
      return cat ? cat.color : '#8E8E93';
    });

    c.setOption({
      animation: false,
      color: colors,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: 'rgba(28,28,30,.92)',
        borderWidth: 0,
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: function (p) {
          var pct = total ? (p.value / total * 100).toFixed(1) : '0';
          return p.name + '<br>¥' + Number(p.value).toFixed(2) + ' (' + pct + '%)';
        }
      },
      legend: {
        bottom: 0, itemWidth: 8, itemHeight: 8, icon: 'circle',
        textStyle: { color: muted, fontSize: 11 }
      },
      series: [{
        type: 'pie',
        radius: ['46%', '70%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: bg2, borderWidth: 2 },
        label: {
          show: true,
          formatter: function (p) {
            var pct = total ? (p.value / total * 100).toFixed(0) : '0';
            return pct + '%';
          },
          color: ink, fontSize: 11, fontWeight: 600
        },
        labelLine: { length: 8, length2: 6, lineStyle: { color: rule } },
        data: arr.map(function (a) {
          var cat = findCat(a.id);
          return { name: cat ? cat.name : '未分类', value: a.val };
        })
      }]
    }, true);
  };
})();
