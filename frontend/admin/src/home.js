import React from "react";
import { useState } from 'react'
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {

  const [message, setmessage] = useState("your custom message here");

  const handleSave = async () => {
     try {
      const response = await fetch ('http://localhost:5000/modify', {
        method : 'POST',
        headers : {
          'Content-Type' : 'application/json',
        },
          body: JSON.stringify({ message }),
      });

      const data = await response.json(); 

      if(response.ok){
        alert(data.success)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.log(error)
      alert(`an error has occured, please try again`)
    }
    setmessage(message);
  }

  return (
    <div className="container py-5">
      <h2 className="mb-4">Admin Dashboard</h2>

      <div className="card mb-4">
        <div className="card-header">Upload to Knowledge Base</div>
        <div className="card-body">
          <input
            type="file"
            className="form-control mb-3"
          />
          <button className="btn btn-info">Upload</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">Set Custom Rejection Message</div>
        <div className="card-body">
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Enter custom rejection message"
            onChange={(e) => setmessage(e.target.value)}
            value = {message}
          />
          <button className="btn btn-success" onClick = {handleSave} >Save</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">View Logs</div>
        <div className="card-body">
          <button className="btn btn-primary mb-3">Load Logs</button>
          <ul className="list-group">
            <li className="list-group-item">
              <strong>User:</strong>hello ai<br />
              <strong>Query:</strong> What is my API key? <br />
              <strong>Response:</strong>?????<br />
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}

export default Home;
