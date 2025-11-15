import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../contexts/ThemeContext";
import { ENDPOINTS, API_URL } from "../config"; // Use your config

const POLL_INTERVAL = 1500;

const blackTheme = {
  bg: "#000000",
  card: "rgba(30,30,30,0.6)",
  border: "rgba(255,255,255,0.2)",
  textPrimary: "#FFFFFF",
  textSecondary: "#AAAAAA",
  primary: "#3B82F6",
  statusDefault: { color: "#CCCCCC" },
  statusPending: { color: "#FACC15" },
  statusCompleted: { color: "#4ADE80" },
  statusCancelled: { color: "#F87171" },
  expandBackground: "rgba(255,255,255,0.12)",
  itemsBackground: "rgba(20,20,20,0.6)",
  cancelButton: "#FF3B30",
  cancelButtonText: "#FFFFFF",
};

const lightTheme = {
  bg: "#FFFFFF",
  card: "rgba(255,255,255,0.7)",
  border: "rgba(200,200,200,0.3)",
  textPrimary: "#111111",
  textSecondary: "#555555",
  primary: "#007AFF",
  statusDefault: { color: "#666666" },
  statusPending: { color: "#F59E0B" },
  statusCompleted: { color: "#16A34A" },
  statusCancelled: { color: "#DC2626" },
  expandBackground: "rgba(240,240,240,0.8)",
  itemsBackground: "#FFFFFF",
  cancelButton: "#FF3B30",
  cancelButtonText: "#FFFFFF",
};

