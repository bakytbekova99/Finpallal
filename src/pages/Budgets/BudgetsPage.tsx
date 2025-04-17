
import React, { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  PencilLine, 
  Trash2,
  Target
} from "lucide-react";
import { Budget } from "@/types";
import BudgetDialog from "./BudgetDialog";

const BudgetsPage: React.FC = () => {
  const { budgets } = useFinance();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingBudget(null);
  };

  // Group budgets by period
  const groupedBudgets = budgets.reduce((groups, budget) => {
    const period = budget.period;
    if (!groups[period]) {
      groups[period] = [];
    }
    groups[period].push(budget);
    return groups;
  }, {} as Record<string, Budget[]>);

  // Calculate overall budget status
  const totalBudgetLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalBudgetSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const overallPercentage = totalBudgetLimit > 0 
    ? (totalBudgetSpent / totalBudgetLimit) * 100 
    : 0;

  // Get status info
  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.limit) * 100;
    let status = {
      color: "bg-green-500",
      text: "On Track",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    };

    if (percentage > 100) {
      status = {
        color: "bg-red-500",
        text: "Over Budget",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      };
    } else if (percentage > 80) {
      status = {
        color: "bg-amber-500",
        text: "Warning",
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      };
    }

    return status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {/* Overall Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Budget Status</CardTitle>
          <CardDescription>Your total spending across all budgets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Total Spent</p>
                <p className="text-2xl font-bold">${totalBudgetSpent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Budget</p>
                <p className="text-2xl font-bold">${totalBudgetLimit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className={`text-xl font-bold ${
                  overallPercentage > 100 
                    ? "text-red-500" 
                    : overallPercentage > 80 
                      ? "text-amber-500" 
                      : "text-green-500"
                }`}>
                  {overallPercentage.toFixed(0)}%
                </p>
              </div>
            </div>
            <Progress 
              value={overallPercentage > 100 ? 100 : overallPercentage} 
              className="h-3"
              style={{
                "--progress-indicator-color": overallPercentage > 100 
                  ? "hsl(var(--destructive))" 
                  : overallPercentage > 80 
                    ? "#f59e0b" 
                    : "hsl(var(--primary))"
              } as React.CSSProperties}
            />
          </div>
        </CardContent>
      </Card>

      {/* Budget List by Period */}
      {Object.entries(groupedBudgets).map(([period, periodBudgets]) => (
        <div key={period} className="space-y-4">
          <h2 className="text-xl font-semibold capitalize">{period} Budgets</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {periodBudgets.map((budget) => {
              const percentage = (budget.spent / budget.limit) * 100;
              const status = getBudgetStatus(budget);
              return (
                <Card key={budget.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{budget.category}</CardTitle>
                      {status.icon}
                    </div>
                    <CardDescription>
                      {status.text} ({percentage.toFixed(0)}%)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-medium">${budget.spent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">${budget.limit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className={`font-medium ${
                          budget.limit - budget.spent < 0 ? "text-red-500" : ""
                        }`}>
                          ${(budget.limit - budget.spent).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={percentage > 100 ? 100 : percentage} 
                      className="h-2 mt-4"
                      style={{
                        "--progress-indicator-color": budget.spent > budget.limit 
                          ? "hsl(var(--destructive))" 
                          : budget.spent > budget.limit * 0.8 
                            ? "#f59e0b" 
                            : "hsl(var(--primary))"
                      } as React.CSSProperties}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEditBudget(budget)}
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}

            {/* Add Budget Card */}
            <Card className="border-dashed flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Add New Budget</p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Create a new {period} budget to track your spending
              </p>
            </Card>
          </div>
        </div>
      ))}

      {/* Show a message if no budgets exist */}
      {budgets.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-10">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No Budgets Set</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start planning your finances by creating your first budget. Setting budgets helps you track and control your spending.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Budget Dialog */}
      <BudgetDialog 
        open={isAddDialogOpen} 
        onOpenChange={closeDialog} 
        budget={editingBudget}
      />
    </div>
  );
};

export default BudgetsPage;
