import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../FavoritesContext";
import { API_URL } from "../config"; // make sure this exists

const Bento = () => {
  const navigation = useNavigation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const [bentos, setBentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch bento data from backend
  useEffect(() => {
    const fetchBentos = async () => {
      try {
        const res = await fetch(`${API_URL}/bento`);
        const data = await res.json();
        setBentos(data);
      } catch (error) {
        console.error("Error fetching Bentos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBentos();
  }, []);

  const toggleFavorite = (item) => {
    if (isFavorite(item._id)) {
      removeFavorite(item._id);
    } else {
      addFavorite(item);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: `${API_URL}${item.image}` }} // ✅ Load image from backend
        style={styles.cardImage}
        resizeMode="cover"
      />
      <Text style={styles.cardTitle}>{item.title}</Text>

      <View style={styles.cardInfo}>
        <Ionicons name="time-outline" size={14} color="#555" />
        <Text style={styles.timeText}>20mins.</Text>
      </View>

      <Text style={styles.cardPrice}>₱{item.price}</Text>

      <View style={styles.cardFooter}>
        <TouchableOpacity onPress={() => toggleFavorite(item)}>
          <Ionicons
            name={isFavorite(item._id) ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite(item._id) ? "red" : "black"}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="add-circle" size={26} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text>Loading bentos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.circle}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </View>
          <Text style={styles.backText}>Bento</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <MaterialCommunityIcons name="chef-hat" size={26} color="black" />
        </TouchableOpacity>
      </View>

      {/* Bento Grid */}
      <FlatList
        data={bentos}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: "#f5f5f5",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6e6e6",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  backText: { fontSize: 15, fontWeight: "500" },
  row: { justifyContent: "space-around" },
  card: {
    width: "45%",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
  },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardInfo: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  timeText: { fontSize: 12, color: "#555", marginLeft: 4 },
  cardPrice: { fontSize: 14, fontWeight: "bold", marginVertical: 4 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Bento;
