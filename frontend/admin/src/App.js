import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Signin from './signin.js';
import Signup from './signup.js';
import Home from './home.js';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      {/* Main Container */}
      <Routes>
        {/* Default Route - This will render when no specific route is matched */}
        <Route
          path='/'
          element={
            <div className='d-flex align-items-center justify-content-center vh-100 bg-light'>
              <div
                className='card text-center shadow'
                style={{ width: '300px', height: '400px' }}
              >
                <div className='card-body d-flex flex-column justify-content-center'>
                  <h1 className='card-title mb-4'>Welcome</h1>
                  <Link to='/signup' className='btn btn-primary mb-2'>
                    SignUp
                  </Link>
                  <Link to='/signin' className='btn btn-primary'>
                    SignIn
                  </Link>
                </div>
              </div>
            </div>
          }
        />

        {/* SignIn Route */}
        <Route path='/signin' element={<Signin />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/home' element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
