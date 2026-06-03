// TEMPORARY MOCK AUTH - Use only for development
export const mockAuth = {
  signup: async (userData) => {
    console.log("Mock signup:", userData);
    // Generate a fake token
    const fakeToken = "mock_jwt_token_" + Date.now();
    localStorage.setItem("authToken", fakeToken);
    localStorage.setItem("mockUser", JSON.stringify({
      name: userData.name,
      email: userData.email,
      isMock: true
    }));
    return { success: true, message: "Mock signup successful" };
  },
  
  signin: async (email, password) => {
    const fakeToken = "mock_jwt_token_" + Date.now();
    localStorage.setItem("authToken", fakeToken);
    localStorage.setItem("mockUser", JSON.stringify({
      name: "Test User",
      email: email,
      isMock: true
    }));
    return { success: true };
  },
  
  verifyOTP: async (email, otp) => {
    // Accept any OTP in mock mode
    return { success: true, token: "mock_token" };
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem("mockUser");
    return user ? JSON.parse(user) : null;
  }
};