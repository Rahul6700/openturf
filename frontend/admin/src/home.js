import React from "react";
import { useState } from 'react'
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {

  const [message, setmessage] = useState("your custom message here");
  const [logs, setLogs] = useState([]);      

  const handleSave = async () => {
     try {
      const response = await fetch ('http://localhost:5000/modify', {
        method : 'POST',
        headers : {
          'Content-Type' : 'application/json',
          'Authorization': apikey
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

  const fetchLogs = async () => {
  
    try {
      const res = await fetch('http://localhost:5000/logs', {
        method: 'GET',
        headers: {
          'Authorization': apikey
        }
      });

      const data = await res.json();
      setLogs(data.success || []);
    
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

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
    <button className="btn btn-primary mb-3" onClick={fetchLogs}>
      Load Logs
    </button>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <ul className="list-group">
          {logs.map((log, index) => (
            <li key={index} className="list-group-item">
              <div><strong>Type:</strong> {log.type}</div>
              <div><strong>Text:</strong> {log.text}</div>
              <div><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
    
        <div className="card mb-4">
      <div className="card-header">View Logs</div>
      <div className="card-body">
        <button className="btn btn-primary mb-3" onClick={fetchLogs}>
          Load Logs
        </button>

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <ul className="list-group">
            {logs.map((log, index) => (
              <li key={index} className="list-group-item">
                <strong>{log.type}:</strong> {log.query}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    </div>
  );
}

export default Home;
