
import React, { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronDown, ChevronUp, Download, BarChart4, PieChart } from "lucide-react";
import { Pie, Bar, Line } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
} from "chart.js";
import { Transaction } from "@/types";

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

// Time periods
const periods = [
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "This month", value: "thisMonth" },
  { label: "Last month", value: "lastMonth" },
  { label: "This year", value: "thisYear" },
  { label: "All time", value: "allTime" },
];

const ReportsPage: React.FC = () => {
  const { transactions, categories } = useFinance();
  const [period, setPeriod] = useState("30days");

  // Filter transactions based on selected period
  const filteredTransactions = filterTransactionsByPeriod(transactions, period);

  // Get total income and expenses
  const totalIncome = filteredTransactions
    .filter((tr) => tr.type === "income")
    .reduce((sum, tr) => sum + tr.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((tr) => tr.type === "expense")
    .reduce((sum, tr) => sum + tr.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totalIncome.toFixed(2)}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              {/* This would use previous period comparison in a real app */}
              <ChevronUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">12%</span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${totalExpenses.toFixed(2)}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              {/* This would use previous period comparison in a real app */}
              <ChevronDown className="mr-1 h-4 w-4 text-red-500" />
              <span className="text-red-500 font-medium">8%</span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
              ${balance.toFixed(2)}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              {/* This would use previous period comparison in a real app */}
              <Calendar className="mr-1 h-4 w-4" />
              <span>Period: {periods.find(p => p.value === period)?.label}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="category" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>
                Compare your income and expenses over time
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <IncomeVsExpensesChart transactions={filteredTransactions} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="category" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>
                  Where your money is going
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <ExpensePieChart 
                    transactions={filteredTransactions.filter(tr => tr.type === "expense")} 
                    categories={categories}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Income Sources</CardTitle>
                <CardDescription>
                  Where your money is coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <IncomePieChart 
                    transactions={filteredTransactions.filter(tr => tr.type === "income")} 
                    categories={categories}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
              <CardDescription>
                Your highest expense categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopCategoriesChart 
                transactions={filteredTransactions.filter(tr => tr.type === "expense")} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending Trends</CardTitle>
              <CardDescription>
                How your spending has changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendsChart transactions={filteredTransactions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to filter transactions by period
function filterTransactionsByPeriod(transactions: Transaction[], period: string): Transaction[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate: Date;

  switch (period) {
    case "7days":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case "30days":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      break;
    case "thisMonth":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "lastMonth":
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return transactions.filter(tr => {
        const trDate = new Date(tr.date);
        return trDate >= startDate && trDate <= endOfLastMonth;
      });
    case "thisYear":
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    case "allTime":
    default:
      return transactions;
  }

  return transactions.filter(tr => {
    const trDate = new Date(tr.date);
    return trDate >= startDate;
  });
}

// Component for Income vs Expenses Chart
const IncomeVsExpensesChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  // Group transactions by month
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  
  const incomeData = Array(12).fill(0);
  const expenseData = Array(12).fill(0);
  
  transactions.forEach((tr) => {
    const date = new Date(tr.date);
    if (date.getFullYear() === currentYear) {
      const month = date.getMonth();
      if (tr.type === "income") {
        incomeData[month] += tr.amount;
      } else {
        expenseData[month] += tr.amount;
      }
    }
  });
  
  const data = {
    labels: months,
    datasets: [
      {
        label: "Income",
        data: incomeData,
        backgroundColor: "rgba(34, 197, 94, 0.6)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
      {
        label: "Expenses",
        data: expenseData,
        backgroundColor: "rgba(239, 68, 68, 0.6)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-[400px]">
      <Bar data={data} options={options} />
    </div>
  );
};

// Component for Expense Pie Chart
const ExpensePieChart: React.FC<{ 
  transactions: Transaction[],
  categories: any[]
}> = ({ transactions, categories }) => {
  // Group transactions by category
  const expensesByCategory: Record<string, number> = {};

  transactions.forEach((tr) => {
    if (expensesByCategory[tr.category]) {
      expensesByCategory[tr.category] += tr.amount;
    } else {
      expensesByCategory[tr.category] = tr.amount;
    }
  });

  const labels = Object.keys(expensesByCategory);
  const data = Object.values(expensesByCategory);
  const backgroundColors = labels.map((category) => {
    const categoryObj = categories.find((cat) => cat.name === category);
    return categoryObj?.color || "#ccc";
  });

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full h-full">
      {transactions.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No expense data for this period
        </div>
      ) : (
        <Pie data={chartData} options={options} />
      )}
    </div>
  );
};

// Component for Income Pie Chart
const IncomePieChart: React.FC<{ 
  transactions: Transaction[], 
  categories: any[]
}> = ({ transactions, categories }) => {
  // Group transactions by category
  const incomeByCategory: Record<string, number> = {};

  transactions.forEach((tr) => {
    if (incomeByCategory[tr.category]) {
      incomeByCategory[tr.category] += tr.amount;
    } else {
      incomeByCategory[tr.category] = tr.amount;
    }
  });

  const labels = Object.keys(incomeByCategory);
  const data = Object.values(incomeByCategory);
  const backgroundColors = labels.map((category) => {
    const categoryObj = categories.find((cat) => cat.name === category);
    return categoryObj?.color || "#ccc";
  });

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full h-full">
      {transactions.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No income data for this period
        </div>
      ) : (
        <Pie data={chartData} options={options} />
      )}
    </div>
  );
};

// Component for Top Categories Chart
const TopCategoriesChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  // Group and sum transactions by category
  const expensesByCategory: Record<string, number> = {};

  transactions.forEach((tr) => {
    if (expensesByCategory[tr.category]) {
      expensesByCategory[tr.category] += tr.amount;
    } else {
      expensesByCategory[tr.category] = tr.amount;
    }
  });

  // Sort categories by amount and take top 5
  const sortedCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const labels = sortedCategories.map(([category]) => category);
  const data = sortedCategories.map(([, amount]) => amount);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Spending Amount",
        data,
        backgroundColor: "rgba(124, 58, 237, 0.6)",
        borderColor: "rgba(124, 58, 237, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-[300px]">
      {transactions.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No expense data for this period
        </div>
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

// Component for Trends Chart
const TrendsChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  // Group transactions by day for the last 30 days
  const last30Days: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    last30Days.push(dateString.substring(5)); // Format as MM-DD

    const dayIncome = transactions
      .filter(tr => tr.date === dateString && tr.type === "income")
      .reduce((sum, tr) => sum + tr.amount, 0);
    
    const dayExpense = transactions
      .filter(tr => tr.date === dateString && tr.type === "expense")
      .reduce((sum, tr) => sum + tr.amount, 0);

    incomeData.push(dayIncome);
    expenseData.push(dayExpense);
  }

  const chartData = {
    labels: last30Days,
    datasets: [
      {
        label: "Income",
        data: incomeData,
        borderColor: "rgba(34, 197, 94, 1)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Expenses",
        data: expenseData,
        borderColor: "rgba(239, 68, 68, 1)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-[400px]">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ReportsPage;
