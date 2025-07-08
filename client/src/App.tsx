import { LavaLamp } from './components/LavaLamp';
import './index.css';

function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <LavaLamp />
    </div>
  );
}

export default App;
