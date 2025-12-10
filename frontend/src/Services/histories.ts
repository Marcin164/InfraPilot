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

export const getDeviceHistory = async (token: any, deviceId: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/histories/device/${deviceId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getUsersDevices = async (token: any, userId: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/histories/user/${userId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
