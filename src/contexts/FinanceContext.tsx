
import React, { createContext, useContext, useState, useEffect } from "react";
import { Transaction, Budget, Category } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, "id" | "spent">) => Promise<void>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch data when user changes or when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshData();
    } else {
      // Clear data when not authenticated
      setTransactions([]);
      setBudgets([]);
      setCategories([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch all user data from Supabase
  const refreshData = async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;
      
      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*');

      if (budgetsError) throw budgetsError;
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      // Transform data to match our types
      setTransactions(transactionsData.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        category: t.category,
        date: new Date(t.date).toISOString().split('T')[0],
        description: t.description || '',
        type: t.type as 'income' | 'expense'
      })));

      setBudgets(budgetsData.map(b => ({
        id: b.id,
        category: b.category,
        limit: Number(b.budget_limit),
        spent: Number(b.spent),
        period: b.period as 'weekly' | 'monthly' | 'yearly'
      })));

      setCategories(categoriesData.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type as 'income' | 'expense' | 'both',
        color: c.color
      })));
    } catch (error) {
      console.error("Error fetching finance data:", error);
      toast({
        title: "Data loading failed",
        description: "There was an error loading your financial data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Transaction methods
  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Add to Supabase
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          description: transaction.description,
          type: transaction.type
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update local state
      const newTransaction: Transaction = {
        id: data.id,
        amount: Number(data.amount),
        category: data.category,
        date: new Date(data.date).toISOString().split('T')[0],
        description: data.description || '',
        type: data.type as 'income' | 'expense'
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // Update budget spent amount if it's an expense
      if (transaction.type === 'expense') {
        updateBudgetsAfterTransaction(transaction.category, transaction.amount);
      }

      toast({
        title: "Transaction added",
        description: "Your transaction has been saved"
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Failed to add transaction",
        description: "There was an error saving your transaction",
        variant: "destructive"
      });
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          description: transaction.description,
          type: transaction.type
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setTransactions(prev => 
        prev.map(tr => tr.id === id ? { ...tr, ...transaction } : tr)
      );
      
      // Re-calculate budgets after update
      await recalculateBudgets();

      toast({
        title: "Transaction updated",
        description: "Your transaction has been updated"
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Failed to update transaction",
        description: "There was an error updating your transaction",
        variant: "destructive"
      });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setTransactions(prev => prev.filter(tr => tr.id !== id));
      
      // Re-calculate budgets after deletion
      await recalculateBudgets();

      toast({
        title: "Transaction deleted",
        description: "Your transaction has been deleted"
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Failed to delete transaction",
        description: "There was an error deleting your transaction",
        variant: "destructive"
      });
    }
  };

  // Budget methods
  const addBudget = async (budget: Omit<Budget, "id" | "spent">) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Calculate initial spent amount
      const spent = calculateSpentAmount(budget.category);
      
      // Add to Supabase
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          category: budget.category,
          budget_limit: budget.limit,
          spent: spent,
          period: budget.period
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update local state
      const newBudget: Budget = {
        id: data.id,
        category: data.category,
        limit: Number(data.budget_limit),
        spent: Number(data.spent),
        period: data.period as 'weekly' | 'monthly' | 'yearly'
      };
      
      setBudgets(prev => [newBudget, ...prev]);

      toast({
        title: "Budget added",
        description: "Your budget has been saved"
      });
    } catch (error) {
      console.error("Error adding budget:", error);
      toast({
        title: "Failed to add budget",
        description: "There was an error saving your budget",
        variant: "destructive"
      });
    }
  };

  const updateBudget = async (id: string, budget: Partial<Budget>) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Map budget properties to database column names
      const updateData: any = {};
      if (budget.category) updateData.category = budget.category;
      if (budget.limit !== undefined) updateData.budget_limit = budget.limit;
      if (budget.spent !== undefined) updateData.spent = budget.spent;
      if (budget.period) updateData.period = budget.period;
      
      // Update in Supabase
      const { error } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setBudgets(prev => 
        prev.map(b => b.id === id ? { ...b, ...budget } : b)
      );

      toast({
        title: "Budget updated",
        description: "Your budget has been updated"
      });
    } catch (error) {
      console.error("Error updating budget:", error);
      toast({
        title: "Failed to update budget",
        description: "There was an error updating your budget",
        variant: "destructive"
      });
    }
  };

  const deleteBudget = async (id: string) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setBudgets(prev => prev.filter(b => b.id !== id));

      toast({
        title: "Budget deleted",
        description: "Your budget has been deleted"
      });
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast({
        title: "Failed to delete budget",
        description: "There was an error deleting your budget",
        variant: "destructive"
      });
    }
  };

  // Category methods
  const addCategory = async (category: Omit<Category, "id">) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Add to Supabase
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: category.name,
          type: category.type,
          color: category.color
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update local state
      const newCategory: Category = {
        id: data.id,
        name: data.name,
        type: data.type as 'income' | 'expense' | 'both',
        color: data.color
      };
      
      setCategories(prev => [newCategory, ...prev]);

      toast({
        title: "Category added",
        description: "Your category has been saved"
      });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Failed to add category",
        description: "There was an error saving your category",
        variant: "destructive"
      });
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          type: category.type,
          color: category.color
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setCategories(prev => 
        prev.map(c => c.id === id ? { ...c, ...category } : c)
      );

      toast({
        title: "Category updated",
        description: "Your category has been updated"
      });
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Failed to update category",
        description: "There was an error updating your category",
        variant: "destructive"
      });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setCategories(prev => prev.filter(c => c.id !== id));

      toast({
        title: "Category deleted",
        description: "Your category has been deleted"
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Failed to delete category",
        description: "There was an error deleting your category",
        variant: "destructive"
      });
    }
  };

  // Helper function to update budgets after adding a transaction
  const updateBudgetsAfterTransaction = async (category: string, amount: number) => {
    if (!isAuthenticated || !user) return;
    
    // Update local state first for immediate feedback
    setBudgets(prev => 
      prev.map(budget => {
        if (budget.category === category) {
          return { ...budget, spent: budget.spent + amount };
        }
        return budget;
      })
    );
    
    // Then update in database
    try {
      const budgetToUpdate = budgets.find(b => b.category === category);
      if (budgetToUpdate) {
        const { error } = await supabase
          .from('budgets')
          .update({ spent: budgetToUpdate.spent + amount })
          .eq('category', category);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating budget spent amount:", error);
      // If there's an error, refresh data to ensure consistency
      refreshData();
    }
  };

  // Helper function to calculate how much is spent in a category
  const calculateSpentAmount = (category: string): number => {
    return transactions
      .filter(tr => tr.category === category && tr.type === 'expense')
      .reduce((total, tr) => total + tr.amount, 0);
  };

  // Helper function to recalculate all budget spent amounts
  const recalculateBudgets = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      // First update local state
      const updatedBudgets = budgets.map(budget => ({
        ...budget,
        spent: calculateSpentAmount(budget.category)
      }));
      
      setBudgets(updatedBudgets);
      
      // Then update in database
      for (const budget of updatedBudgets) {
        const { error } = await supabase
          .from('budgets')
          .update({ spent: budget.spent })
          .eq('id', budget.id);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error recalculating budgets:", error);
      toast({
        title: "Budget update failed",
        description: "There was an error updating your budget calculations",
        variant: "destructive"
      });
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        categories,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        addCategory,
        updateCategory,
        deleteCategory,
        isLoading,
        refreshData
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
