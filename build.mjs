// 静态站点生成脚本（无依赖）。运行：node build.mjs  输出到 dist/
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'dist';
const MAIL = 'zuhudegou@gmail.com';
const GH = 'https://github.com/Fluoro-Antimonic-Acid';

const NAV = [
  { href: '/', label: '首页', key: 'home' },
  { href: '/projects/', label: '作品', key: 'projects' },
  { href: '/about/', label: '关于', key: 'about' },
  { href: '/contact/', label: '联系', key: 'contact' },
];

const GROUPS = {
  hardware: '自研硬件',
  system: '整机系统',
  software: '跨界软件',
  misc: '花絮',
};

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function dsec(label, html, open = false) {
  return `<details class="dsec"${open ? ' open' : ''}><summary class="dlabel"><span class="dl-t">${label}</span><span class="plus"></span></summary><div class="dcontent">${html}</div></details>`;
}

const dsecC = (label, html) => dsec(label, html, false);
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const STACK = ['STM32G4 / F4', 'FOC', 'FDCAN', 'MIT 协议', 'PID / LADRC', '龙伯格观测器', '滑模观测器', 'MATLAB / Simulink', 'SVPWM', 'Buck-Boost', 'KiCad', 'Altium Designer', '嘉立创 EDA', '六层高速 Layout', 'Linux', 'Kotlin', 'Jetpack Compose'];

function specTable(rows) {
  return `<table class="spec"><tbody>${rows
    .map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`)
    .join('')}</tbody></table>`;
}

/* ---- block diagrams (SVG, animated wires) ---- */

function box(x, y, w, h, title, sub = '', cls = '') {
  const cx = x + w / 2;
  const ty = sub ? y + h / 2 - 4 : y + h / 2 + 5;
  return `<g class="box ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/><text class="t" x="${cx}" y="${ty}" text-anchor="middle">${title}</text>${
    sub ? `<text class="s" x="${cx}" y="${y + h / 2 + 16}" text-anchor="middle">${sub}</text>` : ''
  }</g>`;
}
const wire = (d, cls = '') => `<path class="wire ${cls}" d="${d}" marker-end="url(#ah)"/>`;
const elabel = (x, y, t, anchor = 'middle') => `<text class="elabel" x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;

function diagramSvg(h, inner, caption) {
  return `<figure class="diag reveal"><div class="diag-scroll"><svg viewBox="0 0 960 ${h}" role="img" aria-label="${esc(caption)}"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="ahead"/></marker></defs>${inner}</svg></div><figcaption>${caption}</figcaption></figure>`;
}

