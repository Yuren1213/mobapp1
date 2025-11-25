import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navigation from "./navigation/navigation";

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const guestMode = await AsyncStorage.getItem("guest");

        if (storedUser) {
          setInitialRoute("Home");
        } else if (guestMode === "true") {
          setInitialRoute("Home");
        } else {
          setInitialRoute("Login");
        }
      } catch (err) {
        console.error("Error reading AsyncStorage:", err);
        setInitialRoute("Login");
      }
    };

    checkLogin();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff3b3b" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Navigation initialRouteName={initialRoute} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
