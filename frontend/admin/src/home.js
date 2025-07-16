import React from "react";
import { useState, useEffect } from 'react'
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {

  //dummy apikey to test
  const apikey = "b7948ef1b91b0cd78ecd6b46694a01c5182502b9d6364d9238d421da899ce84e"

  const [message, setmessage] = useState("your custom message here");
  const [logs, setLogs] = useState([]);
  const [file, setFile] = useState(null);
  const [docs, setdocs] = useState([]);
  const [model, setmodel] = useState("");

  // to fetch current model used by the admin
  useEffect(() => {
    const fetchCurrentModel = async () => {
      try {
        const response = await fetch("http://localhost:5000/getCurrentModel", {
          headers: {
            'Authorization': apikey
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch current model");
        }
        const data = await response.json();
        setmodel(data.model || "gemini"); 
      } catch (error) {
        console.error(error);
        setmodel("gemini"); //fallback to gemini incase of error
      }
    };
    fetchCurrentModel();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
 
    if (!file) {
      alert('upload a file first')
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {

      const response = await fetch('http://localhost:8000/upload-pdf', {
        method : 'POST',
        headers : {
          Authorization : apikey
        },
        body : formData,
      })

      if(!response.ok){
        alert('upload failed, try again')
      }

      const result = await response.text();
      alert(result);

    } catch (error) {
      console.log(error)
      alert('internal server error, try uploading later')
    }
  }


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

  const fetchKnowledgeBase = async () =>{
    try {
      const res = await fetch('http://localhost:8000/fetchKnowledgeBase', {
        method: 'GET',
        headers: {
          'Authorization' : apikey
        }
      });

      const docs = await res.json();
      setdocs(docs.success || [])
    } catch (e) {
      console.log('error getting KD docs arr:',e);
      alert('error loading knowledge base, please try later')
    }
  }

  const handleDeleteDoc = async (doc) => {
    try {
      const response = await fetch("http://localhost:8000/deleteDoc", {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          'Authorization' : apikey
        },
        body: JSON.stringify({ doc : doc })
      });

    if (!response.ok) {
      alert("Failed to delete document");
    }

    const result = await response.json();
    console.log("Delete success:", result);

    setdocs((prevdocs) => prevdocs.filter((d) => d !== doc));
  } catch (error) {
    console.log(error)
  }
  }

  const changeModel = async (model) => {
    try {
      const response = await fetch("http://localhost:5000/changeModel", {
        method: 'POST',
        headers: {
          "Content-Type" : "application/json",
          'Authorization' : apikey
        },
        body: JSON.stringify({ model : model})
      })
      if(!response.ok) {
        console.log(response)
        alert('failed to change model')
      }

      const result = await response.json()
      alert(result.success)
    } catch (error) {
      console.log(error)
      alert(error)
    }
  }

  return (
    <div className="container py-5">

      <div className="card mb-4">
        <div className="card-header">Upload to Knowledge Base</div>
        <div className="card-body">
          <input
            type="file"
            className="form-control mb-3"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <button className="btn btn-info me-3" onClick={handleUpload}>Upload</button>
          <button className="btn btn-primary" onClick={fetchKnowledgeBase}>
            View Knowledge Base ▼
          </button>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="mt-3">
            <ul className="list-group">
              {docs.map((doc, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>{doc}</div>
                  <button className="btn btn-sm btn-danger" onClick={()=>{handleDeleteDoc(doc)}}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className = "card mb-4">
        <div className = "card-header">Select Model</div>
        <div className = "card-body">
          <select className="select-button mb-3" value={model} onChange={(e)=>{setmodel(e.target.value)}}>
            <option value="gemini">Gemini</option>
            <option value="deepseek">DeepSeek</option>
            <option value="mistral">Mistral</option>
          </select>
          <button className = "btn btn-success ms-3" onClick={()=>{changeModel(model)}}> Save </button>
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
              <div><strong>Model:</strong> {log.model}</div>
              <div><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</div>
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
