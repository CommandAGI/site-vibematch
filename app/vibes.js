// The sixteen signals of the vibe check (companies/vibematch/README.md), in four groups.
// Each label is written in the locale of the page; nothing is translated at runtime.
export const GROUPS = ["tempo", "taste", "people", "mode"];

export const VIBES = [
  { id: "slow-sunday", group: "tempo", label: { en: "slow sunday", es: "domingo lento", "zh-Hans": "慢星期天" } },
  { id: "city-pace", group: "tempo", label: { en: "city pace", es: "ritmo de ciudad", "zh-Hans": "城市节奏" } },
  { id: "dance-floor", group: "tempo", label: { en: "dance floor", es: "pista de baile", "zh-Hans": "舞池" } },
  { id: "late-drive", group: "tempo", label: { en: "late drive", es: "manejo de madrugada", "zh-Hans": "深夜开车" } },
  { id: "thrift-store", group: "taste", label: { en: "thrift store", es: "tienda de segunda", "zh-Hans": "二手店" } },
  { id: "design-showroom", group: "taste", label: { en: "design showroom", es: "sala de diseño", "zh-Hans": "设计展厅" } },
  { id: "record-crate", group: "taste", label: { en: "record crate", es: "caja de discos", "zh-Hans": "唱片箱" } },
  { id: "bookshop", group: "taste", label: { en: "bookshop", es: "librería", "zh-Hans": "书店" } },
  { id: "small-circle", group: "people", label: { en: "small circle", es: "círculo pequeño", "zh-Hans": "小圈子" } },
  { id: "big-table", group: "people", label: { en: "big table", es: "mesa grande", "zh-Hans": "大圆桌" } },
  { id: "one-to-one", group: "people", label: { en: "one to one", es: "uno a uno", "zh-Hans": "一对一" } },
  { id: "crowd", group: "people", label: { en: "crowd energy", es: "energía de multitud", "zh-Hans": "人群能量" } },
  { id: "make-things", group: "mode", label: { en: "make things", es: "hacer cosas", "zh-Hans": "动手做" } },
  { id: "talk-ideas", group: "mode", label: { en: "talk ideas", es: "hablar de ideas", "zh-Hans": "聊想法" } },
  { id: "go-outside", group: "mode", label: { en: "go outside", es: "salir afuera", "zh-Hans": "出门去" } },
  { id: "stay-in", group: "mode", label: { en: "stay in", es: "quedarse en casa", "zh-Hans": "待在家" } },
];

export const labelOf = (id, locale) => VIBES.find((v) => v.id === id)?.label[locale] ?? id;
