import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useFavorites } from "../FavoritesContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Local Food Trays
const foodtrays = [
  { id: 1, title: "Party Tray A", price: 999, image: require("../assets/images/5.jpg") },
  { id: 2, title: "Party Tray B", price: 1299, image: require("../assets/images/6.jpg") },
  { id: 3, title: "Party Tray C", price: 1599, image: require("../assets/images/7.jpg") },
  { id: 4, title: "Party Tray D", price: 1899, image: require("../assets/images/8.jpg") },
  { id: 5, title: "Party Tray E", price: 1899, image: require("../assets/images/5.jpg") },
  { id: 6, title: "Party Tray F", price: 1899, image: require("../assets/images/6.jpg") },
];


export default function FoodTrays() {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const navigation = useNavigation();

  const toggleFavorite = (item) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  };

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
          <Text style={styles.backText}>Food Trays</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <MaterialCommunityIcons name="chef-hat" size={26} color="black" />
        </TouchableOpacity>
      </View>

      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Party Trays</Text>

        <View style={styles.cardContainer}>
          {foodtrays.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={item.image} style={styles.cardImage} />
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardPrice}>₱{item.price}</Text>
              <View style={styles.cardFooter}>
                <TouchableOpacity onPress={() => toggleFavorite(item)}>
                  <Ionicons
                    name={isFavorite(item.id) ? "heart" : "heart-outline"}
                    size={24}
                    color="red"
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="add-circle" size={28} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  backText: {
    fontSize: 15,
    fontWeight: "500",
  },

  sectionTitle: { fontSize: 16, fontWeight: "bold", margin: 15 },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 80,
  },
  card: {
    width: 180,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
  },
  cardImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: 6,
  },
  cardTitle: { fontSize: 14, 
    fontWeight: "bold" },
  cardPrice: { fontSize: 13, 
    color: "#333", 
    marginVertical: 4 },

    
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
