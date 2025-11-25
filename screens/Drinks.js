import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ENDPOINTS } from "../config";

const { width } = Dimensions.get("window");

export default function Drinks() {
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const shimmerValue = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    const fetchDrinks = async () => {
      try {
        const res = await fetch(`${ENDPOINTS.PRODUCTS}/all`);
        const result = await res.json();

        if (result.success) {
          const filtered = result.products.filter(
            (item) => item.product_desc?.toLowerCase() === "drinks"
          );
          setDrinks(filtered);
        }
      } catch (err) {
        console.error("❌ Error fetching Drinks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrinks();
  }, []);

  // ✨ Shimmer animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              opacity: shimmerValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        />
        <Text style={styles.loadingText}>Mixing your drinks...</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <LinearGradient
        colors={["#fff", "#ffeef8"]}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image
          source={{
            uri: item.image_url || `${ENDPOINTS.PRODUCTS}/image/${item._id}`,
          }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.prod_desc}</Text>
          <Text style={styles.price}>₱{item.prod_unit_price}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 🔙 Header With Back Button */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
            size={26}
            color="#e91e63"
          />
        </TouchableOpacity>

        <Text style={styles.header}>🥤 Refreshing Drinks</Text>
        <View style={{ width: 30 }} />
      </View>

      <FlatList
        data={drinks}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        numColumns={2}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff8fb",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },

  /* 🔙 Back Button Header */
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 0.6,
    borderBottomColor: "#f3c1d5",
  },
  backButton: {
    marginRight: 10,
  },

  header: {
    flex: 1,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#e91e63",
  },

  list: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },

  card: {
    width: width / 2 - 20,
    borderRadius: 15,
    margin: 8,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#e91e63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardGradient: {
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 140,
    borderRadius: 12,
  },
  info: {
    alignItems: "center",
    marginTop: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },
  price: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#e91e63",
    marginTop: 4,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff8fb",
  },
  shimmer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f8c9dd",
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    color: "#e91e63",
    fontWeight: "500",
  },
});
