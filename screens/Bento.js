import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ENDPOINTS } from "../config";
import { ThemeContext } from "../contexts/ThemeContext";

export default function Bento() {
  const [bentos, setBentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useContext(ThemeContext);

  const theme = {
    bg: darkMode ? "#121212" : "#fff",
    text: darkMode ? "#fff" : "#333",
    card: darkMode ? "#1e1e1e" : "#f8f8f8",
  };

  useEffect(() => {
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
    fetchBento();
  }, []);

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="deeppink" />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <FlatList
        data={bentos}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Image
              source={{
                uri: item.image_url || `${ENDPOINTS.PRODUCTS}/image/${item._id}`,
              }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={[styles.name, { color: theme.text }]}>
              {item.prod_desc}
            </Text>
            <Text style={styles.price}>₱{item.prod_unit_price}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    borderRadius: 10,
    margin: 10,
    padding: 10,
    alignItems: "center",
    elevation: 3,
    flex: 1,
  },
  image: { width: 130, height: 130, borderRadius: 10 },
  name: { marginTop: 10, fontWeight: "bold", fontSize: 15, textAlign: "center" },
  price: { color: "deeppink", fontSize: 14, marginTop: 4 },
});
