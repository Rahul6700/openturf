import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signin() {
  const [email, setemail] = useState('');
  const [password, setpassword] = useState('');
  const navigate = useNavigate();

  const redirectToSignup = (e) => {
    navigate('/signup');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch ('http://localhost:5000/signin', {
        method : 'POST',
        headers : {
          'Content-Type' : 'application/json',
        },
          body: JSON.stringify({ email, password }),
      });

      const data = await response.json(); 

      if(response.ok){
        navigate('/home')
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.log(error)
      alert(`an error has occured, please try again`)
    }
  };
  return (
    <div className='d-flex align-items-center justify-content-center vh-100 bg-light'>
      <div
        className='card text-center shadow'
        style={{ width: '300px', height: '400px' }}
      >
        <div className='card-body d-flex flex-column justify-content-center'>
          <h1 className='card-title mb-4'>Sign In</h1>

          <h3 className='mb-2'>Email</h3>
          <textarea
            className='form-control mb-3'
            style={{ width: '267px', height: '40px' }}
            placeholder='Enter Email ID'
            value={email}
            onChange={(e) => setemail(e.target.value)}
          ></textarea>

          <h3 className='mb-2'>Password</h3>
          <input
            type = 'password'
            className='form-control mb-3'
            style={{ width: '267px', height: '40px' }}
            placeholder='Enter password'
            value={password}
            onChange={(e) => setpassword(e.target.value)}
          />

          <button className='btn btn-primary' onClick={handleSubmit}>
            Submit
          </button>
        </div>
        <p
          className='text-primary text-decoration-underline'
          onClick={redirectToSignup}
        >
          Click here to signup
        </p>
      </div>
    </div>
  );
}
