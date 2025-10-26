import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState, useContext } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ENDPOINTS } from "../config";
import { ThemeContext } from "../contexts/ThemeContext";

// For Expo
import { LinearGradient } from "expo-linear-gradient";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";

const Myorders = () => {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const { darkMode } = useContext(ThemeContext);

  const theme = {
    bg: darkMode ? "#121212" : "#f7f7f7",
    card: darkMode ? "#1f1f1f" : "#fff",
    text: darkMode ? "#fff" : "#000",
    subText: darkMode ? "#aaa" : "#333",
    cancelBtn: "#ff3b30",
    statusPending: "#888",
    statusCompleted: "green",
    statusCancelled: "red",
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  useFocusEffect(
    useCallback(() => {
      const loadOrders = async () => {
        try {
          setLoading(true);
          const stored = await AsyncStorage.getItem("user");
          const parsed = stored ? JSON.parse(stored) : null;

          if (parsed?._id) {
            setUser(parsed);
            const res = await fetch(`${ENDPOINTS.ORDERS}/${parsed._id}`);
            const data = await res.json();

            setOrders(
              (data.orders || []).map((o) => ({
                ...o,
                total: o.total ?? 0,
                status: o.status || "Pending",
                items: Array.isArray(o.items) ? o.items : [],
              }))
            );
          }
        } catch (e) {
          console.error("Load orders error:", e);
          Alert.alert("Error", "Failed to load orders.");
        } finally {
          setLoading(false);
        }
      };

      loadOrders();
    }, [])
  );

  const cancelOrder = async (orderId) => {
    if (!user?._id) return Alert.alert("Error", "You must be logged in.");
    setCancellingOrderId(orderId); // start loading for this order

    try {
      const res = await fetch(
        `${ENDPOINTS.ORDERS}/${user._id}/${orderId}/cancel`,
        { method: "PATCH" }
      );
      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      const refresh = await fetch(`${ENDPOINTS.ORDERS}/${user._id}`);
      const refreshed = await refresh.json();
      setOrders(
        (refreshed.orders || []).map((o) => ({
          ...o,
          total: o.total ?? 0,
          status: o.status || "Pending",
          items: Array.isArray(o.items) ? o.items : [],
        }))
      );

      Alert.alert("Cancelled", "Order cancelled successfully");
    } catch (e) {
      console.error("Cancel order error:", e);
      Alert.alert("Error", e.message || "Failed to cancel order.");
    } finally {
      setCancellingOrderId(null); // stop loading
    }
  };

  const SkeletonLoader = ({ count = 10 }) => (
    <View style={{ paddingHorizontal: 16 }}>
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          style={[styles.card, { backgroundColor: theme.card, marginBottom: 12 }]}
        >
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: "40%", height: 16, borderRadius: 4, marginBottom: 8 }}
            shimmerColors={darkMode ? ["#333", "#444", "#333"] : undefined}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: "20%", height: 16, borderRadius: 4, marginBottom: 12 }}
            shimmerColors={darkMode ? ["#333", "#444", "#333"] : undefined}
          />
          {Array.from({ length: 3 }).map((__, itemIdx) => (
            <ShimmerPlaceHolder
              key={itemIdx}
              LinearGradient={LinearGradient}
              style={{ width: `${40 + itemIdx * 15}%`, height: 12, borderRadius: 4, marginBottom: 6 }}
              shimmerColors={darkMode ? ["#333", "#444", "#333"] : undefined}
            />
          ))}
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: "30%", height: 16, borderRadius: 4, marginTop: 6, marginBottom: 6 }}
            shimmerColors={darkMode ? ["#333", "#444", "#333"] : undefined}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: "25%", height: 30, borderRadius: 6, marginTop: 6 }}
            shimmerColors={darkMode ? ["#333", "#444", "#333"] : undefined}
          />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.header, { color: theme.text }]}>My Orders</Text>

      {loading ? (
        <SkeletonLoader count={10} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {orders.length === 0 ? (
            <Text style={{ textAlign: "center", marginTop: 20, color: theme.subText }}>
              No orders yet
            </Text>
          ) : (
            orders.map((o) => (
              <View key={o._id} style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "600", color: theme.text }}>
                    Order #{o._id?.slice(-6) || "------"}
                  </Text>
                  <Text
                    style={{
                      color:
                        o.status === "Cancelled"
                          ? theme.statusCancelled
                          : o.status === "Completed"
                          ? theme.statusCompleted
                          : theme.statusPending,
                    }}
                  >
                    {o.status}
                  </Text>
                </View>

                {o.items.length > 0 ? (
                  o.items.map((i, idx) => (
                    <Text key={idx} style={{ color: theme.subText }}>
                      {i.title || "Untitled"} × {i.quantity || 1}
                    </Text>
                  ))
                ) : (
                  <Text style={{ color: theme.subText }}>No items in this order</Text>
                )}

                <Text style={{ marginTop: 6, color: theme.text }}>
                  Total: ₱{formatCurrency(o.total)}
                </Text>

                {o.status !== "Cancelled" && (
                  <TouchableOpacity
                    style={[styles.cancelBtn, { backgroundColor: theme.cancelBtn }]}
                    onPress={() => cancelOrder(o._id)}
                    disabled={cancellingOrderId === o._id} // disable button while cancelling
                  >
                    {cancellingOrderId === o._id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                        Cancel
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 22, fontWeight: "bold", margin: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelBtn: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
});

export default Myorders;
