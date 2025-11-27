import axios from "axios";

export const addDevice = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "post",
      url: "http://localhost:3000/devices/",
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

export const assignDevice = async (token: any, data: any) => {
  try {
    const result = await axios({
      method: "post",
      url: "http://localhost:3000/devices/assign",
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

export const getDevicesOptions = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: "http://localhost:3000/devices/options",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getDevices = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: "http://localhost:3000/devices/",
      headers: {
        authorization: `Bearer ${token}`,
      },
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
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getDevice = async (token: any, idUser: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/devices/${idUser}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getDevicesWithApplication = async (token: any, id: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/devices/application/${id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getFilter = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/devices/filters`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
