import React, { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  FlatList, Alert, Modal, TextInput, ScrollView,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { usePayments } from "./PaymentContext";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const SECRET_PIN = "2707";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    "  " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function PaymentHistoryScreen({ navigation }) {
  const { payments, accounts, clearPayments } = usePayments();
  const now = new Date();

  // Account filter — "all" or account.id
  const [selectedAccountFilter, setSelectedAccountFilter] = useState("all");
  const [accountDropdownVisible, setAccountDropdownVisible] = useState(false);

  // Payments filtered by account
  const accountFilteredPayments = useMemo(() => {
    if (selectedAccountFilter === "all") return payments;
    return payments.filter((p) => p.accountId === selectedAccountFilter);
  }, [payments, selectedAccountFilter]);

  // Month filter chips derived from account-filtered payments
  const availableMonths = useMemo(() => {
    const set = new Set();
    accountFilteredPayments.forEach((p) => {
      const d = new Date(p.date);
      set.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    return Array.from(set)
      .map((s) => {
        const [y, m] = s.split("-").map(Number);
        return { year: y, month: m, key: s };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }, [accountFilteredPayments]);

  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Reset month filter when account changes
  const handleAccountFilter = (id) => {
    setSelectedAccountFilter(id);
    setSelectedMonthKey(null);
    setAccountDropdownVisible(false);
  };

  const filteredPayments = useMemo(() => {
    if (!selectedMonthKey) return accountFilteredPayments;
    const [y, m] = selectedMonthKey.split("-").map(Number);
    return accountFilteredPayments.filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [accountFilteredPayments, selectedMonthKey]);

  const totalAmount = useMemo(
    () => filteredPayments.reduce((sum, p) => sum + p.amount, 0),
    [filteredPayments]
  );

  const selectedAccountObj =
    selectedAccountFilter === "all"
      ? null
      : accounts.find((a) => a.id === selectedAccountFilter);

  const getExportLabel = () => {
    const accountPart = selectedAccountObj ? selectedAccountObj.name : "All Accounts";
    if (!selectedMonthKey) return `Export ${accountPart} — All`;
    const [y, m] = selectedMonthKey.split("-").map(Number);
    const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
    if (isCurrentMonth) return `Export ${accountPart} — ${MONTH_NAMES[m]} (till today)`;
    return `Export ${accountPart} — ${MONTH_NAMES[m]} ${y}`;
  };

  const handleExportPDF = async () => {
    if (filteredPayments.length === 0) {
      Alert.alert("No Transactions", "No payments to export for the selected period.");
      return;
    }

    let periodLabel = "All Time";
    if (selectedMonthKey) {
      const [y, m] = selectedMonthKey.split("-").map(Number);
      const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
      periodLabel = isCurrentMonth
        ? `${MONTH_NAMES[m]} ${y} (till ${now.toLocaleDateString("en-IN")})`
        : `${MONTH_NAMES[m]} ${y}`;
    }

    const accountLabel = selectedAccountObj
      ? `${selectedAccountObj.name} (${selectedAccountObj.upiId})`
      : "All Accounts";

    const rows = filteredPayments
      .map(
        (p, i) => {
          const acc = accounts.find((a) => a.id === p.accountId);
          const accCell = selectedAccountFilter === "all"
            ? `<td style="padding:10px 14px; border-bottom:1px solid #eee; font-size:12px; color:#666">${acc ? acc.name : "—"}</td>`
            : "";
          return `
        <tr style="background:${i % 2 === 0 ? "#f9f9f9" : "#fff"}">
          <td style="padding:10px 14px; border-bottom:1px solid #eee">${i + 1}</td>
          <td style="padding:10px 14px; border-bottom:1px solid #eee">${formatDate(p.date)}</td>
          ${accCell}
          <td style="padding:10px 14px; border-bottom:1px solid #eee; font-weight:700; color:#1a1a2e">₹${p.amount.toFixed(2)}</td>
        </tr>`;
        }
      )
      .join("");

    const accountHeader = selectedAccountFilter === "all"
      ? `<th style="padding:12px 14px; text-align:left">Account</th>`
      : "";

    const html = `
      <html>
      <body style="font-family: Arial, sans-serif; padding: 32px; color: #222">
        <h2 style="color:#1a1a2e; margin-bottom:4px">UPI QR Pay — Payment History</h2>
        <p style="color:#555; font-size:13px; margin-bottom:2px"><strong>Account:</strong> ${accountLabel}</p>
        <p style="color:#888; font-size:13px; margin-bottom:24px"><strong>Period:</strong> ${periodLabel}</p>
        <table style="width:100%; border-collapse:collapse; font-size:14px">
          <thead>
            <tr style="background:#1a1a2e; color:#fff">
              <th style="padding:12px 14px; text-align:left">#</th>
              <th style="padding:12px 14px; text-align:left">Date & Time</th>
              ${accountHeader}
              <th style="padding:12px 14px; text-align:left">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:24px; padding:16px; background:#f0f8f0; border-radius:8px; display:flex; justify-content:space-between;">
          <span style="font-weight:700; font-size:15px">Total (${filteredPayments.length} transactions)</span>
          <span style="font-weight:800; font-size:16px; color:#1a1a2e">₹${totalAmount.toFixed(2)}</span>
        </div>
        <p style="color:#aaa; font-size:11px; margin-top:32px">Generated on ${now.toLocaleString("en-IN")}</p>
      </body>
      </html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export Payment History" });
    } catch (e) {
      Alert.alert("Export Failed", e.message);
    }
  };

  const handleClearPress = () => {
    setPinInput("");
    setPinError(false);
    setPinModalVisible(true);
  };

  const handlePinSubmit = () => {
    if (pinInput === SECRET_PIN) {
      setPinModalVisible(false);
      clearPayments();
      setSelectedMonthKey(null);
      Alert.alert("Cleared", "All payment history has been cleared.");
    } else {
      setPinError(true);
    }
  };

  const accountFilterLabel =
    selectedAccountFilter === "all"
      ? "All Accounts"
      : (accounts.find((a) => a.id === selectedAccountFilter)?.name || "All Accounts");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment History</Text>
        <TouchableOpacity onPress={handleClearPress} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Account Filter Dropdown */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={styles.accountDropdown}
          onPress={() => setAccountDropdownVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.accountDropdownText}>👤 {accountFilterLabel}</Text>
          <Text style={styles.accountDropdownChevron}>⌄</Text>
        </TouchableOpacity>

        {/* Month Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
          <TouchableOpacity
            style={[styles.monthChip, !selectedMonthKey && styles.monthChipActive]}
            onPress={() => setSelectedMonthKey(null)}
          >
            <Text style={[styles.monthChipText, !selectedMonthKey && styles.monthChipTextActive]}>All</Text>
          </TouchableOpacity>
          {availableMonths.map(({ year, month, key }) => {
            const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
            const label = isCurrentMonth
              ? `${MONTH_NAMES[month].slice(0, 3)} '${String(year).slice(2)} ▸`
              : `${MONTH_NAMES[month].slice(0, 3)} '${String(year).slice(2)}`;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.monthChip, selectedMonthKey === key && styles.monthChipActive]}
                onPress={() => setSelectedMonthKey(selectedMonthKey === key ? null : key)}
              >
                <Text style={[styles.monthChipText, selectedMonthKey === key && styles.monthChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>{filteredPayments.length} transactions</Text>
        <Text style={styles.summaryTotal}>₹{totalAmount.toFixed(2)}</Text>
      </View>

      {/* List */}
      {filteredPayments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No payments for selected filter</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const acc = accounts.find((a) => a.id === item.accountId);
            return (
              <View style={styles.txRow}>
                <View style={styles.txIcon}>
                  <Text style={styles.txIconText}>✓</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDate}>{formatDate(item.date)}</Text>
                  {selectedAccountFilter === "all" && acc && (
                    <Text style={styles.txAccount}>{acc.name}</Text>
                  )}
                  <Text style={styles.txStatus}>Successful</Text>
                </View>
                <Text style={styles.txAmount}>₹{item.amount.toFixed(2)}</Text>
              </View>
            );
          }}
        />
      )}

      {/* Export Button */}
      <View style={styles.exportContainer}>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF} activeOpacity={0.85}>
          <Text style={styles.exportText}>📄 {getExportLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* Account Dropdown Modal */}
      <Modal
        visible={accountDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAccountDropdownVisible(false)}
        >
          <View style={styles.dropdownSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.dropdownTitle}>Filter by Account</Text>
            <TouchableOpacity
              style={[styles.dropdownItem, selectedAccountFilter === "all" && styles.dropdownItemActive]}
              onPress={() => handleAccountFilter("all")}
            >
              <Text style={[styles.dropdownItemText, selectedAccountFilter === "all" && styles.dropdownItemTextActive]}>
                All Accounts
              </Text>
              {selectedAccountFilter === "all" && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[styles.dropdownItem, selectedAccountFilter === acc.id && styles.dropdownItemActive]}
                onPress={() => handleAccountFilter(acc.id)}
              >
                <View style={styles.dropdownItemInner}>
                  <Text style={[styles.dropdownItemText, selectedAccountFilter === acc.id && styles.dropdownItemTextActive]}>
                    {acc.name}
                  </Text>
                  <Text style={styles.dropdownItemUpi}>{acc.upiId}</Text>
                </View>
                {selectedAccountFilter === acc.id && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PIN Modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.pinOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter PIN to Clear</Text>
            <Text style={styles.modalSubtitle}>This will permanently delete all history.</Text>
            <TextInput
              style={[styles.pinInput, pinError && styles.pinInputError]}
              value={pinInput}
              onChangeText={(t) => { setPinInput(t); setPinError(false); }}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
              placeholderTextColor="#aaa"
              autoFocus
            />
            {pinError && <Text style={styles.pinErrorText}>Incorrect PIN</Text>}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPinModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handlePinSubmit}>
                <Text style={styles.modalConfirmText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1a1a2e",
  },
  back: { padding: 8 },
  backArrow: { color: "#fff", fontSize: 24 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  clearBtn: { padding: 8 },
  clearText: { color: "#f44336", fontSize: 14, fontWeight: "700" },

  filterSection: { backgroundColor: "#1a1a2e", paddingBottom: 14 },

  accountDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  accountDropdownText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  accountDropdownChevron: { color: "#aaa", fontSize: 16 },

  monthScroll: { paddingHorizontal: 20, gap: 8 },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
  monthChipActive: { backgroundColor: "#80cbc4", borderColor: "#80cbc4" },
  monthChipText: { fontSize: 13, fontWeight: "600", color: "#aaa" },
  monthChipTextActive: { color: "#1a1a2e" },

  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  summaryCount: { fontSize: 13, color: "#888" },
  summaryTotal: { fontSize: 16, fontWeight: "800", color: "#1a1a2e" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: "#aaa" },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  txIconText: { color: "#4caf50", fontSize: 16, fontWeight: "800" },
  txInfo: { flex: 1 },
  txDate: { fontSize: 13, color: "#444", fontWeight: "500" },
  txAccount: { fontSize: 11, color: "#1a1a2e", fontWeight: "700", marginTop: 1 },
  txStatus: { fontSize: 11, color: "#4caf50", fontWeight: "600", marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: "800", color: "#1a1a2e" },

  exportContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  exportBtn: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  exportText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Account dropdown modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  dropdownSheet: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemActive: { backgroundColor: "#f0f0f8" },
  dropdownItemInner: { flex: 1 },
  dropdownItemText: { fontSize: 15, fontWeight: "600", color: "#333", flex: 1 },
  dropdownItemTextActive: { color: "#1a1a2e" },
  dropdownItemUpi: { fontSize: 12, color: "#888", marginTop: 2 },
  checkMark: { fontSize: 16, color: "#1a1a2e", fontWeight: "800" },

  // PIN modal
  pinOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a2e", marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: "#888", marginBottom: 20, textAlign: "center" },
  pinInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 8,
  },
  pinInputError: { borderColor: "#f44336" },
  pinErrorText: { color: "#f44336", fontSize: 13, marginBottom: 12 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 16, width: "100%" },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: "#555" },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f44336",
    alignItems: "center",
  },
  modalConfirmText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});