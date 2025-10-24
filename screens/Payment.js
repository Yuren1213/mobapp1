import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../contexts/ThemeContext";

const BACKEND_URL = "http://192.168.100.181:5000"; // your server IP

const Payment = () => {
  const { darkMode } = useContext(ThemeContext);

  const theme = {
    bg: darkMode ? "#121212" : "#ffe6e6",
    text: darkMode ? "#fff" : "#000",
    subText: darkMode ? "#aaa" : "#000",
    cardBg: darkMode ? "#1f1f1f" : "#fff",
    buttonBg: "deeppink",
    buttonDisabled: "#555",
  };

  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      const storedCart = await AsyncStorage.getItem("cart");
      const parsedCart = storedCart ? JSON.parse(storedCart) : [];
      setCart(parsedCart);
      const cartTotal = parsedCart.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
      );
      setTotal(cartTotal);
    };
    loadCart();
  }, []);

  const handleGCashPayment = async () => {
    if (cart.length === 0) {
      Alert.alert("Cart is empty", "Add items before paying.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BACKEND_URL}/api/payment/gcash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total }),
      });

      if (!response.ok) {
        throw new Error("Server error. Try again.");
      }

      const data = await response.json();
      const checkoutUrl = data.checkoutUrl;

      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        Linking.openURL(checkoutUrl);
      } else {
        Alert.alert(
          "GCash not installed",
          "Please install the GCash app to complete payment."
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Payment Failed", err.message || "Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.text }]}>Order Summary</Text>

      {cart.map((item) => (
        <View key={item.id} style={[styles.itemRow, { backgroundColor: theme.cardBg }]}>
          <Text style={{ color: theme.text }}>{item.title} x{item.quantity}</Text>
          <Text style={{ color: theme.text }}>₱{item.price * (item.quantity || 1)}</Text>
        </View>
      ))}

      <View style={[styles.totalRow, { borderColor: darkMode ? "#333" : "#ddd" }]}>
        <Text style={[styles.totalText, { color: theme.text }]}>Total</Text>
        <Text style={[styles.totalText, { color: theme.text }]}>₱{total}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.payButton,
          { backgroundColor: total > 0 ? theme.buttonBg : theme.buttonDisabled },
        ]}
        disabled={total <= 0 || loading}
        onPress={handleGCashPayment}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payButtonText}>Pay with GCash</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, padding: 10, borderRadius: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 15, borderTopWidth: 1, paddingTop: 10 },
  totalText: { fontWeight: "bold", fontSize: 16 },
  payButton: { marginTop: 30, paddingVertical: 15, borderRadius: 10, alignItems: "center" },
  payButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default Payment;
