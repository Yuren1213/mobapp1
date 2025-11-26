import React, { useEffect, useState, useContext } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ENDPOINTS } from "../config";
import { ThemeContext } from "../contexts/ThemeContext";

export default function Foodtrays() {
  const [trays, setTrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useContext(ThemeContext);
  const navigation = useNavigation();

  const theme = {
    bg: darkMode ? "#0a0a0a" : "#fafafa",
    text: darkMode ? "#fff" : "#1a1a1a",
    subtext: darkMode ? "#bbb" : "#555",
    card: darkMode ? "#1f1f1f" : "#fff",
    border: darkMode ? "#333" : "#e5e5e7",
  };

  useEffect(() => {
    const fetchTrays = async () => {
      try {
        const res = await fetch(`${ENDPOINTS.PRODUCTS}/all`);
        const result = await res.json();
        if (result.success) {
          const filtered = result.products.filter(
            (item) => item.product_desc?.toLowerCase() === "party trays"
          );
          setTrays(filtered);
        }
      } catch (err) {
        console.error("❌ Error fetching Party Trays:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrays();
  }, []);

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#ff4b7d" />
        <Text style={{ color: theme.subtext, marginTop: 10 }}>
          Loading party trays...
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
          Party Trays 🎉
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Party Trays List */}
      {trays.length === 0 ? (
        <View style={[styles.center, { backgroundColor: theme.bg }]}>
          <Text style={{ color: theme.subtext, fontSize: 16 }}>
            No party trays available 🎉
          </Text>
        </View>
      ) : (
        <FlatList
          data={trays}
          keyExtractor={(item) => item._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingHorizontal: 10,
            paddingTop: 10,
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
              <Image
                source={{
                  uri:
                    item.image_url ||
                    (item._id
                      ? `${ENDPOINTS.PRODUCTS}/image/${item._id}`
                      : ""),
                }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {String(item.prod_desc || "No Description")}
              </Text>
              <Text style={[styles.cardPrice, { color: "#ff4b7d" }]}>
                ₱{String(item.prod_unit_price || "0")}
              </Text>
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
});
