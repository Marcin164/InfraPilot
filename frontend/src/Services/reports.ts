import axios from "axios";

export const getReports = async (token: any, type: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/reports?type=${type}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
