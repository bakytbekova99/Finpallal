import React, { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  DollarSign, 
  Plus,
  Calendar,
  CreditCard,
  BarChart4,
  Target
} from "lucide-react";
import { Pie, Bar } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import TransactionDialog from "../Transactions/TransactionDialog";

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { transactions, budgets, categories } = useFinance();
  const [period, setPeriod] = React.useState<"week" | "month" | "year">("month");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Calculate total income, expenses, and balance
  const totalIncome = transactions
    .filter((tr) => tr.type === "income")
    .reduce((sum, tr) => sum + tr.amount, 0);

  const totalExpenses = transactions
    .filter((tr) => tr.type === "expense")
    .reduce((sum, tr) => sum + tr.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Get recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Prepare data for pie chart
  const prepareExpensesByCategoryData = () => {
    const expensesByCategory: Record<string, number> = {};

    transactions
      .filter((tr) => tr.type === "expense")
      .forEach((tr) => {
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

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for monthly income/expense bar chart
  const prepareMonthlyData = () => {
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
    
    return {
      labels: months,
      datasets: [
        {
          label: "Income",
          data: incomeData,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "Expenses",
          data: expenseData,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "add-transaction":
        setIsAddDialogOpen(true);
        break;
      case "manage-budgets":
        navigate("/budgets");
        break;
      case "view-reports":
        navigate("/reports");
        break;
      case "scheduled-transactions":
        // This would navigate to a scheduled transactions page if it existed
        // For now, just navigate to the main transactions page
        navigate("/transactions");
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button className="hidden sm:flex" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total from all your accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +{((totalIncome / (totalIncome + totalExpenses)) * 100).toFixed(1)}% of total flow
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalExpenses / (totalIncome + totalExpenses)) * 100).toFixed(1)}% of total flow
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
            <p className="text-xs text-muted-foreground">
              {budgets.filter((b) => b.spent >= b.limit).length} over limit
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Charts Section */}
        <Tabs defaultValue="overview" className="col-span-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                  Your financial activity for the {period}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Bar data={prepareMonthlyData()} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>
                  Breakdown of your expenses by category
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-[300px] h-[300px]">
                  <Pie data={prepareExpensesByCategoryData()} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Transactions & Budget Progress */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your latest financial activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No transactions yet
                  </div>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === "income" 
                            ? "bg-green-100 text-green-600" 
                            : "bg-red-100 text-red-600"
                        }`}>
                          {transaction.type === "income" ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{transaction.category}</p>
                          <p className="text-xs text-muted-foreground">{transaction.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            transaction.type === "income" 
                              ? "text-green-600" 
                              : "text-red-600"
                          }`}>
                            {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget Progress</CardTitle>
              <CardDescription>
                Your top budget categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No budgets set yet
                  </div>
                ) : (
                  budgets.slice(0, 3).map((budget) => (
                    <div key={budget.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{budget.category}</p>
                          <p className="text-xs text-muted-foreground">
                            ${budget.spent.toFixed(2)} of ${budget.limit.toFixed(2)}
                          </p>
                        </div>
                        <p className={`text-sm ${
                          budget.spent > budget.limit 
                            ? "text-red-600" 
                            : (budget.spent > budget.limit * 0.8 
                              ? "text-amber-600" 
                              : "text-green-600")
                        }`}>
                          {((budget.spent / budget.limit) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <Progress 
                        value={(budget.spent / budget.limit) * 100} 
                        className={`${
                          budget.spent > budget.limit 
                            ? "bg-red-200" 
                            : (budget.spent > budget.limit * 0.8 
                              ? "bg-amber-200" 
                              : "bg-green-200")
                        }`}
                        // Apply indicator color through CSS variables
                        style={{
                          "--progress-indicator-color": budget.spent > budget.limit 
                            ? "hsl(var(--destructive))" 
                            : (budget.spent > budget.limit * 0.8 
                              ? "#f59e0b" 
                              : "hsl(var(--primary))")
                        } as React.CSSProperties}
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-2"
            onClick={() => handleQuickAction("add-transaction")}
          >
            <Plus className="h-5 w-5" />
            <span>Add Transaction</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-2"
            onClick={() => handleQuickAction("manage-budgets")}
          >
            <CreditCard className="h-5 w-5" />
            <span>Manage Budgets</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-2"
            onClick={() => handleQuickAction("view-reports")}
          >
            <BarChart4 className="h-5 w-5" />
            <span>View Reports</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center space-y-2"
            onClick={() => handleQuickAction("scheduled-transactions")}
          >
            <Calendar className="h-5 w-5" />
            <span>Scheduled Transactions</span>
          </Button>
        </div>
      </div>

      {/* Transaction Dialog */}
      <TransactionDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        transaction={null}
      />
    </div>
  );
};

export default Dashboard;
