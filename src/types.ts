export type Category = {
  id: string;
  name: string;
  color: string;
  status: 'active' | 'inactive';
};

export type Sale = {
  id: string;
  value: number;
  categoryId: string;
  date: string; // ISO format YYYY-MM-DD
  time: string; // HH:mm
  observation?: string;
};

export type Goal = {
  id: string;
  name: string;
  targetValue: number;
  categoryId: string; // 'all' for general category
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'canceled';
};

export type WorkingDays = {
  [date: string]: boolean; // 'YYYY-MM-DD': true/false
};

export type AppData = {
  sales: Sale[];
  goals: Goal[];
  categories: Category[];
  workingDays: WorkingDays;
};
