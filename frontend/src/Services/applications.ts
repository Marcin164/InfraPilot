import axios from "axios";

export const getApplicationsTable = async (token: any) => {
  try {
    const result = await axios({
      method: "get",
      url: "http://localhost:3000/applications/table",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};

export const getApplication = async (token: any, id: any) => {
  try {
    const result = await axios({
      method: "get",
      url: `http://localhost:3000/applications/${id}`,
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
      url: `http://localhost:3000/applications/filters`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    return result.data;
  } catch (error) {
    return error;
  }
};
