import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FavoritesProvider } from "../FavoritesContext";

// Screens
import Bento from "../screens/Bento";
import Cart from "../screens/Cart";
import Checkoutlist from "../screens/Checkoutlist";
import Drinks from "../screens/Drinks";
import Favorites from "../screens/Favorites";
import Foodtrays from "../screens/Foodtrays";
import Forgotpassword from "../screens/Forgotpassword";
import Help from "../screens/Help";
import Home from "../screens/Home";
import landing from "../screens/landing";
import Login from "../screens/log-in";
import Myorder from "../screens/Myorders";
import Notifications from "../screens/Notifications";
import Payment from "../screens/Payment";
import ProductImageScreen from "../screens/ProductImageScreen";
import Register from "../screens/register";
import Settings from "../screens/Settings";
import ConnectionTestScreen from "../screens/ConnectionTestScreen";
const Stack = createNativeStackNavigator();



export default function Navigation() {
  return (
    <FavoritesProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login" // ✅ must match the Stack.Screen name
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Favorites" component={Favorites} />
          <Stack.Screen name="Bento" component={Bento} />
          <Stack.Screen name="Foodtrays" component={Foodtrays} />
          <Stack.Screen name="Drinks" component={Drinks} />
          <Stack.Screen name="landing" component={landing} />
          <Stack.Screen name="Cart" component={Cart} />
          <Stack.Screen name="Checkoutlist" component={Checkoutlist} />
          <Stack.Screen name="Myorders" component={Myorder} />
          <Stack.Screen name="Payment" component={Payment} />
          <Stack.Screen name="Help" component={Help} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="Forgotpassword" component={Forgotpassword} />
          <Stack.Screen name="ProductImage" component={ProductImageScreen} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="ConnectionTestScreen" component={ConnectionTestScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </FavoritesProvider>
  );
}
