import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "upi_payment_history";
const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  const [payments, setPayments] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPayments(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Persist on every change (skip before initial load)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payments)).catch(() => {});
  }, [payments, loaded]);

  const addPayment = useCallback((amount) => {
    const entry = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      date: new Date().toISOString(),
    };
    setPayments((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const clearPayments = useCallback(() => {
    setPayments([]);
  }, []);

  return (
    <PaymentContext.Provider value={{ payments, addPayment, clearPayments, loaded }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error("usePayments must be used inside PaymentProvider");
  return ctx;
}