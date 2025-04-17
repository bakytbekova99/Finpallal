
import React, { useState, useEffect } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Budget } from "@/types";
import { AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null; // null for new budget, object for editing
}

const BudgetDialog: React.FC<BudgetDialogProps> = ({
  open,
  onOpenChange,
  budget,
}) => {
  const { categories, addBudget, updateBudget, addCategory } = useFinance();
  const [formData, setFormData] = useState({
    category: "",
    limit: "",
    period: "monthly" as "weekly" | "monthly" | "yearly",
  });
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // When budget prop changes (for editing), populate form
  useEffect(() => {
    if (budget) {
      setFormData({
        category: budget.category,
        limit: budget.limit.toString(),
        period: budget.period,
      });
    } else {
      // Default values for new budget
      setFormData({
        category: "",
        limit: "",
        period: "monthly",
      });
    }
    setError("");
    setNewCategory("");
    setShowNewCategoryInput(false);
  }, [budget, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "category" && value === "add-new") {
      setShowNewCategoryInput(true);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewCategory = () => {
    if (!newCategory.trim()) {
      setError("Category name cannot be empty");
      return;
    }

    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === newCategory.toLowerCase())) {
      setError("Category already exists");
      return;
    }

    // Add new category
    addCategory({
      name: newCategory,
      type: "expense", // Budgets are only for expenses
      color: generateRandomColor(),
    });

    // Set this category as selected
    setFormData(prev => ({ ...prev, category: newCategory }));
    
    // Reset UI
    setNewCategory("");
    setShowNewCategoryInput(false);
    setError("");
  };

  const generateRandomColor = () => {
    const colors = [
      "#F97316", // Orange
      "#8B5CF6", // Purple
      "#0EA5E9", // Blue
      "#22C55E", // Green
      "#EF4444", // Red
      "#F59E0B", // Amber
      "#EC4899", // Pink
      "#06B6D4", // Cyan
      "#9333EA", // Violet
      "#14B8A6", // Teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form data
    if (!formData.category || !formData.limit) {
      setError("Category and limit are required");
      return;
    }

    const limit = parseFloat(formData.limit);
    if (isNaN(limit) || limit <= 0) {
      setError("Limit must be a positive number");
      return;
    }

    if (budget) {
      // Update existing budget
      updateBudget(budget.id, {
        category: formData.category,
        limit,
        period: formData.period,
      });
    } else {
      // Add new budget
      addBudget({
        category: formData.category,
        limit,
        period: formData.period,
      });
    }

    onOpenChange(false);
  };

  // Filter categories to show only expense categories
  const expenseCategories = categories.filter(
    (cat) => cat.type === "expense" || cat.type === "both"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {budget ? "Edit Budget" : "Create New Budget"}
          </DialogTitle>
          <DialogDescription>
            {budget
              ? "Update your budget's details."
              : "Set up a new budget to track your spending."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            {showNewCategoryInput ? (
              <div className="flex space-x-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter new category name"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleAddNewCategory} 
                  variant="secondary"
                >
                  Add
                </Button>
              </div>
            ) : (
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.length > 0 ? (
                    expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>
                      No expense categories available
                    </SelectItem>
                  )}
                  <SelectItem value="add-new">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      Add new category
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Budget Limit</Label>
            <Input
              id="limit"
              name="limit"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.limit}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <Select
              value={formData.period}
              onValueChange={(value) =>
                handleSelectChange(
                  "period", 
                  value as "weekly" | "monthly" | "yearly"
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {budget ? "Update Budget" : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetDialog;
