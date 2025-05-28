import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContent: {
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEB",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
    justifyContent: "center",
  },
  warningTitle: {
    color: "#FF3B30",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  description: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: "#E8F0FE",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  lockButton: {
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 10,
    flex: 1.5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  lockButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: "#ffaa9d",
  },
});