const DIAGRAMS = {
  'joint-motor': () =>
    diagramSvg(
      285,
      box(20, 100, 140, 60, '上位机', 'MIT 指令') +
        box(230, 80, 190, 100, 'STM32G431', 'FOC · MIT 协议', 'accent') +
        box(490, 100, 140, 60, 'FD6288T', '栅极驱动') +
        box(690, 100, 130, 60, '三相桥', 'HYG080N10') +
        box(870, 100, 80, 60, '电机') +
        box(560, 205, 170, 55, 'MA600', '磁编码器') +
        wire('M160 130 H226') + elabel(193, 120, 'FDCAN') +
        wire('M420 130 H486') + elabel(453, 120, 'PWM') +
        wire('M630 130 H686') +
        wire('M820 130 H866') +
        wire('M910 160 V232 H734') +
        wire('M560 232 H325 V184') + elabel(440, 252, '位置反馈') +
        wire('M755 100 V45 H325 V76', 'b') + elabel(540, 36, '相电流 · G431 内部运放'),
      '信号链：上位机经 FDCAN 下发 MIT 指令，G431 完成电流环与位置闭环。'
    ),
  'h3-board': () =>
    diagramSvg(
      275,
      `<rect class="frame" x="220" y="20" width="725" height="200" rx="4"/>` +
        elabel(240, 44, '自制 H3 开发板', 'start') +
        box(20, 95, 150, 60, '浏览器', '局域网访问') +
        box(260, 75, 170, 100, 'Allwinner H3', '4× Cortex-A7', 'accent') +
        box(490, 60, 150, 50, 'DDR', '512 MB') +
        box(490, 140, 150, 50, 'TF 卡', '15 GB · Ubuntu') +
        box(700, 95, 210, 60, 'Caddy :8080', '静态页面') +
        wire('M430 85 H486') +
        wire('M430 165 H486') +
        wire('M640 165 H670 V130 H696') +
        wire('M95 155 V245 H805 V159', 'b') + elabel(450, 265, 'HTTP 请求'),
      '局域网镜像的请求路径：浏览器访问板子上的 Caddy，页面文件存放在 TF 卡上。'
    ),
  'dcdc-buckboost': () =>
    diagramSvg(
      290,
      box(20, 100, 150, 60, '输入', '5 – 80 V') +
        box(250, 80, 240, 100, 'Buck-Boost 功率级', '升压 / 降压', 'accent') +
        box(570, 100, 180, 60, '输出', '1.4 – 100 V · 20 A') +
        box(820, 100, 120, 60, '负载') +
        box(270, 220, 200, 55, 'STM32G474', '数字控制') +
        wire('M170 130 H246') +
        wire('M490 130 H566') +
        wire('M750 130 H816') +
        wire('M370 220 V184') + elabel(385, 205, 'PWM', 'start') +
        wire('M660 160 V247 H474', 'b') + elabel(565, 270, '输出反馈'),
      '功率级在升压与降压之间切换，G474 根据输出反馈闭环调节 PWM。'
    ),
  'h6-layout': () => {
    const ifs = ['USB', 'HDMI', 'Wi-Fi', 'eMMC', 'TF 卡', 'GPIO'];
    let inner =
      box(380, 100, 180, 100, 'Allwinner H6', 'BGA 主控', 'accent') +
      box(60, 100, 170, 100, 'LPDDR3', '2 GB') +
      `<path class="bus" d="M230 120 H380 M230 140 H380 M230 160 H380 M230 180 H380"/>` +
      elabel(305, 225, '等长 · 同组同层');
    ifs.forEach((name, i) => {
      const y = 15 + i * 46;
      inner += box(700, y, 160, 34, name) + wire(`M560 150 H630 V${y + 17} H696`);
    });
    return diagramSvg(295, inner, 'H6 与 LPDDR3 之间的高速总线按等长规则布线，外围接口分区布局。');
  },
  'patrol-car': () =>
    diagramSvg(
      275,
      box(20, 90, 140, 60, '上位机') +
        box(240, 70, 200, 100, 'STM32F407VE', '下位控制板', 'accent') +
        box(520, 90, 150, 60, '驱动级') +
        box(750, 90, 170, 60, '直流电机') +
        box(240, 205, 200, 50, '电源管理') +
        wire('M160 120 H236') + elabel(198, 110, '串口') +
        wire('M440 120 H516') + elabel(478, 110, 'PWM') +
        wire('M670 120 H746') +
        wire('M340 205 V174', 'b') +
        wire('M440 230 H595 V154', 'b') + elabel(520, 250, '供电'),
      '下位板通过串口接收上位机指令，以 PWM 驱动直流电机，并负责整车供电。'
    ),
  'omni-car': () => {
    let inner =
      box(20, 120, 170, 60, '上层指令', 'vx · vy · ω') +
      box(270, 100, 210, 100, 'STM32F407VE', '运动学解算', 'accent') +
      wire('M190 150 H266');
    [20, 90, 160, 230].forEach((y, i) => {
      inner += box(640, y, 200, 50, `轮 ${i + 1}`, '直流电机') + wire(`M480 150 H580 V${y + 25} H636`);
    });
    return diagramSvg(295, inner, '把整车的目标速度 vx、vy、ω 解算为四个轮子各自的转速。');
  },
  shotdeck: () =>
    diagramSvg(
      295,
      box(40, 70, 230, 110, 'Shotdeck', 'Android · Kotlin', 'accent') +
        box(690, 70, 230, 110, 'Nikon Z30', '相机热点 · PTP/IP') +
        box(65, 225, 180, 50, '系统相册', 'JPEG · SHA-256 去重') +
        wire('M686 105 H274') + elabel(480, 95, '实时取景 · 参数回读 · 照片') +
        wire('M274 150 H686', 'b') + elabel(480, 172, '快门 · 光圈 / 快门 / ISO 调节') +
        wire('M155 180 V221') + elabel(170, 205, '保存', 'start'),
      '手机连接相机热点，经 PTP/IP 取景、调参并下载照片。'
    ),
  'pcb-fu': () =>
    diagramSvg(
      280,
      `<rect class="frame board" x="330" y="20" width="300" height="240" rx="18"/>` +
        [[352, 42], [608, 42], [352, 238], [608, 238]].map(([x, y]) => `<circle class="hole" cx="${x}" cy="${y}" r="7"/>`).join('') +
        `<text class="fu" x="480" y="190" text-anchor="middle">福</text>` +
        elabel(660, 60, '两层板 · 沉金', 'start') +
        elabel(660, 84, '嘉立创 EDA 专业版', 'start'),
      '用 PCB 的板框与图形画出的新年福字。'
    ),
};

function header(active) {
  return `<header class="top" id="top">
    <a class="mark" href="/">Fluoroantimonic Acid</a>
    <nav aria-label="主导航">${NAV.map(
      (n) => `<a href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}>${n.label}</a>`
    ).join('')}</nav>
  </header>`;
}

