import { useCallback, useState } from "react";
import {
  getDevelopers,
  getGraphTraversal,
} from "../services/api";

function useGraph() {
  const [developers, setDevelopers] = useState([]);
  const [graph, setGraph] = useState({
    nodes: [],
    relationships: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDevelopers = useCallback(async () => {
    try {
      setError(null);
      const data = await getDevelopers();
      setDevelopers(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadGraph = useCallback(async (developerId) => {
    try {
      setLoading(true);
      setError(null);

      const data = await getGraphTraversal(developerId);

      setGraph(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    developers,
    graph,
    loading,
    error,
    loadDevelopers,
    loadGraph,
  };
}

export default useGraph;