import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollView: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  statusDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  lastCheck: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  actionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  actionDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 3,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 15,
    lineHeight: 20,
  },
});