function footer() {
  return `<footer><div class="wrap">
    <span>Hosted on GitHub Pages · mirrored on a self-made H3 board · 更新于 ${BUILD_DATE}</span>
    <span><a href="/projects/">作品</a> / <a href="/about/">关于</a> / <a href="mailto:${MAIL}">${MAIL}</a> / <a href="${GH}" rel="noopener">GitHub</a></span>
  </div></footer>
<button type="button" class="totop" id="totop" aria-label="回到顶部">↑</button>`;
}

function layout({ title, desc, active, body }) {
  const full = title === '作品集' ? '作品集 · 嵌入式与电机控制' : `${title} · 作品集`;
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc || '嵌入式系统与电机驱动控制方向作品：自研电机驱动、自制 Linux 开发板、大功率电源、整机控制。')}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(full)}" />
<meta property="og:description" content="${esc(desc || '嵌入式系统与电机驱动控制方向作品：自研电机驱动、自制 Linux 开发板、大功率电源、整机控制。')}" />
<meta property="og:site_name" content="Fluoroantimonic Acid" />
<link rel="stylesheet" href="/assets/styles.css" />
<link rel="preload" href="/assets/fonts/serif-sc-600.woff2" as="font" type="font/woff2" crossorigin />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%231d5b47'/%3E%3Cpath d='M7 22 H15 L19 10 H25' stroke='%23f3f1ea' stroke-width='2.5' fill='none'/%3E%3Ccircle cx='7' cy='22' r='2.5' fill='%23f3f1ea'/%3E%3C/svg%3E" />
<meta name="theme-color" content="#f3f1ea" />
</head>
<body>
<div class="progress" id="progress"></div>
${header(active)}
<main>${body}</main>
${footer()}
<script src="/assets/main.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* projects                                                            */
/* ------------------------------------------------------------------ */

const projects = [];

projects.push({
  slug: 'joint-motor',
  title: '自研关节电机驱动',
  group: 'hardware',
  lede: '面向四足机器人腰椎关节的电机驱动板与控制算法，覆盖功率回路、驱动电路，以及有感、无感两套控制方案。',
  tags: ['功率电子', '电机控制', 'FDCAN'],
  status: '第一版测试完成，第二版迭代中',
  specs: [
    ['主控', 'STM32G431'],
    ['栅极驱动', 'FD6288T'],
    ['功率管', 'HYG080N10LS1C2'],
    ['电流采样', 'G431 内部运放'],
    ['位置反馈', 'MA600 磁编码器'],
    ['总线', 'FDCAN，MIT 模式高频控制'],
    ['应用', '四足机器人腰椎关节'],
  ],
  body: () => `
<div class="dbody">
${dsec('我的工作', `<ul class="mini">
  <li>负责驱动板、电源管理与功率回路设计。</li>
  <li>有感方案：MA600 磁编码器构成三环闭环，支持力位混合与位速混合控制。</li>
  <li>无感方案：开发龙伯格观测器与滑模观测器，先在 MATLAB/Simulink 中仿真验证，再上板。</li>
  <li>通信：FDCAN 运行 MIT 模式高频控制，可实现多电机互联。</li>
</ul>`)}
${dsec('保护与诊断', `<ul class="mini">
  <li>100 ms 看门狗：超时后清除目标并停机，已有的硬件故障保留。</li>
  <li>电压、温度、过流故障锁存，不能被普通使能指令自动清除。</li>
  <li>接收队列默认 16 槽（可配 2–256），软件溢出或帧过期时清除命令并失能。</li>
  <li>诊断计数：丢帧、拒收、错误、过期帧、发送失败，逐项可查。</li>
  <li>VOFA JustFloat 输出 16 路波形，100 Hz 或 1000 Hz，用于现场调参。</li>
</ul>`)}
${dsec('实测范围', `<p>已在实物上验证：电机运行、CAN 控制、四种 MIT 模式（同一台电机逐次修改 ID 测试）。</p>
<p>尚未验证：多台电机同总线、串口波形的实机输出、控制端 SDK 的真实对接。</p>`)}
${dsecC('下一步', `<ul class="todo">
  <li>优化消息流处理，适应高频收发与控制</li>
  <li>完成库的接入文档，便于他人直接调用</li>
  <li>精简为关节电机（有传感器）专用库，去掉无感驱动部分</li>
  <li>优化电机参数辨识流程</li>
  <li>完成电机参数整定文档</li>
</ul>`)}
${dsec('代码与文档', `<ul class="links">
  <li><a href="https://github.com/Fluoro-Antimonic-Acid/Acid_Motor" target="_blank" rel="noopener">Acid_Motor ↗</a></li>
  <li><a href="https://github.com/Fluoro-Antimonic-Acid/Acid_Motor_Library" target="_blank" rel="noopener">Acid_Motor_Library ↗</a></li>
  <li><a href="https://github.com/Fluoro-Antimonic-Acid/Acid_Motor_Doc" target="_blank" rel="noopener">Acid_Motor_Doc ↗</a></li>
</ul>`)}
</div>`,
});

