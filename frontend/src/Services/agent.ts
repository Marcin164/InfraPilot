import axios from "axios";

export const getSettings = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: "http://localhost:3000/agent/settings",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
