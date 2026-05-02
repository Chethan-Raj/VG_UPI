import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
} from "react-native";
import { UPI_CONFIG } from "../upiConfig";

const KEYS = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];

export default function HomeScreen({ navigation, route }) {
  const [amount, setAmount] = useState("");

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
    navigation.navigate("QRScreen", { amount: num.toFixed(2) });
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
        <Text style={styles.upiId}>{UPI_CONFIG.upiId}</Text>
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
    marginBottom: 4,
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
  upiId: { fontSize: 13, color: "#888", marginTop: 4 },

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
});