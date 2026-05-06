import { 
  differenceInDays, 
  parseISO, 
  isWithinInterval, 
  isSameDay, 
  addDays, 
  format,
  isAfter,
  isBefore,
  startOfDay,
  endOfMonth
} from 'date-fns';
import { Sale, Goal, WorkingDays, Category } from '../types';

export function getSalesByInterval(sales: Sale[], start: string, end: string, categoryId?: string) {
  const startDate = startOfDay(parseISO(start));
  const endDate = startOfDay(parseISO(end));
  
  return sales.filter(sale => {
    const saleDate = parseISO(sale.date);
    const inInterval = isWithinInterval(saleDate, { start: startDate, end: endDate });
    const categoryMatches = !categoryId || categoryId === 'all' || sale.categoryId === categoryId;
    return inInterval && categoryMatches;
  });
}

export function calculateGoalProgress(goal: Goal, sales: Sale[], workingDays: WorkingDays) {
  const goalSales = getSalesByInterval(sales, goal.startDate, goal.endDate, goal.categoryId);
  const totalSold = goalSales.reduce((acc, sale) => acc + sale.value, 0);
  const remaining = Math.max(0, goal.targetValue - totalSold);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const endD = goal.endDate;
  
  // Count remaining working days from tomorrow until end date
  let remainingWorkingDays = 0;
  let currentDate = addDays(parseISO(today), 1);
  const endLimit = parseISO(endD);
  
  while (isBefore(currentDate, addDays(endLimit, 1))) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    if (workingDays[dateStr] !== false) { // Default to true if not specified
      remainingWorkingDays++;
    }
    currentDate = addDays(currentDate, 1);
  }

  // Check if today is a working day and if there's already a sale today
  const isTodayWorking = workingDays[today] !== false;
  const salesToday = goalSales.filter(s => s.date === today).reduce((acc, s) => acc + s.value, 0);
  
  // Daily average needed for the rest of the days
  const dailyNeeded = remaining > 0 && remainingWorkingDays > 0 ? remaining / remainingWorkingDays : 0;

  return {
    totalSold,
    remaining,
    percent: (totalSold / goal.targetValue) * 100,
    dailyNeeded,
    remainingWorkingDays,
    isCompleted: totalSold >= goal.targetValue
  };
}

export function getDashboardStats(sales: Sale[], goals: Goal[], workingDays: WorkingDays) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');
  
  const salesToday = sales.filter(s => s.date === today).reduce((acc, s) => acc + s.value, 0);
  const countToday = sales.filter(s => s.date === today).length;
  
  const salesMonthData = sales.filter(s => s.date.startsWith(currentMonth));
  const salesMonthTotal = salesMonthData.reduce((acc, s) => acc + s.value, 0);
  
  const salesTotalOverall = sales.reduce((acc, s) => acc + s.value, 0);

  // Projection
  const daysInMonth = differenceInDays(endOfMonth(new Date()), startOfDay(new Date())) + 1;
  // This is a simple projection, more advanced ones can be added
  const dailyAvg = salesMonthTotal / (new Date().getDate());
  const projection = dailyAvg * (new Date().getDate() + daysInMonth);

  return {
    salesToday,
    countToday,
    salesMonthTotal,
    salesTotalOverall,
    projection
  };
}
