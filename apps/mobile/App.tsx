import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { FeedScreen } from "./src/screens/FeedScreen";

export default function App() {
  return (
    <View style={styles.root}>
      <FeedScreen />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
});
