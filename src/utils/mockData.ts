
// This file is intentionally left empty to allow users to start with a clean slate

import { User, Transaction, Budget, Category } from "@/types";

export const mockUser: User = {
  id: "",
  name: "",
  email: "",
  notificationsEnabled: false
};

export const mockCategories: Category[] = [];
export const mockTransactions: Transaction[] = [];
export const mockBudgets: Budget[] = [];

export const getCategoryByName = (name: string): Category | undefined => undefined;
export const getCategoryColor = (name: string): string => "#CCCCCC";
