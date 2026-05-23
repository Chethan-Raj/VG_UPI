import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { usePayments } from "./PaymentContext";

const KEYS = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];

export default function HomeScreen({ navigation, route }) {
  const {
    accounts,
    selectedAccount,
    selectedAccountId,
    setSelectedAccountId,
    addAccount,
    removeAccount,
  } = usePayments();

  const [amount, setAmount] = useState("");
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUpiId, setNewUpiId] = useState("");

  React.useEffect(() => {
    if (route?.params?.resetAmount) {
      setAmount("");
      navigation.setParams({ resetAmount: false });
    }
  }, [route?.params?.resetAmount]);

  const handleKey = (key) => {
    if (key === "⌫") {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === "." && amount.includes(".")) {
      return;
    } else if (amount === "" && key === ".") {
      return;
    } else if (amount.includes(".")) {
      const decimals = amount.split(".")[1];
      if (decimals && decimals.length >= 2) return;
      setAmount((prev) => prev + key);
    } else {
      if (amount.length >= 7) return;
      setAmount((prev) => prev + key);
    }
  };

  const handleGenerate = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) return;
    navigation.navigate("QRScreen", {
      amount: num.toFixed(2),
      account: selectedAccount,
    });
  };

  const handleAddAccount = () => {
    if (!newName.trim() || !newUpiId.trim()) {
      Alert.alert("Missing Info", "Please enter both account name and UPI ID.");
      return;
    }
    const upiRegex = /^[\w.\-]+@[\w]+$/;
    if (!upiRegex.test(newUpiId.trim())) {
      Alert.alert("Invalid UPI ID", "UPI ID format should be like: name@bank");
      return;
    }
    const acc = addAccount(newName, newUpiId);
    setSelectedAccountId(acc.id);
    setNewName("");
    setNewUpiId("");
    setAddModalVisible(false);
  };

  const handleDeleteAccount = (id) => {
    if (accounts.length === 1) {
      Alert.alert("Cannot Delete", "At least one account must remain.");
      return;
    }
    Alert.alert("Delete Account", "Remove this UPI account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeAccount(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appName}>UPI QR Pay</Text>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate("PaymentHistory")}
            activeOpacity={0.8}
          >
            <Text style={styles.historyBtnText}>📋 History</Text>
          </TouchableOpacity>
        </View>

        {/* Account Selector */}
        <TouchableOpacity
          style={styles.accountSelector}
          onPress={() => setAccountModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.accountSelectorInner}>
            <View style={styles.accountDot} />
            <View style={styles.accountTextBlock}>
              <Text style={styles.accountName}>{selectedAccount.name}</Text>
              <Text style={styles.accountUpi}>{selectedAccount.upiId}</Text>
            </View>
            <Text style={styles.accountChevron}>⌄</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.amountBox}>
        <Text style={styles.rupee}>₹</Text>
        <Text style={styles.amountText}>{amount || "0"}</Text>
      </View>

      <View style={styles.keypad}>
        {KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.key, key === "⌫" && styles.backKey]}
            onPress={() => handleKey(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyText, key === "⌫" && styles.backText]}>
              {key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.generateBtn, (!amount || amount === "0") && styles.btnDisabled]}
        onPress={handleGenerate}
        activeOpacity={0.85}
        disabled={!amount || parseFloat(amount) <= 0}
      >
        <Text style={styles.generateText}>Generate QR</Text>
      </TouchableOpacity>

      {/* Account Selection Modal */}
      <Modal
        visible={accountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAccountModalVisible(false)}
        >
          <View style={styles.accountSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Account</Text>

            <ScrollView style={styles.accountList}>
              {accounts.map((acc) => (
                <View key={acc.id} style={styles.accountRow}>
                  <TouchableOpacity
                    style={[
                      styles.accountItem,
                      acc.id === selectedAccountId && styles.accountItemActive,
                    ]}
                    onPress={() => {
                      setSelectedAccountId(acc.id);
                      setAccountModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.accountRadio,
                        acc.id === selectedAccountId && styles.accountRadioActive,
                      ]}
                    >
                      {acc.id === selectedAccountId && (
                        <View style={styles.accountRadioInner} />
                      )}
                    </View>
                    <View style={styles.accountItemText}>
                      <Text style={styles.accountItemName}>{acc.name}</Text>
                      <Text style={styles.accountItemUpi}>{acc.upiId}</Text>
                    </View>
                  </TouchableOpacity>
                  {accounts.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteAccount(acc.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.addAccountBtn}
              onPress={() => {
                setAccountModalVisible(false);
                setTimeout(() => setAddModalVisible(true), 300);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.addAccountBtnText}>+ Add New Account</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Account Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.addAccountBox}>
            <Text style={styles.addAccountTitle}>Add UPI Account</Text>
            <TextInput
              style={styles.input}
              placeholder="Account Name (e.g. My Shop)"
              placeholderTextColor="#aaa"
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="UPI ID (e.g. name@hdfc)"
              placeholderTextColor="#aaa"
              value={newUpiId}
              onChangeText={setNewUpiId}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.addModalBtns}>
              <TouchableOpacity
                style={styles.addModalCancel}
                onPress={() => {
                  setAddModalVisible(false);
                  setNewName("");
                  setNewUpiId("");
                }}
              >
                <Text style={styles.addModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addModalConfirm} onPress={handleAddAccount}>
                <Text style={styles.addModalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  header: { alignItems: "center", paddingTop: 32, paddingBottom: 8 },
  headerTop: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  appName: { fontSize: 22, fontWeight: "700", color: "#1a1a2e", flex: 1, textAlign: "center" },
  historyBtn: {
    position: "absolute",
    right: 20,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  historyBtnText: { fontSize: 13, fontWeight: "600", color: "#1a1a2e" },

  accountSelector: {
    marginHorizontal: 20,
    backgroundColor: "#f7f7fb",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e0e0f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "90%",
  },
  accountSelectorInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accountDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4caf50",
  },
  accountTextBlock: { flex: 1 },
  accountName: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  accountUpi: { fontSize: 12, color: "#888", marginTop: 1 },
  accountChevron: { fontSize: 18, color: "#aaa", fontWeight: "700" },

  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    borderBottomWidth: 2,
    borderBottomColor: "#f0f0f0",
    marginHorizontal: 24,
  },
  rupee: { fontSize: 36, color: "#333", fontWeight: "300", marginRight: 4 },
  amountText: { fontSize: 52, fontWeight: "700", color: "#1a1a2e", minWidth: 60 },

  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  key: {
    width: "30%",
    paddingVertical: 18,
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backKey: { backgroundColor: "#fff0f0" },
  keyText: { fontSize: 24, fontWeight: "600", color: "#1a1a2e" },
  backText: { color: "#e53935" },

  generateBtn: {
    marginHorizontal: 24,
    marginTop: 28,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#aaa" },
  generateText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Account Selection Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  accountSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1a1a2e",
    textAlign: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  accountList: { paddingHorizontal: 20, paddingTop: 8 },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  accountItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f7f7fb",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  accountItemActive: {
    borderColor: "#1a1a2e",
    backgroundColor: "#f0f0f8",
  },
  accountRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  accountRadioActive: { borderColor: "#1a1a2e" },
  accountRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1a1a2e",
  },
  accountItemText: { flex: 1 },
  accountItemName: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  accountItemUpi: { fontSize: 12, color: "#888", marginTop: 2 },
  deleteBtn: { padding: 10, marginLeft: 4 },
  deleteBtnText: { fontSize: 18 },

  addAccountBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#1a1a2e",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  addAccountBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Add Account Modal
  addAccountBox: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  addAccountTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1a1a2e",
    marginBottom: 12,
  },
  addModalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  addModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  addModalCancelText: { fontSize: 15, fontWeight: "700", color: "#555" },
  addModalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
  },
  addModalConfirmText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});