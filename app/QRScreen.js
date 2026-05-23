import React, { useMemo, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Share,
  StatusBar, Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { usePayments } from "./PaymentContext";

export default function QRScreen({ route, navigation }) {
  const { amount, account } = route.params;
  const { addPayment } = usePayments();
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'success' | 'failed'
  const qrCardRef = useRef(null);

  const upiString = useMemo(() => {
    const params = new URLSearchParams({
      pa: account.upiId,
      pn: account.name,
      am: amount,
      cu: account.currency || "INR",
    });
    return `upi://pay?${params.toString()}`;
  }, [amount, account]);

  const handleShare = async () => {
    try {
      const uri = await captureRef(qrCardRef, {
        format: "png",
        quality: 1,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: `Pay ₹${amount} - UPI QR`,
        });
      } else {
        await Share.share({
          message: `Pay ₹${amount} to ${account.name}\nUPI ID: ${account.upiId}`,
        });
      }
    } catch (_) {}
  };

  const handleNewAmount = () => {
    if (paymentStatus === "success") {
      addPayment(amount, account.id);
    }
    navigation.navigate("Home", { resetAmount: true });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan & Pay</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Status Selector */}
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Payment Status:</Text>
        <TouchableOpacity
          style={[styles.statusChip, paymentStatus === "success" && styles.chipSuccess]}
          onPress={() => setPaymentStatus(paymentStatus === "success" ? null : "success")}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipText, paymentStatus === "success" && styles.chipTextActive]}>
            ✓ Success
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusChip, paymentStatus === "failed" && styles.chipFailed]}
          onPress={() => setPaymentStatus(paymentStatus === "failed" ? null : "failed")}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipText, paymentStatus === "failed" && styles.chipTextActive]}>
            ✗ Failed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Capturable QR card */}
      <View ref={qrCardRef} collapsable={false} style={styles.card}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amount}>₹{amount}</Text>

        <View style={styles.qrWrapper}>
          <QRCode
            value={upiString}
            size={220}
            color="#1a1a2e"
            backgroundColor="#ffffff"
            logoBackgroundColor="#ffffff"
          />
        </View>

        <View style={styles.upiRow}>
          <Text style={styles.upiLabel}>UPI ID</Text>
          <Text style={styles.upiId}>{account.name}</Text>
        </View>

        <Text style={styles.upiIdSmall}>{account.upiId}</Text>

        <Text style={styles.hint}>Open any UPI app → Scan QR → Pay</Text>

        <View style={styles.badges}>
          {["GPay", "PhonePe", "Paytm", "BHIM"].map((b) => (
            <View key={b} style={styles.badge}>
              <Text style={styles.badgeText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.newBtn, !paymentStatus && styles.newBtnDisabled]}
        onPress={handleNewAmount}
        activeOpacity={0.85}
        disabled={!paymentStatus}
      >
        <Text style={[styles.newBtnText, !paymentStatus && styles.newBtnTextDisabled]}>
          {!paymentStatus ? "Select Status to Continue" : "New Amount"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1a1a2e" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  back: { padding: 8 },
  backArrow: { color: "#fff", fontSize: 24 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  shareBtn: { padding: 8 },
  shareText: { color: "#80cbc4", fontSize: 15, fontWeight: "600" },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  statusLabel: { color: "#aaa", fontSize: 13, fontWeight: "500", flex: 1 },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#555",
  },
  chipSuccess: { borderColor: "#4caf50", backgroundColor: "#1b3a1c" },
  chipFailed: { borderColor: "#f44336", backgroundColor: "#3a1b1b" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#888" },
  chipTextActive: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  amountLabel: { fontSize: 13, color: "#888", fontWeight: "500" },
  amount: { fontSize: 42, fontWeight: "800", color: "#1a1a2e", marginBottom: 20 },

  qrWrapper: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    backgroundColor: "#fff",
  },

  upiRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  upiLabel: { fontSize: 12, color: "#888", fontWeight: "600" },
  upiId: { fontSize: 13, color: "#1a1a2e", fontWeight: "700" },
  upiIdSmall: { fontSize: 11, color: "#aaa", marginTop: 4 },

  hint: { fontSize: 12, color: "#aaa", marginTop: 14, textAlign: "center" },

  badges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, color: "#555", fontWeight: "600" },

  newBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  newBtnDisabled: { backgroundColor: "#2a2a40" },
  newBtnText: { color: "#1a1a2e", fontSize: 16, fontWeight: "700" },
  newBtnTextDisabled: { color: "#555" },
});