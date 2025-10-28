  import React, { useEffect, useState } from "react";
  import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    View,
  } from "react-native";
  import { ENDPOINTS } from "../config";

  export default function Bento() {
    const [bentos, setBentos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchBento = async () => {
        try {
          const res = await fetch(`${ENDPOINTS.PRODUCTS}/all`);
          const result = await res.json();

          if (result.success) {
            setBentos(result.products);
          } else {
            console.error("Fetch failed:", result.message);
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
        <ActivityIndicator
          size="large"
          color="#000"
          style={{ marginTop: 50 }}
        />
      );

    return (
      <FlatList
        data={bentos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: item.image_url }}
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
    card: {
      backgroundColor: "#fff",
      borderRadius: 10,
      margin: 10,
      padding: 10,
      alignItems: "center",
      elevation: 3,
    },
    image: { width: 120, height: 120, borderRadius: 10 },
    name: { marginTop: 10, fontWeight: "bold", fontSize: 16 },
    price: { color: "green", fontSize: 14 },
  });
