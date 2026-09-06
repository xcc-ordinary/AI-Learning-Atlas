const {
  Plugin,
  PluginSettingTab,
  Setting,
  SecretComponent,
  ItemView,
  Notice,
  TFile,
  MarkdownView,
  normalizePath,
  requestUrl,
} = require("obsidian");
const VIEW = "ai-learning-atlas-view",
  NOTES = "obsidian-vault/01-课程笔记",
  CONCEPTS = "obsidian-vault/02-原子概念",
  TRANSLATIONS = "obsidian-vault/05-AI翻译";
const DEEPSEEK_URL = "https://api.deepseek.com",
  KIMI_URL = "https://api.moonshot.cn/v1",
  TIMEOUT = 30000;
function endpoint(input) {
  const raw = input.trim();
  if (!raw) throw new Error("请填写 API 地址。");
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("API 地址格式不正确，请填写完整地址。");
  }
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("API 地址必须使用 HTTP 或 HTTPS。");
  if (url.username || url.password || url.search || url.hash)
    throw new Error("API 地址不能包含账号、查询参数或锚点。");
  const path = url.pathname.replace(/\/+$/, "");
  url.pathname = path.endsWith("/chat/completions")
    ? path
    : `${path}/chat/completions`;
  return url.toString();
}
function responseText(value) {
  const choices = value && typeof value === "object" ? value.choices : null;
  if (!Array.isArray(choices) || !choices.length)
    throw new Error("AI 服务没有返回翻译结果。");
  const content = choices[0]?.message?.content,
    text =
      typeof content === "string"
        ? content.trim()
        : Array.isArray(content)
          ? content
              .map((x) => (typeof x?.text === "string" ? x.text : ""))
              .join("")
              .trim()
          : "";
  if (!text) throw new Error("AI 服务返回了空内容，请稍后重试。");
  return text;
}
function httpError(status) {
  if (status === 400) return "请求格式不兼容，请检查模型名称和接口类型。";
  if (status === 401 || status === 403)
    return "API Key 无效或没有使用该模型的权限。";
  if (status === 402) return "API 账户余额不足。";
  if (status === 404) return "没有找到接口或模型，请检查地址和模型名称。";
  if (status === 408) return "AI 服务提前终止了请求，请稍后重试。";
  if (status === 429) return "请求过于频繁或额度已用完。";
  if (status >= 500) return "AI 服务暂时不可用，请稍后重试。";
  return `AI 请求失败（HTTP ${status}）。`;
}
const modules = [
  [
    "AI 全景",
    "第 1 周",
    [
      [
        1,
        "人工智能导论与历史",
        "lessons/1-Intro/README.md",
        ["人工智能", "机器学习", "图灵测试"],
      ],
    ],
  ],
  [
    "符号人工智能",
    "第 1 周",
    [
      [
        2,
        "知识表示与专家系统",
        "lessons/2-Symbolic/README.md",
        ["知识表示", "专家系统", "知识图谱"],
      ],
    ],
  ],
  [
    "神经网络基础",
    "第 2–3 周",
    [
      [
        3,
        "感知机",
        "lessons/3-NeuralNetworks/03-Perceptron/README.md",
        ["感知机", "激活函数", "线性分类"],
      ],
      [
        4,
        "多层感知机与自制框架",
        "lessons/3-NeuralNetworks/04-OwnFramework/README.md",
        ["多层感知机", "前向传播", "反向传播"],
      ],
      [
        5,
        "框架与过拟合",
        "lessons/3-NeuralNetworks/05-Frameworks/README.md",
        ["训练循环", "损失函数", "过拟合"],
      ],
    ],
  ],
  [
    "计算机视觉",
    "第 4–6 周",
    [
      [
        6,
        "计算机视觉与 OpenCV",
        "lessons/4-ComputerVision/06-IntroCV/README.md",
        ["像素", "图像滤波", "OpenCV"],
      ],
      [
        7,
        "卷积神经网络",
        "lessons/4-ComputerVision/07-ConvNets/README.md",
        ["卷积", "池化", "特征图"],
      ],
      [
        8,
        "迁移学习",
        "lessons/4-ComputerVision/08-TransferLearning/README.md",
        ["迁移学习", "预训练模型", "微调"],
      ],
      [
        9,
        "自编码器与 VAE",
        "lessons/4-ComputerVision/09-Autoencoders/README.md",
        ["自编码器", "潜空间", "变分推断"],
      ],
      [
        10,
        "GAN 与风格迁移",
        "lessons/4-ComputerVision/10-GANs/README.md",
        ["生成对抗网络", "判别器", "风格迁移"],
      ],
      [
        11,
        "目标检测",
        "lessons/4-ComputerVision/11-ObjectDetection/README.md",
        ["目标检测", "边界框", "交并比"],
      ],
      [
        12,
        "语义分割与 U-Net",
        "lessons/4-ComputerVision/12-Segmentation/README.md",
        ["语义分割", "U-Net", "像素分类"],
      ],
    ],
  ],
  [
    "自然语言处理",
    "第 7–10 周",
    [
      [
        13,
        "文本表示：BoW 与 TF-IDF",
        "lessons/5-NLP/13-TextRep/README.md",
        ["词袋模型", "TF-IDF", "文本向量"],
      ],
      [
        14,
        "词嵌入：Word2Vec 与 GloVe",
        "lessons/5-NLP/14-Embeddings/README.md",
        ["词嵌入", "Word2Vec", "语义空间"],
      ],
      [
        15,
        "语言建模",
        "lessons/5-NLP/15-LanguageModeling/README.md",
        ["语言模型", "上下文窗口", "嵌入训练"],
      ],
      [
        16,
        "循环神经网络",
        "lessons/5-NLP/16-RNN/README.md",
        ["循环神经网络", "隐藏状态", "LSTM"],
      ],
      [
        17,
        "生成式循环网络",
        "lessons/5-NLP/17-GenerativeNetworks/README.md",
        ["序列生成", "采样", "温度参数"],
      ],
      [
        18,
        "Transformer 与 BERT",
        "lessons/5-NLP/18-Transformers/README.md",
        ["注意力机制", "Transformer", "BERT"],
      ],
      [
        19,
        "命名实体识别",
        "lessons/5-NLP/19-NER/README.md",
        ["命名实体识别", "序列标注", "实体"],
      ],
      [
        20,
        "大语言模型与提示编程",
        "lessons/5-NLP/20-LangModels/README.md",
        ["大语言模型", "提示编程", "少样本学习"],
      ],
    ],
  ],
  [
    "其他 AI 方法",
    "第 11 周",
    [
      [
        21,
        "遗传算法",
        "lessons/6-Other/21-GeneticAlgorithms/README.md",
        ["遗传算法", "适应度", "进化搜索"],
      ],
      [
        22,
        "深度强化学习",
        "lessons/6-Other/22-DeepRL/README.md",
        ["强化学习", "奖励函数", "策略"],
      ],
      [
        23,
        "多智能体系统",
        "lessons/6-Other/23-MultiagentSystems/README.md",
        ["多智能体系统", "协作", "涌现"],
      ],
    ],
  ],
  [
    "负责任的 AI",
    "第 12 周",
    [
      [
        24,
        "AI 伦理与负责任 AI",
        "lessons/7-Ethics/README.md",
        ["公平性", "可解释性", "责任边界"],
      ],
    ],
  ],
];
const lessons = modules.flatMap((m, mi) =>
    m[2].map((x) => ({
      n: x[0],
      title: x[1],
      path: x[2],
      concepts: x[3],
      module: m[0],
      week: m[1],
      mi,
    })),
  ),
  safe = (s) => s.replace(/[\\/:*?"<>|]/g, "-"),
  notePath = (l) =>
    normalizePath(
      `${NOTES}/${String(l.n).padStart(2, "0")} ${safe(l.title)}.md`,
    );
const learningStages = [
  {
    code: "00",
    title: "学习准备",
    detail: "环境配置与运行方式",
    path: "lessons/0-course-setup/setup.md",
  },
  { code: "I", title: "人工智能导论", detail: "课程 01", range: [1, 1] },
  { code: "II", title: "符号人工智能", detail: "课程 02", range: [2, 2] },
  { code: "III", title: "神经网络", detail: "课程 03–05", range: [3, 5] },
  { code: "IV", title: "计算机视觉", detail: "课程 06–12", range: [6, 12] },
  { code: "V", title: "自然语言处理", detail: "课程 13–20", range: [13, 20] },
  { code: "VI", title: "其他 AI 方法", detail: "课程 21–23", range: [21, 23] },
  { code: "VII", title: "负责任的 AI", detail: "课程 24", range: [24, 24] },
  {
    code: "IX",
    title: "扩展学习",
    detail: "多模态、CLIP 与 VQGAN",
    path: "lessons/X-Extras/X1-MultiModal/README.md",
  },
];
const cleanHeading = (heading) =>
  heading
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/^\p{Extended_Pictographic}\s*/u, "")
    .trim();
class View extends ItemView {
  constructor(leaf, p) {
    super(leaf);
    this.p = p;
    this.tab = "home";
  }
  getViewType() {
    return VIEW;
  }
  getDisplayText() {
    return "AI Learning Atlas";
  }
  getIcon() {
    return "brain";
  }
  async onOpen() {
    await this.draw();
  }
  async draw() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("atlas");
    const done = await this.p.done(),
      pct = Math.round((done.size / 24) * 100),
      next = lessons.find((l) => !done.has(l.n)) || lessons.at(-1);
    const h = root.createDiv({ cls: "atlas-head" }),
      t = h.createDiv();
    t.createEl("p", { text: "AI FOR BEGINNERS · 12 周", cls: "kicker" });
    t.createEl("h1", { text: "AI 学习驾驶舱" });
    const score = h.createDiv({ cls: "score" });
    score.createEl("strong", { text: `${pct}%` });
    score.createSpan({ text: `${done.size} / 24 课` });
    const bar = root.createDiv({ cls: "bar" });
    bar.createDiv({ attr: { style: `width:${pct}%` } });
    const nav = root.createDiv({ cls: "atlas-nav" });
    [
      ["home", "学习总览"],
      ["course", "课程地图"],
      ["graph", "知识图谱"],
    ].forEach(([id, label]) => {
      const b = nav.createEl("button", {
        text: label,
        cls: this.tab === id ? "on" : "",
      });
      b.onclick = () => {
        this.tab = id;
        this.draw();
      };
    });
    if (this.tab === "home") this.home(root, done, next, pct);
    if (this.tab === "course") await this.course(root, done);
    if (this.tab === "graph") this.graph(root, done);
  }
  home(root, done, next, pct) {
    const hero = root.createDiv({ cls: "hero" }),
      c = hero.createDiv();
    c.createEl("p", { text: "下一里程碑", cls: "kicker" });
    c.createEl("h2", { text: next.title });
    c.createEl("p", { text: `${next.module} · ${next.week}` });
    const b = hero.createEl("button", { text: "进入学习工作台 →" });
    b.onclick = () => this.p.workspace(next);
    const stats = root.createDiv({ cls: "stats" });
    [
      ["课程进度", `${pct}%`],
      ["当前阶段", next.module],
      ["已点亮概念", `${done.size * 3}`],
      ["AI 翻译", this.p.aiReady() ? this.p.settings.model : "待配置"],
    ].forEach(([a, v]) => {
      const x = stats.createDiv();
      x.createSpan({ text: a });
      x.createEl("strong", { text: v });
    });
    root.createEl("h2", { text: "12 周认知路线", cls: "section-title" });
    const road = root.createDiv({ cls: "road" });
    modules.forEach((m, i) => {
      const count = m[2].filter((x) => done.has(x[0])).length,
        n = road.createEl("button", {
          cls: count === m[2].length ? "finished" : "",
        });
      n.createSpan({ text: String(i + 1).padStart(2, "0") });
      n.createEl("strong", { text: m[0] });
      n.createEl("small", { text: `${count}/${m[2].length} · ${m[1]}` });
      n.onclick = () => {
        this.tab = "course";
        this.draw();
      };
      if (i < modules.length - 1) road.createDiv({ cls: "link" });
    });
    const panels = root.createDiv({ cls: "panels" }),
      loop = panels.createDiv({ cls: "panel" });
    loop.createEl("h3", { text: "每课学习闭环" });
    [
      "带着三个问题阅读",
      "运行并主动修改代码",
      "闭卷写三句话复述",
      "连接前置课与概念",
    ].forEach((x, i) => {
      const r = loop.createDiv({ cls: "loop" });
      r.createEl("b", { text: `0${i + 1}` });
      r.createSpan({ text: x });
    });
    const conn = panels.createDiv({ cls: "panel" });
    conn.createEl("h3", { text: "AI 翻译与知识连接" });
    next.concepts.forEach((x) => {
      const q = conn.createEl("button", { text: x, cls: "chip" });
      q.onclick = () => this.p.concept(x, next);
    });
    const ai = conn.createEl("button", {
      text: this.p.aiReady()
        ? "AI 翻译已就绪 · 打开设置"
        : "配置自主大模型翻译",
      cls: "wide",
    });
    ai.onclick = () => this.p.openSettings();
    const hub = conn.createEl("button", {
      text: "生成知识图谱笔记",
      cls: "wide subtle",
    });
    hub.onclick = () => this.p.hub();
  }
  course(root, done) {
    const info = root.createDiv({ cls: "course-intro" });
    info.createEl("h2", { text: "完整课程地图" });
    info.createEl("p", {
      text: "点击“学习工作台”，左侧教材、右侧笔记；笔记完成四项任务后进度自动更新。",
    });
    modules.forEach((m) => {
      const box = root.createEl("section", { cls: "module" }),
        head = box.createDiv({ cls: "module-head" });
      head.createEl("h3", { text: m[0] });
      head.createSpan({ text: m[1] });
      m[2].forEach((raw) => {
        const l = lessons.find((x) => x.n === raw[0]),
          ok = done.has(l.n),
          row = box.createDiv({ cls: `lesson ${ok ? "finished" : ""}` }),
          check = row.createEl("button", {
            text: ok ? "✓" : String(l.n).padStart(2, "0"),
            cls: "check",
          });
        check.onclick = async () => {
          await this.p.complete(l, !ok);
          this.draw();
        };
        const text = row.createDiv();
        text.createEl("strong", { text: l.title });
        const tags = text.createDiv({ cls: "tags" });
        l.concepts.forEach((x) => tags.createSpan({ text: x }));
        const work = row.createEl("button", {
          text: "学习工作台",
          cls: "work",
        });
        work.onclick = () => this.p.workspace(l);
      });
    });
  }
  graph(root, done) {
    const intro = root.createDiv({ cls: "graph-intro" });
    intro.createEl("h2", { text: "知识不是列表，而是一张逐渐点亮的地图" });
    intro.createEl("p", {
      text: "课程节点负责学习顺序，概念节点负责跨章节连接。点击任意节点继续学习。",
    });
    const graph = root.createDiv({ cls: "graph" });
    modules.forEach((m) => {
      const g = graph.createDiv({ cls: "graph-group" });
      g.createEl("small", { text: m[1] });
      g.createEl("h3", { text: m[0] });
      const ns = g.createDiv({ cls: "nodes" });
      m[2].forEach((raw) => {
        const l = lessons.find((x) => x.n === raw[0]),
          b = ns.createEl("button", {
            text: String(l.n),
            cls: done.has(l.n) ? "lit" : "",
          });
        b.onclick = () => this.p.workspace(l);
      });
      const cs = g.createDiv({ cls: "concepts" });
      [...new Set(m[2].flatMap((x) => x[3]))].slice(0, 6).forEach((x) => {
        const b = cs.createEl("button", { text: x });
        b.onclick = () =>
          this.p.concept(
            x,
            lessons.find((l) => l.concepts.includes(x)),
          );
      });
    });
    const b = root.createEl("button", {
      text: "在笔记中打开完整知识图谱",
      cls: "graph-button",
    });
    b.onclick = () => this.p.hub();
  }
}