projects.push({
  slug: 'h3-board',
  title: '自制 H3 Linux 开发板',
  group: 'hardware',
  badge: '本站镜像',
  lede: '基于全志 H3 的自制开发板，从原理图、PCB 设计到打样，并完成全部测试。本站的局域网镜像就运行在这块板子上。',
  tags: ['原理图', 'PCB', 'Linux'],
  status: '全部测试完成，常驻运行',
  specs: [
    ['主控', 'Allwinner H3，四核 Cortex-A7'],
    ['内存', '512 MB'],
    ['存储', 'TF 卡 15 GB'],
    ['系统', 'Ubuntu 20.04 LTS'],
    ['架构', 'armv7l（32 位）'],
    ['设计', '原理图与 PCB 自主设计，完成打样'],
  ],
  body: () => `
<div class="dbody">
${dsec('我的工作', `<ul class="mini">
  <li>从原理图、PCB 到打样，全流程自主完成。</li>
  <li>完成全部测试项目，板子常驻运行。</li>
  <li>本站的局域网镜像由板子上的 Caddy 服务直接提供。</li>
</ul>`)}
${dsec('运行环境', `${specTable([
  ['内核', 'Linux 5.4（sunxi）'],
  ['用户态', 'armhf，32 位'],
  ['Web 服务', 'Caddy，纯静态页面'],
])}`)}
${dsecC('板级注意事项', `<ul class="mini">
  <li>512 MB 内存，服务要选轻量的：静态页面 + 一个 Web 服务即可，不跑容器。</li>
  <li>Ubuntu 20.04 为 32 位 armv7 用户态，新版本的预编译二进制需要确认支持。</li>
</ul>`)}
`,
});

projects.push({
  slug: 'dcdc-buckboost',
  title: '大功率 Buck-Boost 电源',
  group: 'hardware',
  lede: '宽输入、宽输出的大功率 Buck-Boost 变换器，同一台设备同时覆盖高压输入和低压大范围输出，满载电流 20 A。',
  tags: ['电源', '数字控制'],
  status: '效率待测量',
  specs: [
    ['拓扑', 'Buck-Boost'],
    ['输入电压', '5 – 80 V'],
    ['输出电压', '1.4 – 100 V'],
    ['满载电流', '20 A'],
    ['控制', 'STM32G474，数字控制'],
    ['效率', '待测量'],
  ],
  body: () => `
<div class="dbody">
${dsec('设计要点', `<ul class="mini">
  <li>输入 5 – 80 V 与输出 1.4 – 100 V 的范围有交叠，同一拓扑需要在升压与降压之间平滑切换，控制环要覆盖两种工况的过渡。</li>
  <li>输出可达 100 V，功率级的器件耐压、走线间距与绝缘按最高电压确定。</li>
  <li>满载 20 A，大电流路径的走线宽度、过孔数量与散热一起考虑。</li>
</ul>`)}
${dsec('控制', `<p>数字控制环由 STM32G474 实现。G4 系列带高分辨率定时器，适合做数字电源的开关波形与闭环控制。</p>`)}
${dsec('测试', `<p>满载电流 20 A 的规格已确定，效率尚未测量。后续计划补充：不同输入、输出电压下的效率曲线，以及满载时的温升。</p>`)}
`,
});

projects.push({
  slug: 'h6-layout',
  title: '全志 H6 Linux 开发板六层 Layout',
  group: 'hardware',
  lede: '负责整板六层 PCB 的布局与布线，覆盖 H6 与 2 GB LPDDR3 的高速信号、电源和接口。',
  tags: ['PCB Layout', '高速布线'],
  status: '布线完成，项目未参与板级调试与 Linux 启动',
  specs: [
    ['主控', 'Allwinner H6'],
    ['内存', '2 GB LPDDR3'],
    ['层数', '6 层'],
    ['接口', 'GPIO · USB · Wi-Fi · eMMC · TF · HDMI'],
  ],
  body: () => `
<div class="dbody">
${dsec('我的工作', `<ul class="mini">
  <li>负责整板六层 PCB 布局与布线。</li>
  <li>关键高速线按阻抗要求布线，DRC 检查无错误。</li>
  <li>覆盖 GPIO、USB、Wi-Fi、eMMC、TF 卡及 HDMI 接口布局。</li>
  <li>核对 LPDDR3 电源引脚定义，修正了原理图中的错误。</li>
</ul>`)}
${dsec('布线重点', `<ul class="mini">
  <li>主控 BGA 出线，按功能模块分区布局。</li>
  <li>DDR 数据与地址线等长，蛇形走线，同组同层，按 2W/3W 规则控制线距。</li>
  <li>主控与 DDR 旁路电容靠近电源引脚，电源平面分割，回流路径完整。</li>
  <li>六层板阻抗按板厂叠层计算，高速线宽与参考平面一致。</li>
</ul>`)}
${dsec('范围说明', `<p>本项目只负责 PCB 布局与布线，没有参与板级调试和 Linux 启动，因此这里不展示系统运行结果。</p>`)}
`,
});

