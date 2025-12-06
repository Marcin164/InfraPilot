import axios from "axios";

export const createHistoryEntry = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "post",
      url: "http://localhost:3000/histories/",
      headers: {
        authorization: `Bearer ${token}`,
      },
      data,
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getDeviceOwners = async (token: any, deviceId: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/histories/owners/${deviceId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
