import axios from "axios";

export const getDashboards = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: "http://localhost:3000/dashboards",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const createDashboard = async (token: any, body: any) => {
  try {
    const result = await axios({
      method: "post",
      url: "http://localhost:3000/dashboards",
      headers: {
        authorization: `Bearer ${token}`,
      },
      data: body,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