projects.push({
  slug: 'patrol-car',
  title: '智能巡检车',
  group: 'system',
  lede: '巡检小车的下位控制板与电源管理，负责整车供电与底层电机驱动，并通过串口与上位机通信。',
  tags: ['下位机', '电源管理', 'PCB'],
  status: '整车测试通过，相关方案已形成发明专利申请',
  specs: [
    ['主控', 'STM32F407VE'],
    ['驱动', 'PWM 驱动直流电机'],
    ['通信', '串口连接上位机'],
  ],
  body: () => `
<div class="dbody">
${dsec('我的工作', `<ul class="mini">
  <li>设计下位控制板，负责电源管理与 PCB 走线方案。</li>
  <li>通过 PWM 驱动直流电机，并以串口与上位机通信。</li>
  <li>整车运行测试通过。</li>
</ul>`)}
${dsec('专利', `<p>相关方案已形成发明专利申请：《一种巡检机器人自主导航与控制系统及方法》，本人为第一发明人，申请中。</p>`)}
`,
});

projects.push({
  slug: 'omni-car',
  title: '四轮全向轮小车',
  group: 'system',
  lede: '四轮全向底盘的控制板、电源管理与直流电机控制，底盘运动学解算独立完成。',
  tags: ['运动学', '电机控制'],
  specs: [
    ['主控', 'STM32F407VE'],
    ['底盘', '四轮全向'],
    ['驱动', '直流电机'],
  ],
  body: () => `
<div class="dbody">
${dsec('我的工作', `<ul class="mini">
  <li>设计控制板、电源管理与直流电机驱动。</li>
  <li>独立完成四轮全向底盘运动学解算。</li>
  <li>参与整车软硬件联调。</li>
</ul>`)}
${dsec('运动学', `<p>全向轮底盘没有转向机构，整车的平移与旋转完全由四个轮子各自的转速合成。解算把上层给出的 vx、vy、ω 换算为四个轮子的目标转速，再分别驱动四个直流电机。</p>`)}
`,
});

projects.push({
  slug: 'shotdeck',
  title: 'Shotdeck 拍摄台',
  group: 'software',
  lede: '面向尼康 Z30 的开源 Android 应用，通过相机 Wi-Fi 实时取景、遥控拍摄、调节参数，并下载照片。',
  tags: ['Android', 'Kotlin', 'Wi-Fi'],
  status: '自用，开源（GPL-3.0-or-later）· 版本 0.4.6',
  specs: [
    ['平台', 'Android 8.0 及以上（API 26+）'],
    ['语言', 'Kotlin，Jetpack Compose，Material 3'],
    ['相机', 'Nikon Z30（固件 C 1.20）'],
    ['连接', 'Wi-Fi，PTP/IP 协议'],
    ['许可', 'GPL-3.0-or-later'],
  ],
  body: () => `
<div class="dbody">
${dsec('主要功能', `<ul class="mini">
  <li>通过 PTP/IP 与 Z30 建立 Wi-Fi 会话，连接中断时更新状态。</li>
  <li>实时取景，支持展开取景器、横竖屏布局与手动旋转。</li>
  <li>回读机身模式、光圈、快门、ISO，按当前模式与相机返回的档位调节。</li>
  <li>从右侧快门向左拖动展开光圈、快门、ISO 圆弧，松手提交，以相机确认的读数为准。</li>
  <li>浏览机内照片，单张或批量加入下载队列；传输期间使用前台服务与通知。</li>
  <li>JPEG 保存到系统相册，持久化媒体索引，SHA-256 去重，重启后不重复导入。</li>
</ul>`)}
${dsecC('使用流程', `<ol class="ordered">
  <li>在 Z30 上进入「连接至智能设备 → Wi-Fi 连接」，开启相机热点。</li>
  <li>在手机 WLAN 设置中连接相机热点，相机热点没有互联网，出现提示时选择保持连接。</li>
  <li>打开 Shotdeck，进入连接设置并点击「建立连接」，默认地址 192.168.1.1:15740。</li>
  <li>回到拍摄页取景，需要手动曝光时将机身转盘设为 M。</li>
  <li>在「相机照片」选择照片下载，保存完成后可在系统相册中查看。</li>
</ol>`)}
${dsecC('下载位置', `${specTable([
  ['JPEG', 'Pictures/Shotdeck/，系统相册中显示为 Shotdeck'],
  ['NEF 原片', 'Download/Shotdeck/'],
  ['MOV / MP4', 'Movies/Shotdeck/（该分支尚待真机验证）'],
])}`)}
${dsec('验证情况', `<p>0.4.6 版本通过 47 项本地自动化测试，覆盖协议解析、参数选项、取景器交互、下载与保存。</p>
<p>已在 Nikon Z30（C 1.20）与 OPPO Android 16 上完成真机验证：会话建立、文件与缩略图读取、实时取景与部分参数操作。3 张已有 JPEG 迁移到系统相册，逐文件 SHA-256 与原文件一致。</p>`)}
${dsecC('已知限制', `<ul class="mini">
  <li>目前需手动连接相机热点，尚未实现应用内自动配网或 USB 拍摄。</li>
  <li>大文件下载、长时间锁屏传输及 ColorOS 后台限制下的稳定性仍在验证。</li>
  <li>断点续传与进程被系统结束后的任务恢复尚未完成。</li>
  <li>完整镜头型号识别、白平衡、远程手动对焦和视频录制控制尚未实现。</li>
  <li>仅在 Z30 与 OPPO 上验证，其他机型兼容性未知。</li>
</ul>`)}
${dsec('代码与许可', `<ul class="links">
  <li><a href="https://github.com/Fluoro-Antimonic-Acid/Shotdeck" target="_blank" rel="noopener">Shotdeck ↗</a></li>
</ul>
<p style="margin-top:18px">原创代码采用 GNU GPL v3.0 或更新版本。项目是独立开发的第三方工具，与 Nikon 无隶属关系。</p>`)}
`,
});

