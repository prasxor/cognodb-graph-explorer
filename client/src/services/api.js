const API_URL = import.meta.env.VITE_API_URL;

export const getDevelopers = async () => {
  const response = await fetch(`${API_URL}/graph/developers`);

  if (!response.ok) {
    throw new Error("Failed to fetch developers");
  }

  const result = await response.json();
  return result.data;
};

export const getGraphTraversal = async (developerId) => {
  const response = await fetch(
    `${API_URL}/graph/traverse/${developerId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch graph");
  }

  const result = await response.json();
  return result.data;
};