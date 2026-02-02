import axios from "axios";

export const getUserSettings = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/settings`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
