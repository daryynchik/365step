/** Field ids and titles only — safe to import in the browser. */

export type FieldId = "medicine" | "engineering" | "cs" | "business" | "social" | "science" | "undecided";

export const FIELD_OPTIONS: { id: FieldId; title: string; hint: string }[] = [
  { id: "medicine", title: "Медицина и биология", hint: "медицина, биология, фармацевтика" },
  { id: "engineering", title: "Инженерия", hint: "механика, строительство, энергетика" },
  { id: "cs", title: "IT и компьютерные науки", hint: "программирование, данные, ИИ" },
  { id: "business", title: "Бизнес и экономика", hint: "экономика, финансы, менеджмент" },
  { id: "social", title: "Социальные и гуманитарные", hint: "психология, право, история, IR" },
  { id: "science", title: "Естественные науки", hint: "физика, химия, экология" },
  { id: "undecided", title: "Пока не решил", hint: "тексты из всех направлений" },
];

export function isFieldId(value: string): value is FieldId {
  return FIELD_OPTIONS.some((f) => f.id === value);
}
