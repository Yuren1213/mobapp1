import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Checkbox from "expo-checkbox";
import { useCallback, useContext, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../contexts/ThemeContext";

const BACKEND_URL = "https://posbackend-1-o9uk.onrender.com/uploads/";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigation = useNavigation();
  const { darkMode } = useContext(ThemeContext);

  // Load cart from AsyncStorage when screen focuses
  useFocusEffect(
  useCallback(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem("cart");
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart).map(item => ({
            ...item,
            quantity: Number(item.quantity) || 1, // ✅ Ensure it's a number
          }));
          setCartItems(parsedCart);
          setSelectedItems(new Array(parsedCart.length).fill(false));
        } else {
          setCartItems([]);
          setSelectedItems([]);
        }
      } catch (err) {
        console.error("Error loading cart:", err);
      }
    };
    loadCart();
  }, [])
);


  // Update quantity (increase/decrease)
  const updateQuantity = async (index, change) => {
    try {
      const updatedCart = [...cartItems];
      const currentQty = Number(updatedCart[index].quantity) || 1;
      const maxQty = updatedCart[index].prod_qty || Infinity;

      let newQty = currentQty + change;
      if (newQty < 1) newQty = 1;
      if (newQty > maxQty) newQty = maxQty;

      updatedCart[index].quantity = newQty;

      setCartItems(updatedCart);
      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  // Remove a specific item
  const removeItem = async (index) => {
    try {
      const updatedCart = [...cartItems];
      updatedCart.splice(index, 1);
      const updatedSelected = [...selectedItems];
      updatedSelected.splice(index, 1);
      setCartItems(updatedCart);
      setSelectedItems(updatedSelected);
      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
      Alert.alert("Removed", "Item removed from cart");
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  // Select/unselect one item
  const toggleSelection = (index) => {
    const updatedSelection = [...selectedItems];
    updatedSelection[index] = !updatedSelection[index];
    setSelectedItems(updatedSelection);
  };

  // Select/unselect all
  const toggleSelectAll = () => {
    const allSelected = selectedItems.every((sel) => sel);
    setSelectedItems(new Array(cartItems.length).fill(!allSelected));
  };

  // Calculate subtotal for selected items only
  const subtotal = cartItems.reduce((sum, item, idx) => {
    const qty = Number(item.quantity) || 1; // ensure number
    if (selectedItems[idx]) return sum + (item.prod_unit_price || item.price || 0) * qty;
    return sum;
  }, 0);

  const shippingFee = subtotal > 0 ? 50 : 0;
  const anySelected = selectedItems.some((s) => s);

  // Proceed to Checkout Screen
  const handleCheckout = async () => {
    try {
      if (!anySelected) {
        Alert.alert("No Items Selected", "Please select at least one item.");
        return;
      }

      const storedUser = await AsyncStorage.getItem("user");
      let user = null;

      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch (e) {
          console.error("Failed to parse user:", e);
          user = null;
        }
      }

      const userId = user?._id || user?.id || null;

      if (!userId) {
        Alert.alert("Login Required", "Please log in to place an order.");
        return;
      }

      const itemsToBuy = cartItems.filter((_, index) => selectedItems[index]);
      if (itemsToBuy.length === 0) {
        Alert.alert("No Items Selected", "Please select at least one item.");
        return;
      }

      navigation.navigate("Checkoutlist", {
        items: itemsToBuy,
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
      });
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  const theme = {
    bg: darkMode ? "#121212" : "#f2f2f2",
    headerBg: darkMode ? "#1f1f1f" : "#fff",
    text: darkMode ? "#fff" : "#333",
    subText: darkMode ? "#aaa" : "#666",
    card: darkMode ? "#1f1f1f" : "#fff",
    border: darkMode ? "#333" : "#ddd",
    activeCheckbox: darkMode ? "#ff007f" : "#000",
    checkoutBtn: "#ff007f",
    disabledBtn: darkMode ? "#555" : "#ccc",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <SafeAreaView
        edges={["top"]}
        style={[styles.header, { backgroundColor: theme.headerBg, borderColor: theme.border }]}
      >
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Cart</Text>
      </SafeAreaView>

      {/* Cart items */}
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        {cartItems.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Your cart is empty
          </Text>
        ) : (
          cartItems.map((item, index) => {
            const qty = Number(item.quantity) || 1; // ensure number
            return (
              <View
                key={index}
                style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <TouchableOpacity style={styles.closeBtn} onPress={() => removeItem(index)}>
                  <Text style={[styles.closeText, { color: theme.text }]}>×</Text>
                </TouchableOpacity>

                <Checkbox
                  value={selectedItems[index]}
                  onValueChange={() => toggleSelection(index)}
                  style={styles.checkbox}
                  color={selectedItems[index] ? theme.activeCheckbox : undefined}
                />

                <Image
                  source={{
                    uri:
                      item.image_url ||
                      (item.image
                        ? `${BACKEND_URL}${item.image}`
                        : "https://via.placeholder.com/100x80.png?text=No+Image"),
                  }}
                  style={styles.image}
                />

                <View style={styles.info}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {item.prod_desc || item.title || "Unnamed Item"}
                  </Text>
                  <Text style={[styles.price, { color: theme.subText }]}>
                    ₱{item.prod_unit_price || item.price || 0}
                  </Text>
                </View>

                <View style={styles.quantityContainer}>
                  <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(index, -1)}>
                    <Text style={[styles.qtyText, { color: theme.text }]}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.qtyNumber, { color: theme.text }]}>{qty}</Text>
                  <TouchableOpacity
                    style={[
                      styles.qtyButton,
                      styles.qtyButtonPlus,
                      { opacity: qty >= (item.prod_qty || Infinity) ? 0.5 : 1 },
                    ]}
                    onPress={() => updateQuantity(index, 1)}
                    disabled={qty >= (item.prod_qty || Infinity)}
                  >
                    <Text style={[styles.qtyText, { color: theme.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.selectAllContainer}>
          <Checkbox
            value={selectedItems.length > 0 && selectedItems.every((s) => s)}
            onValueChange={toggleSelectAll}
            color={theme.activeCheckbox}
          />
          <Text style={[{ color: theme.text, marginLeft: 6 }]}>All</Text>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={[styles.subtotalText, { color: theme.text }]}>
            Subtotal:{" "}
            <Text style={{ color: "red", fontWeight: "bold" }}>₱{subtotal.toFixed(2)}</Text>
          </Text>
          <Text style={[styles.shippingText, { color: theme.subText }]}>
            Shipping Fee: <Text style={{ color: "red" }}>₱{shippingFee.toFixed(2)}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: anySelected ? theme.checkoutBtn : theme.disabledBtn }]}
          onPress={handleCheckout}
          disabled={!anySelected}
        >
          <Text style={styles.checkoutText}>Check Out ({selectedItems.filter((s) => s).length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { flexDirection: "row", alignItems: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "bold", marginRight: 40 },
  emptyText: { fontSize: 16, textAlign: "center", marginTop: 20 },
  item: { position: "relative", flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginVertical: 5, borderRadius: 10, padding: 20, borderWidth: 1 },
  image: { width: 100, height: 80, borderRadius: 8 },
  info: { flex: 1, marginLeft: 10 },
  title: { fontSize: 16, fontWeight: "bold" },
  price: { fontSize: 14, marginTop: 5 },
  quantityContainer: { flexDirection: "row", alignItems: "center", marginHorizontal: 10 },
  qtyButton: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  qtyText: { fontSize: 16 },
  qtyNumber: { fontSize: 16, marginHorizontal: 6 },
  closeBtn: { position: "absolute", top: 5, right: 9, width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  closeText: { fontSize: 20, fontWeight: "bold", lineHeight: 20 },
  checkbox: { marginRight: 10 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, position: "absolute", bottom: 45, left: 0, right: 0 },
  selectAllContainer: { flexDirection: "row", alignItems: "center" },
  summaryContainer: { flex: 1, marginLeft: 10 },
  subtotalText: { fontSize: 14, fontWeight: "bold" },
  shippingText: { fontSize: 12 },
  checkoutBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  checkoutText: { color: "#fff", fontWeight: "bold" },
});

export default Cart;
