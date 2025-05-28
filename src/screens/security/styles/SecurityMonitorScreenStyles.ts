import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statusLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  statusValue: {
    fontSize: 16,
    color: "#666",
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  statusActive: {
    backgroundColor: "#d4edda",
  },
  statusInactive: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  warningText: {
    color: "#FF3B30",
    fontWeight: "bold",
  },
  enabledText: {
    color: "#28A745",
    fontWeight: "bold",
  },
  disabledText: {
    color: "#6C757D",
  },
  settingsSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  thresholdControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  thresholdButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  thresholdButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  thresholdValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
    width: 20,
    textAlign: "center",
  },
  actionsSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: "#6C757D",
  },
  testButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: "#e8f4fd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
    lineHeight: 20,
  },
});
