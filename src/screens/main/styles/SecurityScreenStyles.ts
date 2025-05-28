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
    color: "#666",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusActive: {
    backgroundColor: "#4CD964",
  },
  statusInactive: {
    backgroundColor: "#FF3B30",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  scrollView: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  card: {
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
  disabledCard: {
    opacity: 0.7,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
  },
  sliderContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -5,
  },
  sliderMinLabel: {
    fontSize: 12,
    color: "#666",
  },
  sliderMaxLabel: {
    fontSize: 12,
    color: "#666",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
    lineHeight: 20,
  },
  behaviorItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  behaviorInfo: {
    flex: 1,
    marginLeft: 15,
  },
  behaviorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  behaviorDescription: {
    fontSize: 14,
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  savingButton: {
    backgroundColor: "#80BDFF",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  securityKeyContainer: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  securityKey: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    letterSpacing: 1,
  },
  viewKeyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  viewKeyText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
    marginRight: 8,
  },
  hideKeyButton: {
    backgroundColor: "#E0E0E0",
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: "center",
  },
  hideKeyText: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  blockButton: {
    backgroundColor: "#FF3B30",
  },
  unblockButton: {
    backgroundColor: "#4CD964",
  },
  monitorButton: {
    backgroundColor: "#007AFF",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