export default function MyOrders() {
  const navigation = useNavigation();
  const { darkMode } = useContext(ThemeContext);
  const theme = darkMode ? blackTheme : lightTheme;

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [user, setUser] = useState(null);
  const previousOrdersRef = useRef({});

  const ordersUrl =
    ENDPOINTS?.ORDERS || ENDPOINTS?.AUTH?.replace("/auth", "/orders");

  // 🔹 Fetch all products first
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/Product/all`);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // 🔹 Merge order items with products to get real images
  const mergeOrderWithProducts = (orderItems) => {
    return orderItems.map((item) => {
      const prod = products.find(
        (p) => p._id === item.productId || p.id === item.productId
      );
      return {
        ...item,
        title: item.title || prod?.prod_desc || prod?.title,
        price: item.price || prod?.prod_unit_price || prod?.price,
        image_url: item.image_url || prod?.image_url || prod?.image,
      };
    });
  };

  const fetchOrders = async (userId, silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${ordersUrl}/user/${userId}`);
      const text = await res.text();
      let newOrders = JSON.parse(text);
      if (!Array.isArray(newOrders)) newOrders = [];

      // Merge images from products
      newOrders.forEach((order) => {
        order.items = mergeOrderWithProducts(order.items || []);
      });

      setOrders(newOrders);

      // Notify on status change
      for (const order of newOrders) {
        const prevStatus = previousOrdersRef.current[order._id];
        if (prevStatus && prevStatus !== order.status) {
          await createLocalNotification(order);
        }
        previousOrdersRef.current[order._id] = order.status;
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const createLocalNotification = async (order) => {
    try {
      const notif = {
        _id: `${order._id}-${Date.now()}`,
        orderId: order._id,
        message: `Your order #${order._id} status changed to ${order.status}.`,
        type: order.status.toLowerCase(),
        createdAt: new Date().toISOString(),
      };
      const stored = await AsyncStorage.getItem("notifications");
      const existing = stored ? JSON.parse(stored) : [];
      existing.unshift(notif);
      await AsyncStorage.setItem("notifications", JSON.stringify(existing));
    } catch (err) {
      console.error("Save notification error:", err);
    }
  };

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchOrders(user.id);
    setRefreshing(false);
  };

  const cancelOrder = async (orderId) => {
    if (!user) return;
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const res = await fetch(
              `${ordersUrl}/${user.id}/${orderId}/cancel`,
              { method: "PATCH" }
            );
            const data = await res.json();
            if (data.success || res.ok) {
              Alert.alert("Success", "Order cancelled successfully!");
              fetchOrders(user.id);
              await createLocalNotification({
                _id: orderId,
                status: "Cancelled",
              });
            } else {
              Alert.alert("Error", data.message || "Failed to cancel");
            }
          } catch (err) {
            console.error("Cancel order error:", err);
          }
        },
      },
    ]);
  };

  const getSafeImage = (item) =>
    item.image_url
      ? { uri: item.image_url }
      : item.image
      ? { uri: item.image }
      : require("../assets/images/1.jpg");

  // 🔹 Load user and initial data
  useEffect(() => {
    const loadUserAndData = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        Alert.alert("Error", "No user found. Please log in again.");
        return;
      }
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      await fetchProducts(); // fetch products first
      fetchOrders(parsedUser.id); // then fetch orders
    };
    loadUserAndData();
  }, []);

  // 🔹 Polling for real-time updates
  useEffect(() => {
    if (!user || products.length === 0) return;
    const interval = setInterval(() => {
      fetchOrders(user.id, true);
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, products]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading orders...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: theme.bg, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.header, { color: theme.textPrimary }]}>
            My Orders
          </Text>
        </View>

        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        style={[styles.container, { backgroundColor: theme.bg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {orders.length === 0 ? (
          <Text style={[styles.noOrdersText, { color: theme.textSecondary }]}>
            You have no orders yet.
          </Text>
        ) : (
          orders.map((order) => {
            const orderId = order._id || order.id;
            const isExpanded = expanded === orderId;

            let statusStyle = theme.statusDefault;
            if (order.status === "Pending") statusStyle = theme.statusPending;
            if (order.status === "Cancelled")
              statusStyle = theme.statusCancelled;
            if (order.status === "Completed")
              statusStyle = theme.statusCompleted;

            return (
              <View
                key={orderId}
                style={[
                  styles.orderCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderId, { color: theme.textPrimary }]}>
                    #{orderId}
                  </Text>
                  <Text
                    style={[styles.statusBadge, { color: statusStyle.color }]}
                  >
                    {order.status}
                  </Text>
                </View>

                <View style={styles.orderSummary}>
                  <Text
                    style={[styles.orderTotal, { color: theme.textPrimary }]}
                  >
                    Total: ₱{order.total?.toFixed(2)}
                  </Text>
                  <Text
                    style={[styles.orderDate, { color: theme.textSecondary }]}
                  >
                    Date:{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : "N/A"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setExpanded(isExpanded ? null : orderId)}
                  style={[styles.expandButton, { backgroundColor: theme.expandBackground }]}
                >
                  <Text style={[styles.expandButtonText, { color: theme.primary }]}>
                    {isExpanded ? "Hide Items ▲" : "View Items ▼"}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View
                    style={[
                      styles.itemsContainer,
                      { backgroundColor: theme.itemsBackground, borderColor: theme.border },
                    ]}
                  >
                    {order.items?.map((item, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.itemRow,
                          idx === order.items.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                          <Image
                            source={getSafeImage(item)}
                            style={styles.itemImage}
                            resizeMode="cover"
                          />
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>
                              {item.title || item.name || item.prod_desc}
                            </Text>
                            <Text style={{ color: theme.textSecondary }}>
                              ₱{item.price} × {item.quantity || 1}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {order.status === "Pending" && (
                  <TouchableOpacity
                    onPress={() => cancelOrder(orderId)}
                    style={[styles.cancelButton]}
                  >
                    <Text style={[styles.cancelButtonText]}>
                      Cancel Order
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerContainer: { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingBottom: 14, paddingHorizontal: 18, borderBottomWidth: 0.5 },
  backButton: { marginRight: 10 },
  header: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  noOrdersText: { textAlign: "center", marginTop: 120, fontSize: 16, opacity: 0.6 },
  orderCard: { borderRadius: 20, padding: 16, marginBottom: 18, borderWidth: 0.5, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  orderId: { fontWeight: "700", fontSize: 17, letterSpacing: 0.3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, overflow: "hidden", fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  orderSummary: { marginBottom: 10 },
  orderTotal: { fontWeight: "700", fontSize: 16 },
  orderDate: { fontSize: 13, opacity: 0.7 },
  expandButton: { padding: 10, borderRadius: 10, alignItems: "center", marginTop: 10 },
  expandButtonText: { fontWeight: "600", fontSize: 14 },
  itemsContainer: { marginTop: 10, borderWidth: 0.6, borderRadius: 12, padding: 10 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 0.5 },
  itemImage: { width: 50, height: 50, borderRadius: 8 },
  itemTitle: { fontSize: 15, fontWeight: "600" },
  cancelButton: { marginTop: 12, padding: 12, borderRadius: 12, alignItems: "center", backgroundColor: "#FF3B30" },
  cancelButtonText: { fontWeight: "700", color: "#fff", fontSize: 15 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, opacity: 0.7 },
});