projects.push({
  slug: 'pcb-fu',
  title: '新年福字 PCB',
  group: 'misc',
  lede: '用嘉立创 EDA 专业版绘制的新年福字 PCB，可使用两层沉金优惠券免费打样。',
  tags: ['PCB', '嘉立创 EDA'],
  specs: [
    ['工具', '嘉立创 EDA 专业版'],
    ['时间', '2025 年 1 月'],
    ['打样', '两层沉金优惠券可免费打印'],
  ],
  body: () => `
<div class="dbody">
${dsec('说明', `<p>用 PCB 做的一张新年福字装饰，图形、板框和丝印都在嘉立创 EDA 专业版里完成。</p>`)}
${dsec('代码与文件', `<ul class="links">
  <li><a href="https://github.com/Fluoro-Antimonic-Acid/PCB-FU" target="_blank" rel="noopener">PCB-FU ↗</a></li>
</ul>`)}
`,
});

/* ------------------------------------------------------------------ */
/* pages                                                               */
/* ------------------------------------------------------------------ */

const groupOrder = ['hardware', 'system', 'software', 'misc'];

function homePage() {
  const featured = ['joint-motor', 'h3-board', 'dcdc-buckboost', 'patrol-car']
    .map((s) => projects.find((p) => p.slug === s))
    .filter(Boolean);

  const body = `
<section class="hero">
  <svg class="pcb" viewBox="0 0 760 520" aria-hidden="true">
    <rect class="chip" x="300" y="190" width="150" height="110" rx="4"/>
    <text class="chip-text" x="318" y="252">STM32</text>
    <path class="trace" d="M20 120 H220 L260 160 H300"/>
    <path class="trace b" d="M740 90 H560 L520 130 H450"/>
    <path class="trace c" d="M60 420 H200 L240 380 V300 H300"/>
    <path class="trace d" d="M450 300 H520 L560 340 H700 L740 380"/>
    <path class="trace" d="M160 40 V80 L180 100 H300"/>
    <path class="trace b" d="M600 460 V400 L570 370 H450"/>
    <circle class="pad" cx="20" cy="120" r="6"/>
    <circle class="pad live" cx="740" cy="90" r="6"/>
    <circle class="pad" cx="60" cy="420" r="6"/>
    <circle class="pad" cx="740" cy="380" r="6"/>
    <circle class="pad live" cx="160" cy="40" r="6"/>
    <circle class="pad" cx="600" cy="460" r="6"/>
  </svg>
  <div class="wrap">
    <p class="eyebrow">Embedded Systems / Motor Control</p>
    <h1>
      <span class="line"><span>做能跑的硬件，</span></span>
      <span class="line"><span>再把它写成固件。</span></span>
      <span class="line"><span>从原理图到板级。</span></span>
    </h1>
    <p class="typed-line"><span id="typed"></span><span class="caret"></span></p>
    <p class="lede">自研电机驱动、自制 Linux 开发板、大功率电源和整机控制。每个项目都有设计说明与测试情况。</p>
    <div class="stats">
      <div><b data-count="${projects.length}">0</b><span>个项目</span></div>
      <div><b data-count="2">0</b><span>块 Linux 板卡设计</span></div>
      <div><b data-count="1">0</b><span>个开源应用</span></div>
      <div><b data-count="4">0</b><span>个方向：电机、板级、电源、整机</span></div>
    </div>
  </div>
  <div class="scroll-hint"><i></i>SCROLL</div>
</section>

<div class="marquee" aria-label="常用技术">
  <div class="mq-track">${STACK.concat(STACK).map((s, i) => `<span${i >= STACK.length ? ' aria-hidden="true"' : ''}>${s}</span>`).join('')}</div>
</div>

<section class="section">
  <div class="wrap">
    <div class="label reveal"><span>01 — 代表项目</span><a href="/projects/">全部作品 →</a></div>
    <ul class="plist reveal">
      ${featured
        .map(
          (p, i) => `<li><a href="/projects/${p.slug}/">
        <span class="n">${String(i + 1).padStart(2, '0')}</span>
        <div><h3>${p.title}${p.badge ? `<span class="badge">${p.badge}</span>` : ''}</h3><p>${p.lede}</p></div>
        <span class="tg">${GROUPS[p.group]}<br>${p.tags.join(' / ')}</span>
      </a></li>`
        )
        .join('')}
    </ul>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="label reveal"><span>02 — 本站</span></div>
    <div class="note-box reveal">
      <p>线上版托管在 GitHub Pages，局域网里还有一份镜像运行在我自制的 H3 开发板上。</p>
      <p>板子从原理图、PCB 到打样和全部测试都是自己完成的，镜像页面由它直接提供。<a href="/projects/h3-board/">板子的运行状态 →</a></p>
    </div>
  </div>
</section>

`;
  return layout({ title: '作品集', active: 'home', body });
}

