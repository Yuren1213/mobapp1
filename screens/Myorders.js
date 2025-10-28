import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
  useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ENDPOINTS = {
  ORDERS: "https://untooled-rostrally-trent.ngrok-free.dev/api/orders",
};

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [user, setUser] = useState(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    const loadUserAndOrders = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (!userData) {
          Alert.alert("Error", "No user found. Please log in again.");
          return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchOrders(parsedUser.id);
      } catch (err) {
        console.error("Error loading user:", err);
      }
    };
    loadUserAndOrders();
  }, []);

  const fetchOrders = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${ENDPOINTS.ORDERS}/user/${userId}`);
      const rawText = await response.text();
      const data = JSON.parse(rawText);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      Alert.alert("Error", "Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchOrders(user.id);
    setRefreshing(false);
  };

  // ✅ Cancel order and push notification locally
  const cancelOrder = async (orderId) => {
    if (!user) return;
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const res = await fetch(
              `${ENDPOINTS.ORDERS}/${user.id}/${orderId}/cancel`,
              { method: "PATCH" }
            );
            const rawText = await res.text();
            const data = JSON.parse(rawText);

            if (data.success) {
              Alert.alert("Success", "Order cancelled successfully!");
              fetchOrders(user.id);

              // ✅ Save a notification locally
              const newNotif = {
                _id: Date.now().toString(),
                type: "cancelled",
                message: `Your order #${orderId} was cancelled.`,
                createdAt: new Date().toISOString(),
              };

              const existing = await AsyncStorage.getItem("notifications");
              const parsed = existing ? JSON.parse(existing) : [];
              parsed.unshift(newNotif); // Add new notif to the top
              await AsyncStorage.setItem(
                "notifications",
                JSON.stringify(parsed)
              );
            } else {
              Alert.alert("Error", data.message || "Failed to cancel order.");
            }
          } catch (err) {
            console.error("Cancel order error:", err);
            Alert.alert("Error", "Network error: " + err.message);
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading orders...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        style={[styles.container, { backgroundColor: theme.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <Text style={[styles.header, { color: theme.textPrimary }]}>
          My Orders
        </Text>

        {orders.length === 0 ? (
          <Text style={[styles.noOrdersText, { color: theme.textSecondary }]}>
            You have no orders yet.
          </Text>
        ) : (
          orders.map((order) => {
            const isExpanded = expanded === order.id || expanded === order._id;
            const orderId = order._id || order.id;

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
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderId, { color: theme.textPrimary }]}>
                    #{orderId}
                  </Text>
                  <Text style={[styles.statusBadge, statusStyle]}>
                    {order.status}
                  </Text>
                </View>

                <View style={styles.orderSummary}>
                  <Text style={[styles.orderTotal, { color: theme.textPrimary }]}>
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
                  style={[
                    styles.expandButton,
                    { backgroundColor: theme.expandBackground },
                  ]}
                >
                  <Text
                    style={[styles.expandButtonText, { color: theme.primary }]}
                  >
                    {isExpanded ? "Hide Items ▲" : "View Items ▼"}
                  </Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View
                    style={[
                      styles.itemsContainer,
                      {
                        backgroundColor: theme.itemsBackground,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    {order.items?.map((item, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.itemRow,
                          idx === order.items.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.itemTitle, { color: theme.textPrimary }]}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={[styles.itemPrice, { color: theme.textPrimary }]}
                        >
                          ₱{item.price} × {item.quantity}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {order.status === "Pending" && (
                  <TouchableOpacity
                    onPress={() => cancelOrder(orderId)}
                    style={[
                      styles.cancelButton,
                      {
                        backgroundColor: theme.cancelButton,
                        marginBottom: 8,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cancelButtonText,
                        { color: theme.cancelButtonText },
                      ]}
                    >
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

// Themes
const lightTheme = {
  background: "#F9FAFB",
  cardBackground: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  primary: "#2563EB",
  expandBackground: "#DBEAFE",
  itemsBackground: "#F3F4F6",
  cancelButton: "#DC2626",
  cancelButtonText: "#FFFFFF",
  statusPending: { backgroundColor: "#FEF3C7", color: "#B45309" },
  statusCancelled: { backgroundColor: "#FEE2E2", color: "#B91C1C" },
  statusCompleted: { backgroundColor: "#D1FAE5", color: "#047857" },
  statusDefault: { backgroundColor: "#E5E7EB", color: "#374151" },
};

const darkTheme = {
  background: "#1F2937",
  cardBackground: "#374151",
  textPrimary: "#F9FAFB",
  textSecondary: "#D1D5DB",
  border: "#4B5563",
  primary: "#60A5FA",
  expandBackground: "#2563EB33",
  itemsBackground: "#4B5563",
  cancelButton: "#DC2626",
  cancelButtonText: "#F9FAFB",
  statusPending: { backgroundColor: "#78350F", color: "#FBBF24" },
  statusCancelled: { backgroundColor: "#7F1D1D", color: "#FECACA" },
  statusCompleted: { backgroundColor: "#064E3B", color: "#BBF7D0" },
  statusDefault: { backgroundColor: "#374151", color: "#D1D5DB" },
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, fontSize: 16 },
  header: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  noOrdersText: { fontSize: 16, textAlign: "center", marginTop: 40 },
  orderCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderId: { fontWeight: "700", fontSize: 16 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, fontSize: 12, fontWeight: "600" },
  orderSummary: { marginBottom: 8 },
  orderTotal: { fontSize: 14, fontWeight: "600" },
  orderDate: { fontSize: 12 },
  expandButton: { marginTop: 4, paddingVertical: 8, borderRadius: 12 },
  expandButtonText: { textAlign: "center", fontWeight: "600", fontSize: 14 },
  itemsContainer: { marginTop: 8, borderRadius: 12, padding: 8, borderWidth: 1 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1 },
  itemTitle: { fontSize: 14 },
  itemPrice: { fontSize: 14 },
  cancelButton: { paddingVertical: 12, borderRadius: 16, marginTop: 12 },
  cancelButtonText: { textAlign: "center", fontWeight: "600", fontSize: 16 },
});
