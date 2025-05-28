import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  backButton: {
    marginTop: 10,
    padding: 5,
    width: 40,
  },
  header: {
    marginTop: 30,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    color: "#ff3b30",
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 30,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: "#333",
  },
  resetButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
});