function projectsIndexPage() {
  const body = `
<section class="page">
  <div class="wrap">
    <div class="label"><span>作品索引</span><span>${projects.length} 项</span></div>
    <h1 class="h2">八个项目，按类别排列。</h1>
    <div class="filters" role="group" aria-label="按类别筛选">
      <button type="button" class="chip" data-filter="all" aria-pressed="true">全部 · ${projects.length}</button>
      ${groupOrder.map((g) => `<button type="button" class="chip" data-filter="${g}" aria-pressed="false">${GROUPS[g]} · ${projects.filter((p) => p.group === g).length}</button>`).join('')}
    </div>
    ${groupOrder
      .map((g) => {
        const items = projects.filter((p) => p.group === g);
        if (!items.length) return '';
        return `<div class="pgroup" data-group="${g}"><div class="label reveal" style="margin-top:72px"><span>${GROUPS[g]}</span><span>${items.length}</span></div>
        <ul class="plist reveal">
          ${items
            .map(
              (p) => `<li><a href="/projects/${p.slug}/">
            <span class="n">${String(projects.indexOf(p) + 1).padStart(2, '0')}</span>
            <div><h3>${p.title}${p.badge ? `<span class="badge">${p.badge}</span>` : ''}</h3><p>${p.lede}</p></div>
            <span class="tg">${p.tags.join(' / ')}</span>
          </a></li>`
            )
            .join('')}
        </ul></div>`;
      })
      .join('')}
  </div>
</section>`;
  return layout({ title: '作品', active: 'projects', body });
}

function projectPage(p, idx) {
  const prev = projects[idx - 1];
  const next = projects[idx + 1];
  const body = `
<section class="page">
  <div class="wrap">
    <p class="crumb"><a href="/projects/">作品</a> / ${GROUPS[p.group]}</p>
    <div class="detail-head">
      <h1>${p.title}${p.badge ? `<span class="badge">${p.badge}</span>` : ''}</h1>
      <p class="lede-big">${p.lede}</p>
      ${p.status ? `<p class="status">${p.status}</p>` : ''}
      <ul class="tagline">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
    </div>
    ${DIAGRAMS[p.slug] ? DIAGRAMS[p.slug]() : ''}
    ${specTable(p.specs)}
    ${p.body()}
    <div class="pager">
      ${prev ? `<a href="/projects/${prev.slug}/">← ${prev.title}</a>` : '<span></span>'}
      ${next ? `<a class="next" href="/projects/${next.slug}/">${next.title} →</a>` : '<span></span>'}
    </div>
  </div>
</section>`;
  return layout({ title: p.title, desc: p.lede, active: 'projects', body });
}

