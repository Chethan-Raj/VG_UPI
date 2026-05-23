import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_ACCOUNTS } from "../upiConfig";

const PAYMENTS_KEY = "upi_payment_history";
const ACCOUNTS_KEY = "upi_accounts";
const SELECTED_ACCOUNT_KEY = "upi_selected_account_id";

const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState(DEFAULT_ACCOUNTS[0].id);
  const [loaded, setLoaded] = useState(false);

  // Load all persisted data on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PAYMENTS_KEY),
      AsyncStorage.getItem(ACCOUNTS_KEY),
      AsyncStorage.getItem(SELECTED_ACCOUNT_KEY),
    ])
      .then(([rawPayments, rawAccounts, rawSelectedId]) => {
        if (rawPayments) setPayments(JSON.parse(rawPayments));
        if (rawAccounts) {
          const parsed = JSON.parse(rawAccounts);
          setAccounts(parsed.length > 0 ? parsed : DEFAULT_ACCOUNTS);
        }
        if (rawSelectedId) setSelectedAccountId(rawSelectedId);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Persist payments
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments)).catch(() => {});
  }, [payments, loaded]);

  // Persist accounts
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)).catch(() => {});
  }, [accounts, loaded]);

  // Persist selected account
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, selectedAccountId).catch(() => {});
  }, [selectedAccountId, loaded]);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const addAccount = useCallback((name, upiId) => {
    const newAccount = {
      id: Date.now().toString(),
      name: name.trim(),
      upiId: upiId.trim(),
      currency: "INR",
    };
    setAccounts((prev) => [...prev, newAccount]);
    return newAccount;
  }, []);

  const removeAccount = useCallback((id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setSelectedAccountId((prev) => {
      if (prev === id) {
        // fallback to first remaining account
        return DEFAULT_ACCOUNTS[0].id;
      }
      return prev;
    });
  }, []);

  const addPayment = useCallback(
    (amount, accountId) => {
      const entry = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        accountId: accountId || selectedAccountId,
      };
      setPayments((prev) => [entry, ...prev]);
      return entry;
    },
    [selectedAccountId]
  );

  const clearPayments = useCallback(() => {
    setPayments([]);
  }, []);

  return (
    <PaymentContext.Provider
      value={{
        payments,
        accounts,
        selectedAccount,
        selectedAccountId,
        setSelectedAccountId,
        addAccount,
        removeAccount,
        addPayment,
        clearPayments,
        loaded,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error("usePayments must be used inside PaymentProvider");
  return ctx;
}