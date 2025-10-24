import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../FavoritesContext";


const drinks = [
  { id: 1, title: "Iced Coffee", price: 89, image: require("../assets/images/1.jpg") },
  { id: 2, title: "Milk Tea", price: 99, image: require("../assets/images/2.jpg") },
  { id: 3, title: "Lemonade", price: 79, image: require("../assets/images/3.jpg") },
  { id: 4, title: "Iced Latte", price: 109, image: require("../assets/images/4.jpg") },
  { id: 5, title: "Fruit Shake", price: 119, image: require("../assets/images/5.jpg") },
  { id: 6, title: "Smoothie", price: 129, image: require("../assets/images/6.jpg") },
  { id: 7, title: "Iced Tea", price: 69, image: require("../assets/images/7.jpg") },
  { id: 8, title: "Hot Chocolate", price: 99, image: require("../assets/images/8.jpg") },
  { id: 9, title: "Cappuccino", price: 89, image: require("../assets/images/9.jpg") },
  { id: 10, title: "Espresso", price: 79, image: require("../assets/images/10.jpg") },
];
 
export default function Drinks() {
  const navigation = useNavigation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const toggleFavorite = (item) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
      <Text style={styles.cardTitle}>{item.title}</Text>

      <View style={styles.cardInfo}>
        <Ionicons name="time-outline" size={14} color="#555" />
        <Text style={styles.timeText}>5 mins.</Text>
      </View>

      <Text style={styles.cardPrice}>₱{item.price}</Text>

      <View style={styles.cardFooter}>
        <TouchableOpacity onPress={() => toggleFavorite(item)}>
          <Ionicons
            name={isFavorite(item.id) ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite(item.id) ? "red" : "black"}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="add-circle" size={26} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Button styled same as Bento */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.circle}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </View>
          <Text style={styles.backText}>Drinks</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <MaterialCommunityIcons name="chef-hat" size={26} color="black" />
        </TouchableOpacity>
      </View>

     
      <FlatList
        data={drinks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

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

  // Back Button (same design as Bento & FoodTrays)
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6e6e6", // light gray pill background
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000", // black circle
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: "500",
  },

  row: {
    justifyContent: "space-around",
  },
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
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  timeText: { fontSize: 12, color: "#555", marginLeft: 4 },
  cardPrice: { fontSize: 14, fontWeight: "bold", marginVertical: 4 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
