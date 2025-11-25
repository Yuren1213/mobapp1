import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { ThemeContext } from "../contexts/ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Notifications() {
  const navigation = useNavigation();
  const { darkMode } = useContext(ThemeContext);

  const theme = {
    bg: darkMode ? "#0B0B0B" : "#FAFAFA",
    card: darkMode ? "#1C1C1E" : "#FFFFFF",
    text: darkMode ? "#F5F5F5" : "#1C1C1E",
    subText: darkMode ? "#A1A1A1" : "#666",
    primary: darkMode ? "#3B82F6" : "#2563EB",
    danger: darkMode ? "#F87171" : "#DC2626",
    border: darkMode ? "#2C2C2E" : "#E5E5E5",
  };

  const [fullList, setFullList] = useState([]);
  const [visibleList, setVisibleList] = useState([]);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 10;

  useEffect(() => {
    loadNotifications();
  }, []);

  // 🔥 FIX: always extract real order number and apply to message
  const formatNotificationText = (notif) => {
    // Try to get order number from any field
    const orderNumber =
      notif.orderId ||
      notif.order_id ||
      notif.order ||
      notif.id ||
      null;

    let finalMessage = notif.message || "";

    // If order number exists → force insert into message
    if (orderNumber) {
      finalMessage = finalMessage.replace(/#undefined/gi, `#${orderNumber}`);
      finalMessage = finalMessage.replace(/#null/gi, `#${orderNumber}`);

      // If the message has no "#..." at all, add one
      if (!finalMessage.includes(`#${orderNumber}`)) {
        finalMessage = `Order #${orderNumber}: ${finalMessage}`;
      }
    }

    return finalMessage.trim();
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem("notifications");
      const data = stored ? JSON.parse(stored) : [];

      // FIX: rebuild each message with real order number
      const fixed = data.map((n) => ({
        ...n,
        message: formatNotificationText(n),
      }));

      setFullList(fixed);
      setVisibleList(fixed.slice(0, PAGE_SIZE));
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (visibleList.length >= fullList.length) return;

    const next = fullList.slice(
      visibleList.length,
      visibleList.length + PAGE_SIZE
    );

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setVisibleList([...visibleList, ...next]);
  };

  const clearNotifications = async () => {
    Alert.alert("Clear All", "Delete all notifications?", [
      { text: "Cancel" },
      {
        text: "Yes",
        onPress: async () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          await AsyncStorage.removeItem("notifications");
          setFullList([]);
          setVisibleList([]);
        },
      },
    ]);
  };

  const deleteNotification = async (id) => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const updated = fullList.filter((notif) => notif._id !== id);

      setFullList(updated);
      setVisibleList(
        updated.slice(0, Math.max(visibleList.length - 1, PAGE_SIZE))
      );

      await AsyncStorage.setItem("notifications", JSON.stringify(updated));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case "completed":
        return "#4ADE80";
      case "pending":
        return "#FACC15";
      case "cancelled":
        return "#F87171";
      default:
        return theme.subText;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View
        style={[
          styles.headerContainer,
          { borderBottomColor: theme.border, backgroundColor: theme.bg },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Notifications
        </Text>

        {fullList.length > 0 ? (
          <TouchableOpacity onPress={clearNotifications} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={22} color={theme.danger} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.subText }]}>
            Loading...
          </Text>
        </View>
      ) : visibleList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={60}
            color={theme.subText}
          />
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            No notifications yet
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator
          contentContainerStyle={{ paddingBottom: 50 }}
          onMomentumScrollEnd={(e) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              e.nativeEvent;

            const isBottom =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 20;

            if (isBottom) loadMore();
          }}
        >
          {visibleList.map((notif, index) => (
            <View
              key={notif._id || index}
              style={[
                styles.notificationCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: darkMode ? "#000" : "#999",
                },
              ]}
            >
              <View style={styles.notifHeader}>
                <View style={styles.iconTextContainer}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: getStatusColor(notif.type) + "33" },
                    ]}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color={getStatusColor(notif.type)}
                    />
                  </View>

                  {/* FIXED FINAL MESSAGE WITH REAL ORDER # */}
                  <Text style={[styles.message, { color: theme.text }]}>
                    {formatNotificationText(notif)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => deleteNotification(notif._id)}
                >
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color={theme.subText}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.date, { color: theme.subText }]}>
                {new Date(notif.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}

          {visibleList.length < fullList.length && (
            <View style={{ padding: 15, alignItems: "center" }}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text
                style={{ marginTop: 6, color: theme.subText, fontSize: 13 }}
              >
                Loading more...
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    marginTop: 40,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  clearBtn: { padding: 4 },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  notificationCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  message: { flex: 1, marginLeft: 10, fontSize: 15.5, lineHeight: 20 },
  date: { fontSize: 12.5, marginTop: 6, fontWeight: "400" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { marginTop: 10, fontSize: 16, fontWeight: "500" },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { marginTop: 8, fontSize: 14 },
});