function aboutPage() {
  const tools = [
    ['嵌入式', 'C · STM32 F1 / F4 / G4 · HAL / CubeMX · Keil · CMake · OpenOCD · FreeRTOS'],
    ['通信', 'CAN / FDCAN · SPI · I²C · UART · RS-485'],
    ['电机控制', 'FOC · PID / LADRC · 龙伯格 / 滑模观测器 · MATLAB / Simulink'],
    ['硬件', 'KiCad · Altium Designer · 嘉立创 EDA · 1–6 层 PCB · 高速 Layout'],
    ['电源', 'Buck / Buck-Boost · MOSFET 驱动 · 电源隔离 · 大电流走线与散热'],
    ['软件', 'Linux · Android（Kotlin / Jetpack Compose）'],
  ];
  const body = `
<section class="page">
  <div class="wrap">
    <div class="label"><span>关于</span></div>
    <p class="lead-p">我做嵌入式和电机驱动控制，从功率电路、板级设计一直做到固件和上位机。作品大多是从一块板子开始，做到能跑、能测、能调。</p>
    <div class="label reveal" style="margin-top:96px"><span>常用工具</span></div>
    <ul class="kv reveal">
      ${tools.map(([k, v]) => `<li><span class="k">${k}</span><span>${v}</span></li>`).join('')}
    </ul>
    <div class="label reveal" style="margin-top:96px"><span>关于本站</span></div>
    <ul class="kv reveal">
      <li><span class="k">托管</span><span>线上版托管在 GitHub Pages；局域网镜像运行在自制的 H3 开发板上，由 Caddy 提供。<a href="/projects/h3-board/">板子详情 →</a></span></li>
      <li><span class="k">构建</span><span>无依赖的 Node 脚本生成纯静态 HTML，不依赖前端框架。</span></li>
      <li><span class="k">更新</span><span>${BUILD_DATE}</span></li>
    </ul>
  </div>
</section>`;
  return layout({ title: '关于', active: 'about', body });
}

function contactPage() {
  const body = `
<section class="page">
  <div class="wrap">
    <div class="label"><span>联系</span><span>合作 · 交流</span></div>
    <p class="lead-p">项目合作、技术交流或者硬件设计的需求，发邮件最快。</p>
    <a class="big-mail" href="mailto:${MAIL}">${MAIL}</a>
    <div class="contact-row">
      <a href="${GH}" target="_blank" rel="noopener">GitHub ↗</a>
      <a href="/projects/">查看作品 →</a>
    </div>
  </div>
</section>`;
  return layout({ title: '联系', active: 'contact', body });
}

function notFoundPage() {
  const body = `
<section class="page">
  <div class="wrap">
    <div class="label"><span>404</span></div>
    <h1 class="h2">这个页面不存在。</h1>
    <p class="lead-p"><a href="/">回到首页</a></p>
  </div>
</section>`;
  return layout({ title: '404', active: '', body });
}

/* ------------------------------------------------------------------ */
/* write                                                               */
/* ------------------------------------------------------------------ */

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html, 'utf8');
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync('assets', path.join(OUT, 'assets'), { recursive: true });

write('index.html', homePage());
write(path.join('projects', 'index.html'), projectsIndexPage());
projects.forEach((p, i) => write(path.join('projects', p.slug, 'index.html'), projectPage(p, i)));
write(path.join('about', 'index.html'), aboutPage());
write(path.join('contact', 'index.html'), contactPage());
write('404.html', notFoundPage());

/* ---- serif font subset bookkeeping ---- */
// Collect every non-ASCII character rendered in the serif face, so tools/subset-fonts.py
// can build a small font that covers exactly what the site shows.
{
  const SERIF_RE = /<(h1|h2|h3|h4)\b[^>]*>([\s\S]*?)<\/\1>|class="(?:big-mail|fu)"[^>]*>([^<]*)</g;
  const chars = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) {
        for (const m of fs.readFileSync(p, 'utf8').matchAll(SERIF_RE)) {
          const text = (m[2] || m[3] || '')
            .replace(/<[^>]+>/g, '')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
          for (const c of text) if (c.codePointAt(0) > 0x7e) chars.add(c);
        }
      }
    }
  };
  walk(OUT);
  fs.mkdirSync('tools', { recursive: true });
  fs.writeFileSync(path.join('tools', 'serif-chars.needed.txt'), [...chars].sort().join(''), 'utf8');
  const recorded = path.join('tools', 'serif-chars.txt');
  const have = new Set(fs.existsSync(recorded) ? fs.readFileSync(recorded, 'utf8') : '');
  const missing = [...chars].filter((c) => !have.has(c));
  if (missing.length) {
    console.warn(`serif font subset is missing ${missing.length} characters: ${missing.join('')}`);
    console.warn('  run: .venv-fonts\\Scripts\\python tools\\subset-fonts.py; node build.mjs');
  }
}

console.log(`built ${projects.length + 6} pages -> ${OUT}/`);
