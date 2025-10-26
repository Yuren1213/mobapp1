import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_URL } from "../config";

export default function Notifications({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;

      const { _id } = JSON.parse(storedUser);
      const res = await fetch(`${API_URL}/notifications/${_id}`);
      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => {
    let iconName = "notifications-outline";
    let iconColor = "#333";

    if (item.type === "accepted") {
      iconName = "checkmark-circle";
      iconColor = "green";
    } else if (item.type === "rejected" || item.type === "cancelled") {
      iconName = "close-circle";
      iconColor = "red";
    }

    return (
      <View style={styles.notificationCard}>
        <Ionicons name={iconName} size={28} color={iconColor} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} />
          }
        />
      ) : (
        <Text style={styles.emptyText}>No notifications yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  message: { fontSize: 15, color: "#333" },
  time: { fontSize: 12, color: "#777", marginTop: 4 },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#777",
  },
});
