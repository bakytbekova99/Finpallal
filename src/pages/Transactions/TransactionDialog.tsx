
import React, { useState, useEffect } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Transaction } from "@/types";
import { AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null; // null for new transaction, object for editing
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({
  open,
  onOpenChange,
  transaction,
}) => {
  const { categories, addTransaction, updateTransaction, addCategory } = useFinance();
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    date: "",
    description: "",
    type: "expense" as "income" | "expense",
  });
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // When transaction prop changes (for editing), populate form
  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount.toString(),
        category: transaction.category,
        date: transaction.date,
        description: transaction.description,
        type: transaction.type,
      });
    } else {
      // Default values for new transaction
      setFormData({
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD
        description: "",
        type: "expense",
      });
    }
    setError("");
    setNewCategory("");
    setShowNewCategoryInput(false);
  }, [transaction, open]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      type: formData.type,
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
    if (!formData.amount || !formData.category || !formData.date) {
      setError("Amount, category, and date are required");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    const newTransaction = {
      amount,
      category: formData.category,
      date: formData.date,
      description: formData.description,
      type: formData.type,
    };

    if (transaction) {
      // Update existing transaction
      updateTransaction(transaction.id, newTransaction);
    } else {
      // Add new transaction
      addTransaction(newTransaction);
    }

    onOpenChange(false);
  };

  // Filter categories based on the selected transaction type
  const filteredCategories = categories.filter(
    (cat) => cat.type === "both" || cat.type === formData.type
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add New Transaction"}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Update the details of your transaction."
              : "Enter the details of your new transaction."}
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
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                handleSelectChange("type", value as "income" | "expense")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleInputChange}
              required
            />
          </div>

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
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>
                      No categories available
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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Add more details about this transaction"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {transaction ? "Update Transaction" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
