import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

const Landing = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { food } = route.params || {};

  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);

  // 🧠 Load Cart Info whenever focused
  useFocusEffect(
    useCallback(() => {
      const loadCart = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("user");
          const user = storedUser ? JSON.parse(storedUser) : null;
          const storedCart = await AsyncStorage.getItem("cart");
          const items = storedCart ? JSON.parse(storedCart) : [];
          setCartItems(items);
          setCartCount(items.reduce((sum, item) => sum + (item.quantity || 1), 0));
        } catch (err) {
          console.error("Error loading cart:", err);
        }
      };
      loadCart();
    }, [])
  );

  if (!food) {
    return (
      <View style={styles.container}>
        <Text>No item selected</Text>
      </View>
    );
  }

  // 🧮 Handle both local & backend images
  const imageSource =
    food.image && typeof food.image !== "string"
      ? food.image // local require()
      : food.image_url
      ? { uri: food.image_url } // from backend
      : require("../assets/images/1.jpg"); // fallback image

  // ✅ Handle both API and local sample products
  const foodName = food.title || food.prod_desc || "Unnamed Product";
  const foodPrice = food.price || food.prod_unit_price || 0;
  const totalPrice = foodPrice * quantity;

  // 🛒 Add to Cart
  const addToCart = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (!user) {
        Alert.alert("Login Required", "Please login to add items to your cart.");
        return;
      }

      const storedCart = await AsyncStorage.getItem("cart");
      let cart = storedCart ? JSON.parse(storedCart) : [];

      const existingIndex = cart.findIndex(
        (item) => item._id === food._id || item.id === food.id
      );

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
      } else {
        cart.push({
          ...food,
          quantity,
          title: foodName,
          price: foodPrice,
          image_url: food.image_url,
        });
      }

      await AsyncStorage.setItem("cart", JSON.stringify(cart));
      setCartItems(cart);
      setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 1), 0));

      // Optional: Sync to backend
      if (user._id) {
        await fetch(`${API_URL}/cart/${user._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart }),
        });
      }

      Alert.alert("Added to Cart", `${foodName} added successfully!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart.");
    }
  };

  // ⚡ Go to Checkout Page
  const orderNow = () => {
    navigation.navigate("Checkoutlist", {
      items: [{ ...food, quantity }],
      subtotal: totalPrice,
      shippingFee: 50,
      total: totalPrice + 50,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Details</Text>

        <TouchableOpacity style={styles.cartIcon} onPress={() => navigation.navigate("Cart")}>
          <Ionicons name="cart" size={28} color="black" />
          {cartCount > 0 && (
            <View style={styles.redDot}>
              <Text style={styles.cartBadge}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Image */}
      <Image source={imageSource} style={styles.foodImage} resizeMode="cover" />

      {/* Product Info */}
      <Text style={styles.foodTitle}>{foodName}</Text>
      <Text style={styles.foodPrice}>₱{foodPrice}</Text>

      <View style={styles.row}>
        <Ionicons name="time-outline" size={16} color="gray" />
        <Text style={styles.timeText}>20–30 mins</Text>
      </View>

      <Text style={styles.servingLabel}>Single Servings</Text>
      <View style={styles.separator} />

      {/* Quantity Controls */}
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
        >
          <Text style={styles.qtyText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.qtyNumber}>{quantity}</Text>

        <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity(quantity + 1)}>
          <Text style={styles.qtyText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>Total</Text>
        <Text style={styles.totalPrice}>₱{totalPrice}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.addToCart} onPress={addToCart}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.orderNow} onPress={orderNow}>
          <Text style={styles.orderNowText}>Order Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
    marginTop: 40,
  },
  backButton: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", flex: 1 },
  cartIcon: { width: 40, alignItems: "flex-end" },
  redDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "red",
    position: "absolute",
    right: -10,
    top: -5,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadge: { color: "#fff", fontSize: 10, fontWeight: "bold" },

  foodImage: { width: "100%", height: 220, borderRadius: 12, marginBottom: 15 },
  foodTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  foodPrice: { fontSize: 18, color: "gray", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  timeText: { marginLeft: 4, color: "gray" },
  servingLabel: { fontSize: 14, color: "black", marginTop: 8 },
  separator: { height: 1, backgroundColor: "#ccc", marginVertical: 8 },

  quantityContainer: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  qtyButton: { borderWidth: 1, borderColor: "#999", borderRadius: 4, paddingHorizontal: 15, paddingVertical: 5 },
  qtyText: { fontSize: 18 },
  qtyNumber: { fontSize: 16, marginHorizontal: 15 },

  totalRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  totalText: { fontSize: 18 },
  totalPrice: { fontSize: 18, fontWeight: "bold" },

  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  addToCart: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  addToCartText: { fontSize: 16, fontWeight: "bold", color: "black" },
  orderNow: {
    flex: 1,
    backgroundColor: "black",
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  orderNowText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
});

export default Landing;
