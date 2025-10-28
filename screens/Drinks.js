import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { ENDPOINTS } from "../config";

export default function Drinks() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrinks = async () => {
      try {
        const res = await fetch(ENDPOINTS.PRODUCTS);
        const data = await res.json();

        // ✅ Filter Drinks only
        const filtered = data.filter(
          (item) => item.product_desc?.toLowerCase() === "drinks"
        );

        setDrinks(filtered);
      } catch (err) {
        console.error("❌ Error fetching Drinks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrinks();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />;

  return (
    <FlatList
      data={drinks}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Image
            source={{ uri: `${ENDPOINTS.PRODUCTS}/image/${item._id}` }}
            style={styles.image}
            resizeMode="cover"
          />
          <Text style={styles.name}>{item.prod_desc}</Text>
          <Text style={styles.price}>₱{item.prod_unit_price}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 10, margin: 10, padding: 10, alignItems: "center", elevation: 3 },
  image: { width: 120, height: 120, borderRadius: 10 },
  name: { marginTop: 10, fontWeight: "bold", fontSize: 16 },
  price: { color: "green", fontSize: 14 },
});
