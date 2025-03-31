import { useSelector } from 'react-redux';

const ReduxDebugger = () => {
  const state = useSelector(state => state);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 9999, 
                 background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', 
                 maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
      <h6>Redux State</h6>
      <pre>{JSON.stringify(Object.keys(state), null, 2)}</pre>
      <details>
        <summary>Booking State</summary>
        <pre>{JSON.stringify(state.booking, null, 2)}</pre>
      </details>
    </div>
  );
};

export default ReduxDebugger;
