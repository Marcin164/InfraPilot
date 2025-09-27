import axios from "axios";

export const getDevices = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: "http://localhost:3000/devices/",
      //   headers: {
      //     authorization: `Bearer ${token}`,
      //   },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getDevicesByOwner = async (token: any, idUser: string) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/devices/user/${idUser}`,
      //   headers: {
      //     authorization: `Bearer ${token}`,
      //   },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getDevice = async (token: any, idUser: any) => {
  console.log(idUser);
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/devices/${idUser}`,
      //   headers: {
      //     authorization: `Bearer ${token}`,
      //   },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
