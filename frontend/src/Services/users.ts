import axios from "axios";

export const getUsers = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: "http://localhost:3000/users/",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getUsersTable = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: "http://localhost:3000/users/table",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getUser = async (token: any, id: string) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/users/${id}`,
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
      url: `http://localhost:3000/users/filters`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
