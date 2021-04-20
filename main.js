export default function createUseApi({
  fetchHandler,
  useState,
  useEffect
}) {
  if (typeof fetchHandler !== 'function') {
    throw new Error('useapi requires a fetchHandler that returns a promise');
  }
  if (typeof useState !== 'function') {
    throw new Error('useapi requires a useState implementation');
  }
  if (typeof useEffect !== 'function') {
    throw new Error('useapi requires a useEffect implementation');
  }

  // calls error, loading or loaded handlers based on the API state
  function handleApiState({ state, error, loading, loaded, refresh }) {
    if (!state) {
      return loading(refresh);
    }
    if (state instanceof Error) {
      return error(state, refresh);
    }
    return loaded(state, refresh);
  }

  function useApiData(options, dependencies) {
    const [state, setState] = useState(null);
    const makeRequest = () => {
      if (state !== null) {
        setState(null);
      }
      fetchHandler(options).
        then((data) => {
          setState(data);
        }).
        catch((err) => {
          setState(err);
        });
    };

    useEffect(makeRequest, dependencies || [options.path]); // TODO add headers

    return [state, () => makeRequest(true)];
  }

  // react hook accepts request options and state handlers
  // TODO accept function that returns promise instead of fetch options
  // let this just give easy state handlers
  function useApi(options, error, loading, loaded, dependencies) {
    const [state, refresh] = useApiData(options, dependencies);

    return [handleApiState({ state, error, loading, loaded, refresh }), refresh];
  }

  useApi.raw = useApiData;

  return useApi;
}