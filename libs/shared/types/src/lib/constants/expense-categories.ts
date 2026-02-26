/**
 * 経費カテゴリ定数
 */
export const EXPENSE_CATEGORIES = [
    '交通費',
    '宿泊費',
    '会議費',
    '消耗品費',
    '通信費',
    'その他',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/**
 * カテゴリ別の表示色 (Angular Material chip 色)
 * SCR-D01 仕様準拠: 交通費=blue, 宿泊費=purple, 会議費=cyan, 消耗品費=orange, 通信費=green
 */
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
    '交通費': '#1976d2',
    '宿泊費': '#7b1fa2',
    '会議費': '#0097a7',
    '消耗品費': '#f57c00',
    '通信費': '#388e3c',
    'その他': '#757575',
};