View.prototype.home = function (root, done, next, pct) {
  const hero = root.createDiv({ cls: "hero" }),
    copy = hero.createDiv();
  copy.createEl("span", {
    text: `下一课 · ${String(next.n).padStart(2, "0")}`,
    cls: "eyebrow",
  });
  copy.createEl("h2", { text: next.title });
  copy.createEl("p", {
    text: `${next.module} · ${next.week} · ${next.concepts.join(" / ")}`,
  });
  const actions = hero.createDiv({ cls: "hero-actions" }),
    start = actions.createEl("button", { text: "继续学习", cls: "primary" });
  start.onclick = () => this.p.workspace(next);
  const facts = root.createDiv({ cls: "facts" });
  [
    [`${done.size}/24`, `已完成`],
    [`${24 - done.size}`, `剩余课程`],
    [`第 ${String(next.n).padStart(2, "0")} 课`, `当前位置`],
  ].forEach(([value, label]) => {
    const item = facts.createDiv();
    item.createEl("strong", { text: value });
    item.createSpan({ text: label });
  });
  const heading = root.createDiv({ cls: "section-head" });
  heading.createEl("h2", { text: "完整学习路径" });
  heading.createSpan({ text: "依据项目官方课程表" });
  const road = root.createDiv({ cls: "road" });
  learningStages.forEach((stage) => {
    const stageLessons = stage.range
        ? lessons.filter((l) => l.n >= stage.range[0] && l.n <= stage.range[1])
        : [],
      completed = stageLessons.filter((l) => done.has(l.n)).length,
      current =
        stage.range && next.n >= stage.range[0] && next.n <= stage.range[1],
      node = road.createEl("button", {
        cls: `${stageLessons.length && completed === stageLessons.length ? "finished" : ""} ${current ? "current" : ""}`,
      });
    node.createSpan({ text: stage.code, cls: "stage-code" });
    const copy = node.createDiv({ cls: "stage-copy" });
    copy.createEl("strong", { text: stage.title });
    copy.createEl("small", { text: stage.detail });
    const status = node.createDiv({ cls: "stage-status" });
    if (stageLessons.length) {
      const dots = status.createDiv({ cls: "stage-dots" });
      stageLessons.forEach((lesson) =>
        dots.createSpan({ cls: done.has(lesson.n) ? "done" : "" }),
      );
      status.createEl("b", { text: `${completed}/${stageLessons.length}` });
    } else status.createEl("b", { text: "打开" });
    node.onclick = async () => {
      if (stage.path) return this.p.openPath(stage.path);
      this.tab = "course";
      await this.draw();
      document
        .querySelector(`[data-stage="${stage.code}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
};

View.prototype.course = async function (root, done) {
  const heading = root.createDiv({ cls: "course-heading" });
  heading.createEl("h2", { text: "课程" });
  heading.createEl("p", {
    text: "选择课程开始学习；展开目录可直接定位到教材章节。",
  });
  const timeline = root.createDiv({ cls: "timeline" });
  const sectionMap = new Map(
    await Promise.all(
      lessons.map(async (l) => [l.n, await this.p.lessonSections(l)]),
    ),
  );
  modules.forEach((m, moduleIndex) => {
    const group = timeline.createEl("section", { cls: "timeline-group" }),
      marker = group.createDiv({ cls: "timeline-marker" });
    group.dataset.stage = ["I", "II", "III", "IV", "V", "VI", "VII"][
      moduleIndex
    ];
    marker.createSpan({ text: String(moduleIndex + 1).padStart(2, "0") });
    const body = group.createDiv({ cls: "timeline-body" }),
      head = body.createDiv({ cls: "timeline-head" });
    const title = head.createDiv();
    title.createEl("h3", { text: m[0] });
    title.createSpan({ text: m[1] });
    head.createEl("b", {
      text: `${m[2].filter((x) => done.has(x[0])).length}/${m[2].length}`,
    });
    m[2].forEach((raw) => {
      const l = lessons.find((x) => x.n === raw[0]),
        ok = done.has(l.n),
        item = body.createDiv({ cls: `lesson-item ${ok ? "finished" : ""}` }),
        row = item.createDiv({ cls: "lesson-row" }),
        check = row.createEl("button", {
          text: ok ? "✓" : String(l.n).padStart(2, "0"),
          cls: "check",
        });
      check.onclick = async () => {
        await this.p.complete(l, !ok);
        this.draw();
      };
      const copy = row.createDiv({ cls: "lesson-copy" });
      copy.createEl("strong", { text: l.title });
      copy.createEl("span", { text: l.concepts.join(" · ") });
      const actions = row.createDiv({ cls: "lesson-actions" }),
        study = actions.createEl("button", { text: "开始", cls: "study" });
      study.onclick = () => this.p.workspace(l);
      const sections = sectionMap.get(l.n) || [];
      if (sections.length) {
        const directory = item.createEl("details", { cls: "lesson-directory" }),
          summary = directory.createEl("summary");
        summary.createSpan({ text: "章节目录" });
        summary.createEl("small", { text: `${sections.length} 节` });
        const links = directory.createDiv({ cls: "directory-links" });
        sections.forEach((section, index) => {
          const link = links.createEl("button", {
            cls: `directory-link depth-${section.level}`,
          });
          link.createSpan({
            text: section.level === 2 ? String(index + 1).padStart(2, "0") : "",
          });
          link.createEl("b", { text: section.heading });
          link.onclick = () => this.p.jumpToSection(l, section.heading);
        });
      }
    });
  });
};

module.exports = class Atlas extends Plugin {
  async onload() {
    this.data = Object.assign({ manual: [], ai: {} }, await this.loadData());
    this.settings = Object.assign(
      {
        provider: "disabled",
        deepSeekModel: "deepseek-v4-flash",
        deepSeekSecretId: "",
        kimiModel: "kimi-k2.6",
        kimiSecretId: "",
        customBaseUrl: "",
        customModel: "",
        customSecretId: "",
        targetLanguage: "简体中文",
        outputMode: "bilingual",
        systemPrompt:
          "你是一位精确的 AI 课程翻译助手。保留 Markdown 结构、代码块、公式、链接和专业术语；不要添加原文没有的内容。",
      },
      this.data.ai || {},
    );
    await this.migratePlaintextKey();
    if (this.data.completed && !this.data.manual.length)
      this.data.manual = this.data.completed;
    this.registerView(VIEW, (l) => new View(l, this));
    this.addRibbonIcon("brain", "AI 学习驾驶舱", () => this.open());
    this.addCommand({
      id: "open-atlas",
      name: "打开学习驾驶舱",
      callback: () => this.open(),
    });
    this.addCommand({
      id: "translate-selection",
      name: "AI 翻译选中文本",
      editorCallback: (editor) => this.translateSelection(editor),
    });
    this.addCommand({
      id: "translate-note",
      name: "AI 翻译当前整篇笔记",
      editorCallback: (editor) => this.translateDocument(editor),
    });
    this.addSettingTab(new AtlasSettingTab(this.app, this));
    const refresh = () => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.refresh(), 150);
    };
    this.registerEvent(this.app.vault.on("modify", refresh));
    this.registerEvent(this.app.vault.on("create", refresh));
    this.registerEvent(this.app.metadataCache.on("changed", refresh));
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () =>
        this.attachTranslationBar(),
      ),
    );
    this.app.workspace.onLayoutReady(() => this.attachTranslationBar());
  }
  onunload() {
    clearTimeout(this.timer);
    document
      .querySelectorAll(".atlas-translate-bar")
      .forEach((x) => x.remove());
    this.app.workspace.detachLeavesOfType(VIEW);
  }
  async open() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }
  async refresh() {
    for (const l of this.app.workspace.getLeavesOfType(VIEW))
      if (l.view instanceof View) await l.view.draw();
    this.attachTranslationBar();
  }
  aiReady() {
    this.settings.model = this.providerLabel();
    return this.settings.provider !== "disabled";
  }
  providerLabel() {
    return {
      disabled: "待配置",
      deepseek: this.settings.deepSeekModel,
      kimi: this.settings.kimiModel,
      "openai-compatible": this.settings.customModel || "自定义模型",
    }[this.settings.provider];
  }
  openSettings() {
    this.app.setting.open();
    this.app.setting.openTabById(this.manifest.id);
  }
  async saveSettings() {
    this.settings.model = this.providerLabel();
    this.data.ai = this.settings;
    await this.saveData(this.data);
    await this.refresh();
  }
  async migratePlaintextKey() {
    const old = this.settings.apiKey;
    if (!old) return;
    const id = "ai-learning-atlas-migrated-key";
    if (this.app.secretStorage?.setSecret) {
      this.app.secretStorage.setSecret(id, old);
      this.settings.customSecretId = id;
      this.settings.provider = "openai-compatible";
      this.settings.customBaseUrl = this.settings.endpoint || "";
      this.settings.customModel = this.settings.model || "";
      delete this.settings.apiKey;
      delete this.settings.endpoint;
      delete this.settings.model;
      await this.saveSettings();
    }
  }
  resolveAI() {
    const s = this.settings;
    if (s.provider === "disabled")
      throw new Error("翻译尚未启用，请先选择服务。");
    let base, model, secretId, label;
    if (s.provider === "deepseek") {
      base = DEEPSEEK_URL;
      model = s.deepSeekModel;
      secretId = s.deepSeekSecretId;
      label = "DeepSeek";
    } else if (s.provider === "kimi") {
      base = KIMI_URL;
      model = s.kimiModel;
      secretId = s.kimiSecretId;
      label = "Kimi";
    } else {
      base = s.customBaseUrl;
      model = s.customModel.trim();
      secretId = s.customSecretId;
      label = "自定义服务";
      if (!model) throw new Error("请填写模型名称。");
    }
    if (!secretId) throw new Error(`请选择或创建${label} API Key 安全凭据。`);
    const apiKey = this.app.secretStorage?.getSecret(secretId);
    if (!apiKey?.trim()) throw new Error(`${label} API Key 安全凭据不存在。`);
    return {
      provider: s.provider,
      url: endpoint(base),
      model,
      apiKey: apiKey.trim(),
    };
  }
  async callAI(text) {
    const c = this.resolveAI(),
      body = {
        model: c.model,
        messages: [
          { role: "system", content: this.settings.systemPrompt },
          {
            role: "user",
            content: `请将以下内容翻译为${this.settings.targetLanguage}。只输出译文：\n\n${text}`,
          },
        ],
        stream: false,
        max_tokens: 4096,
      };
    if (c.provider === "deepseek" || c.provider === "kimi")
      body.thinking = { type: "disabled" };
    let timer;
    const timeout = new Promise(
      (_, reject) =>
        (timer = setTimeout(
          () => reject(new Error("AI 请求超过 30 秒，请检查网络或稍后重试。")),
          TIMEOUT,
        )),
    );
    let response;
    try {
      response = await Promise.race([
        requestUrl({
          url: c.url,
          method: "POST",
          contentType: "application/json",
          headers: { Authorization: `Bearer ${c.apiKey}` },
          body: JSON.stringify(body),
          throw: false,
        }),
        timeout,
      ]);
    } catch (e) {
      if (e.message?.includes("超过 30 秒")) throw e;
      throw new Error("无法连接 AI 服务，请检查网络、API 地址或代理节点。", {
        cause: e,
      });
    } finally {
      clearTimeout(timer);
    }
    if (response.status < 200 || response.status >= 300)
      throw new Error(httpError(response.status));
    return responseText(response.json);
  }
  async translateChunks(text) {
    const chunks = [];
    for (let i = 0; i < text.length; i += 6000)
      chunks.push(text.slice(i, i + 6000));
    const out = [];
    for (let i = 0; i < chunks.length; i++) {
      new Notice(`AI 翻译中 ${i + 1}/${chunks.length}`);
      out.push(await this.callAI(chunks[i]));
    }
    return out.join("\n\n");
  }
  async translateSelection(editor) {
    const text = editor.getSelection();
    if (!text.trim()) {
      new Notice("请先选择要翻译的文本");
      return;
    }
    try {
      const translated = await this.translateChunks(text),
        value =
          this.settings.outputMode === "replace"
            ? translated
            : `${text}\n\n> [!translation]- AI 翻译 · ${this.settings.targetLanguage}\n${translated
                .split("\n")
                .map((x) => `> ${x}`)
                .join("\n")}`;
      editor.replaceSelection(value);
      new Notice("翻译完成");
    } catch (e) {
      new Notice(`翻译失败：${e.message}`, 8000);
    }
  }
  absolutizeLinks(text, file) {
    const base = file.parent?.path || "";
    return text.replace(
      /(!?\[[^\]]*\]\()([^\s)]+)(\))/g,
      (all, start, url, end) => {
        if (/^(https?:|data:|obsidian:|#|\/)/i.test(url)) return all;
        return `${start}${normalizePath(`${base}/${url}`)}${end}`;
      },
    );
  }
  async translateDocument(editor) {
    const source = editor.getValue(),
      active = this.app.workspace.getActiveViewOfType(MarkdownView)?.file;
    if (!source.trim() || !active) {
      new Notice("请先打开一篇 Markdown 笔记");
      return;
    }
    try {
      const translated = await this.translateChunks(
        this.absolutizeLinks(source, active),
      );
      await this.folder(TRANSLATIONS);
      const path = normalizePath(
          `${TRANSLATIONS}/${safe(active.basename)} · ${safe(this.settings.targetLanguage)}.md`,
        ),
        content = `---\ntype: ai-translation\nsource: "[[${active.path.replace(/\.md$/, "")}]]"\nmodel: "${this.settings.model.replace(/"/g, "'")}"\ntarget: "${this.settings.targetLanguage.replace(/"/g, "'")}"\ntags: [ai-learning/translation]\n---\n\n# ${active.basename} · ${this.settings.targetLanguage}\n\n> [!info] AI 翻译\n> 由 ${this.settings.model} 生成，请结合原文核对专业术语。\n\n${translated}\n`;
      let file = this.app.vault.getAbstractFileByPath(path);
      file instanceof TFile
        ? await this.app.vault.modify(file, content)
        : (file = await this.app.vault.create(path, content));
      await this.app.workspace.getLeaf("tab").openFile(file);
      new Notice("整篇译文已保存为独立笔记");
    } catch (e) {
      new Notice(`翻译失败：${e.message}`, 8000);
    }
  }
  attachTranslationBar() {
    document
      .querySelectorAll(".atlas-translate-bar")
      .forEach((x) => x.remove());
    const view = this.app.workspace.getActiveViewOfType(MarkdownView),
      file = view?.file;
    if (
      !view ||
      !file ||
      (!file.path.startsWith("lessons/") &&
        !file.path.startsWith("obsidian-vault/"))
    )
      return;
    const bar = view.contentEl.createDiv({ cls: "atlas-translate-bar" });
    bar.createSpan({ text: "AI" });
    const selection = bar.createEl("button", { text: "翻译选中" }),
      settings = bar.createEl("button", { text: "设置", cls: "icon-button" });
    selection.onclick = () => this.translateSelection(view.editor);
    settings.onclick = () => this.openSettings();
  }
  async translateLesson(lesson) {
    const file = this.app.vault.getAbstractFileByPath(lesson.path);
    if (!(file instanceof TFile)) {
      new Notice(`找不到 ${lesson.path}`);
      return;
    }
    await this.app.workspace.getLeaf(false).openFile(file);
    this.attachTranslationBar();
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) await this.translateDocument(view.editor);
  }
  async folder(path) {
    if (!this.app.vault.getAbstractFileByPath(path))
      await this.app.vault.createFolder(path);
  }
  async done() {
    const d = new Set(this.data.manual || []);
    for (const l of lessons) {
      const f = this.app.vault.getAbstractFileByPath(notePath(l));
      if (f instanceof TFile) {
        const s = await this.app.vault.cachedRead(f),
          checks = (s.match(/^- \[x\]/gim) || []).length;
        if (/^status:\s*(completed|done)/im.test(s) || checks >= 4) d.add(l.n);
      }
    }
    return d;
  }
  async complete(l, value) {
    const d = new Set(this.data.manual || []);
    value ? d.add(l.n) : d.delete(l.n);
    this.data.manual = [...d];
    await this.saveData(this.data);
    const f = this.app.vault.getAbstractFileByPath(notePath(l));
    if (f instanceof TFile)
      await this.app.fileManager.processFrontMatter(
        f,
        (x) => (x.status = value ? "completed" : "learning"),
      );
    await this.refresh();
  }
  async lesson(l) {
    const f = this.app.vault.getAbstractFileByPath(l.path);
    if (f instanceof TFile) await this.app.workspace.getLeaf(false).openFile(f);
    else new Notice(`找不到 ${l.path}`);
  }
  async openPath(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile)
      await this.app.workspace.getLeaf(false).openFile(file);
    else new Notice(`找不到 ${path}`);
  }
  async lessonSections(l) {
    const file = this.app.vault.getAbstractFileByPath(l.path);
    if (!(file instanceof TFile)) return [];
    const cache = this.app.metadataCache.getFileCache(file),
      cached = cache?.headings
        ?.filter((h) => h.level === 2 || h.level === 3)
        .map((h) => ({ heading: cleanHeading(h.heading), level: h.level }));
    if (cached?.length) return cached;
    const text = await this.app.vault.cachedRead(file);
    return [...text.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((m) => ({
      level: m[1].length,
      heading: cleanHeading(m[2]),
    }));
  }
  async jumpToSection(l, heading) {
    const target = `${l.path.replace(/\.md$/i, "")}#${heading}`;
    await this.app.workspace.openLinkText(target, l.path, false);
    this.attachTranslationBar();
  }
  async workspace(l) {
    const source = this.app.vault.getAbstractFileByPath(l.path);
    if (!(source instanceof TFile)) {
      new Notice(`找不到 ${l.path}`);
      return;
    }
    const note = await this.ensureNote(l);
    let left =
      this.app.workspace
        .getLeavesOfType("markdown")
        .find((x) => x.view.file?.path === l.path) ||
      this.app.workspace.getLeaf("tab");
    await left.openFile(source);
    let right = this.app.workspace
      .getLeavesOfType("markdown")
      .find((x) => x.view.file?.path === note.path);
    if (!right) {
      right = this.app.workspace.createLeafBySplit(left, "vertical");
      await right.openFile(note);
    }
    this.app.workspace.setActiveLeaf(right, { focus: true });
    this.attachTranslationBar();
  }
  async ensureNote(l) {
    await this.folder(NOTES);
    const path = notePath(l);
    let file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) return file;
    const prev = lessons[l.n - 2],
      next = lessons[l.n],
      questions = [
        `${l.concepts[0]}解决的核心问题是什么？`,
        `${l.concepts[1]}和${l.concepts[0]}是什么关系？`,
        `如果改变${l.concepts[2]}，结果会怎样？`,
      ];
    const content = `---\ntype: lesson\nlesson: ${l.n}\nmodule: ${l.module}\nstatus: learning\ntags: [ai-learning/lesson]\n---\n\n# ${String(l.n).padStart(2, "0")} · ${l.title}\n\n[[${l.path.replace(/\.md$/, "")}|打开教材]] · ${prev ? `[[${notePath(prev).replace(/\.md$/, "")}|上一课]]` : "起点"} · ${next ? `[[${notePath(next).replace(/\.md$/, "")}|下一课]]` : "最后一课"}\n\n## 先回答\n\n${questions.map((q, i) => `${i + 1}. ${q}\n   - `).join("\n")}\n\n## 我的理解\n\n> 用自己的话写，不复制教材。\n\n\n## 实验结论\n\n- 我运行/修改了：\n- 结果是：\n- 原因是：\n\n## 卡点\n\n- 我不明白：\n- 已尝试：\n\n## 核心概念\n\n${l.concepts.map((x) => `- [[${CONCEPTS}/${x}|${x}]]`).join("\n")}\n\n## 完成\n\n- [ ] 回答三个问题\n- [ ] 运行或修改一个示例\n- [ ] 写出实验结论\n- [ ] 用自己的话总结本课\n`;
    file = await this.app.vault.create(path, content);
    return file;
  }
  async concept(name, l) {
    await this.folder(CONCEPTS);
    const path = normalizePath(`${CONCEPTS}/${safe(name)}.md`);
    let f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile))
      f = await this.app.vault.create(
        path,
        `---\ntype: concept\nstatus: seed\ntags: [ai-learning/concept]\n---\n# ${name}\n\n## 一句话解释\n\n## 它解决什么问题\n\n## 最小例子\n\n## 容易混淆\n- 与 [[]] 的区别：\n\n## 来自课程\n- [[${notePath(l).replace(/\.md$/, "")}|${l.title}]]\n\n## 前置与后续\n- 前置：[[]]\n- 后续：[[]]\n`,
      );
    await this.app.workspace.getLeaf(false).openFile(f);
  }
  async hub() {
    await this.folder("obsidian-vault");
    const done = await this.done(),
      path = "obsidian-vault/AI 知识图谱.md",
      body = modules
        .map(
          (m, i) =>
            `## ${i + 1}. ${m[0]}\n${m[2]
              .map((raw) => {
                const l = lessons.find((x) => x.n === raw[0]);
                return `- ${done.has(l.n) ? "✅" : "⬜"} [[${notePath(l).replace(/\.md$/, "")}|${l.title}]] → ${l.concepts.map((x) => `[[${CONCEPTS}/${x}|${x}]]`).join(" · ")}`;
              })
              .join("\n")}`,
        )
        .join("\n\n"),
      content = `---\ntype: moc\ntags: [ai-learning, knowledge-map]\n---\n# AI 知识图谱\n\n> 课程负责顺序，概念负责连接。\n\n${body}\n\n## 跨模块连接\n- [[知识表示]] ↔ [[词嵌入]]：符号表示与分布式表示\n- [[感知机]] → [[卷积]] → [[注意力机制]]：特征学习架构的演进\n- [[语言模型]] ↔ [[大语言模型]]：预测目标与规模化\n- [[奖励函数]] ↔ [[责任边界]]：优化目标与价值约束\n`;
    let f = this.app.vault.getAbstractFileByPath(path);
    f instanceof TFile
      ? await this.app.vault.modify(f, content)
      : (f = await this.app.vault.create(path, content));
    await this.app.workspace.getLeaf(false).openFile(f);
  }
};

class AtlasSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this,
      s = this.plugin.settings;
    containerEl.empty();
    containerEl.createEl("h2", { text: "AI Learning Atlas · 大模型翻译" });
    containerEl.createEl("p", {
      text: "沿用 ListenBand 的服务商适配、安全凭据、超时和错误处理逻辑。",
      cls: "setting-item-description",
    });
    new Setting(containerEl)
      .setName("翻译服务")
      .setDesc("选择官方服务或 OpenAI 兼容接口。")
      .addDropdown((d) =>
        d
          .addOption("disabled", "关闭")
          .addOption("deepseek", "DeepSeek 官方")
          .addOption("kimi", "Kimi 官方")
          .addOption("openai-compatible", "OpenAI 兼容服务")
          .setValue(s.provider)
          .onChange(async (v) => {
            s.provider = v;
            await this.plugin.saveSettings();
            this.display();
          }),
      );
    if (s.provider === "deepseek") {
      new Setting(containerEl).setName("DeepSeek 模型").addDropdown((d) =>
        d
          .addOption("deepseek-v4-flash", "DeepSeek V4 Flash")
          .addOption("deepseek-v4-pro", "DeepSeek V4 Pro")
          .setValue(s.deepSeekModel)
          .onChange(async (v) => {
            s.deepSeekModel = v;
            await this.plugin.saveSettings();
          }),
      );
      this.secret(containerEl, "DeepSeek API Key", "deepSeekSecretId");
    }
    if (s.provider === "kimi") {
      new Setting(containerEl).setName("Kimi 模型").addDropdown((d) =>
        d
          .addOption("kimi-k2.6", "Kimi K2.6")
          .setValue(s.kimiModel)
          .onChange(async (v) => {
            s.kimiModel = v;
            await this.plugin.saveSettings();
          }),
      );
      this.secret(containerEl, "Kimi API Key", "kimiSecretId");
    }
    if (s.provider === "openai-compatible") {
      new Setting(containerEl)
        .setName("API 地址")
        .setDesc(
          "可填基础地址或完整 /chat/completions 地址；本地服务允许 HTTP。",
        )
        .addText((t) =>
          t
            .setPlaceholder("https://example.com/v1")
            .setValue(s.customBaseUrl)
            .onChange(async (v) => {
              s.customBaseUrl = v.trim();
              await this.plugin.saveSettings();
            }),
        );
      new Setting(containerEl).setName("模型名称").addText((t) =>
        t
          .setPlaceholder("模型 ID")
          .setValue(s.customModel)
          .onChange(async (v) => {
            s.customModel = v.trim();
            await this.plugin.saveSettings();
          }),
      );
      this.secret(containerEl, "API Key 安全凭据", "customSecretId");
    }
    new Setting(containerEl).setName("目标语言").addText((t) =>
      t.setValue(this.plugin.settings.targetLanguage).onChange(async (v) => {
        this.plugin.settings.targetLanguage = v || "简体中文";
        await this.plugin.saveSettings();
      }),
    );
    new Setting(containerEl).setName("输出方式").addDropdown((d) =>
      d
        .addOption("bilingual", "保留原文并追加译文")
        .addOption("replace", "用译文替换原文")
        .setValue(this.plugin.settings.outputMode)
        .onChange(async (v) => {
          this.plugin.settings.outputMode = v;
          await this.plugin.saveSettings();
        }),
    );
    new Setting(containerEl)
      .setName("翻译系统提示词")
      .setDesc("可按课程、术语习惯和输出风格调整。")
      .addTextArea((t) => {
        t.inputEl.rows = 6;
        t.inputEl.addClass("atlas-prompt");
        t.setValue(this.plugin.settings.systemPrompt).onChange(async (v) => {
          this.plugin.settings.systemPrompt = v;
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName("测试连接")
      .setDesc("发送一条极短请求，确认接口、模型和密钥可用。")
      .addButton((b) =>
        b
          .setButtonText("测试")
          .setCta()
          .onClick(async () => {
            b.setDisabled(true);
            b.setButtonText("连接中…");
            try {
              const out = await this.plugin.callAI(
                "Artificial intelligence helps computers solve problems.",
              );
              new Notice(`连接成功：${out.slice(0, 80)}`, 6000);
            } catch (e) {
              new Notice(`连接失败：${e.message}`, 8000);
            } finally {
              b.setDisabled(false);
              b.setButtonText("测试");
            }
          }),
      );
  }
  secret(container, name, key) {
    const setting = new Setting(container)
      .setName(name)
      .setDesc(
        "选择已有安全凭据，或在控件中创建新凭据；插件配置只记录凭据名称。",
      );
    new SecretComponent(this.app, setting.controlEl)
      .setValue(this.plugin.settings[key])
      .onChange(async (value) => {
        this.plugin.settings[key] = value;
        await this.plugin.saveSettings();
      });
  }
}
