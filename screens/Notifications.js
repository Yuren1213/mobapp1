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

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
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

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem("notifications");
      const data = stored ? JSON.parse(stored) : [];
      setNotifications(data);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearNotifications = async () => {
    Alert.alert("Clear All", "Delete all notifications?", [
      { text: "Cancel" },
      {
        text: "Yes",
        onPress: async () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          await AsyncStorage.removeItem("notifications");
          setNotifications([]);
        },
      },
    ]);
  };

  const deleteNotification = async (id) => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const updated = notifications.filter((notif) => notif._id !== id);
      setNotifications(updated);
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
      {/* Header */}
      <View
        style={[
          styles.headerContainer,
          { borderBottomColor: theme.border, backgroundColor: theme.bg },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>

        {notifications.length > 0 ? (
          <TouchableOpacity onPress={clearNotifications} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={22} color={theme.danger} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.subText }]}>Loading...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color={theme.subText} />
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            No notifications yet
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {notifications.map((notif, index) => (
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
                  <Text style={[styles.message, { color: theme.text }]}>
                    {notif.message}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => deleteNotification(notif._id)}>
                  <Ionicons name="close-circle" size={22} color={theme.subText} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.date, { color: theme.subText }]}>
                {new Date(notif.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}
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
  iconTextContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
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
    padding: 40,
  },
  emptyText: { marginTop: 10, fontSize: 16, fontWeight: "500" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, fontSize: 14 },
});
