import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { API_URL } from "../config";

const FavoriteScreen = () => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    (async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      const res = await fetch(`${API_URL}/favorites/${user._id}`);
      const data = await res.json();
      if (data.success) setFavorites(data.favorites);
    })();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={item.image ? { uri: item.image } : require("../assets/images/1.jpg")}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text>₱{item.price}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
      <Text style={styles.header}>My Favorites</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 40 }}>No favorites yet ❤️</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 24, fontWeight: "bold", margin: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    padding: 10,
    alignItems: "center",
  },
  image: { width: 70, height: 70, borderRadius: 10 },
  info: { flex: 1, marginLeft: 10 },
  title: { fontWeight: "bold", fontSize: 16 },
});

export default FavoriteScreen;
