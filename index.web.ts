// Web entry point
import "./global.css";
import "./web.css";
import "react-native-get-random-values";
import { LogBox } from "react-native";

// Suppress warnings that are not relevant for web
LogBox.ignoreLogs([
  "Expo AV has been deprecated",
  "Disconnected from Metro",
  "new NativeEventEmitter",
  "VirtualizedLists should never be nested",
]);

import { registerRootComponent } from "expo";
import App from "./App";

// Register the root component
registerRootComponent(App);

