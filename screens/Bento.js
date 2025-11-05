import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../config";
import { ThemeContext } from "../contexts/ThemeContext";
import { useFavorites } from "../FavoritesContext";

export default function Bento() {
  const [bentos, setBentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const { darkMode } = useContext(ThemeContext);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const navigation = useNavigation();

  const theme = {
    bg: darkMode ? "#0a0a0a" : "#fafafa",
    text: darkMode ? "#fff" : "#1a1a1a",
    subtext: darkMode ? "#bbb" : "#555",
    card: darkMode ? "#1f1f1f" : "#fff",
    border: darkMode ? "#333" : "#e5e5e7",
  };

  // 🥡 Fetch Bento products
  const fetchBento = async () => {
    try {
      const res = await fetch(`${ENDPOINTS.PRODUCTS}/all`);
      const result = await res.json();
      if (result.success) {
        const filtered = result.products.filter(
          (item) => item.product_desc?.toLowerCase() === "bento"
        );
        setBentos(filtered);
      }
    } catch (err) {
      console.error("❌ Error fetching Bento:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🛒 Fetch Cart Count
  const fetchCartCount = async (userId) => {
    try {
      const res = await fetch(`${ENDPOINTS.CART}/${userId}`);
      const data = await res.json();
      if (data.success) {
        const uniqueProducts = [...new Set(data.cart.map((i) => i.productId))];
        setCartCount(uniqueProducts.length);
      }
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };

  // ➕ Add to Cart
  const addToCart = async (item) => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        Alert.alert("Login Required", "Please log in to add items to cart.");
        return;
      }

      const user = JSON.parse(storedUser);
      const payload = {
        userId: user?._id?.$oid || user?._id || user?.id,
        productId: item?._id || item?.id,
        quantity: 1,
      };

      const res = await fetch(`${ENDPOINTS.CART}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert("Added to Cart", `${item.prod_desc || item.title} added!`);
        fetchCartCount(payload.userId);

        // Store locally
        const storedCart = await AsyncStorage.getItem("cart");
        const cart = storedCart ? JSON.parse(storedCart) : [];
        cart.push(item);
        await AsyncStorage.setItem("cart", JSON.stringify(cart));
      } else {
        const message = data?.message || "Failed to add item to cart.";
        Alert.alert("Error", message);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      Alert.alert("Error", "Failed to add item to cart.");
    }
  };

  useEffect(() => {
    fetchBento();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBento();
    }, [])
  );

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#ff4b7d" />
        <Text style={{ color: theme.subtext, marginTop: 10 }}>
          Loading bentos...
        </Text>
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.bg, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
            size={26}
            color="#ff4b7d"
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Bento Specials 🍱
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Bento List */}
      {bentos.length === 0 ? (
        <View style={[styles.center, { backgroundColor: theme.bg }]}>
          <Text style={{ color: theme.subtext, fontSize: 16 }}>
            No bento meals available 🍱
          </Text>
        </View>
      ) : (
        <FlatList
          data={bentos}
          keyExtractor={(item) => item._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingHorizontal: 10,
          }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  shadowColor: darkMode ? "#000" : "#ccc",
                },
              ]}
            >
              {/* Image */}
              <Image
                source={
                  item.image_url && typeof item.image_url === "string"
                    ? { uri: item.image_url }
                    : item.image && typeof item.image === "string"
                    ? {
                        uri: item.image.startsWith("http")
                          ? item.image
                          : `${ENDPOINTS.PRODUCTS}/image/${item._id}`,
                      }
                    : require("../assets/images/1.jpg")
                }
                style={styles.cardImage}
                resizeMode="cover"
              />

              {/* Info */}
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {item.prod_desc}
              </Text>
              <Text style={[styles.cardPrice, { color: "#ff4b7d" }]}>
                ₱{item.prod_unit_price}
              </Text>

              {/* Buttons */}
              <View style={styles.cardFooter}>
                <TouchableOpacity onPress={() => {
                    if (isFavorite(item._id)) removeFavorite(item._id);
                    else addFavorite(item);
                  }}>
                  <Ionicons
                    name={isFavorite(item._id) ? "heart" : "heart-outline"}
                    size={24}
                    color="red"
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => addToCart(item)}>
                  <Ionicons name="add-circle" size={28} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 0.6,
  },
  backButton: { marginRight: 12 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
  },
  card: {
    flex: 1,
    borderRadius: 14,
    margin: 8,
    padding: 10,
    alignItems: "center",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardImage: {
    width: 150,
    height: 130,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
    marginTop: 6,
  },
});
