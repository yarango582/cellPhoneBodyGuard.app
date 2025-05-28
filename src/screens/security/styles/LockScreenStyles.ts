import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  message: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 24,
  },
  unlockButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  unlockButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  emergencyButton: {
    borderWidth: 1,
    borderColor: "#666",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  emergencyButtonText: {
    color: "#ccc",
    fontSize: 16,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
});
