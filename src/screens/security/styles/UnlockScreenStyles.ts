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
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  instructions: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
  },
  errorText: {
    color: "#f44336",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 5,
    padding: 15,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 2,
  },
  unlockButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  unlockButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: "#555",
  },
  forgotButton: {
    padding: 10,
  },
  forgotButtonText: {
    color: "#007AFF",
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 12,
  },
  attemptsText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 5,
  },
  criticalText: {
    color: "#ff0000",
    fontWeight: "bold",
  },
  warningBanner: {
    backgroundColor: "#ff3b30",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  warningText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 10,
    flex: 1,
    fontWeight: "bold",
  },
});
