import React from "react";
import { useState, useEffect } from 'react'
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {

  //dummy apikey to test
  const apikey = "bac4887f06b5ecaace9ebef4dff0c39a14666c0c8b098490271791cfb793b42c"

  const [message, setmessage] = useState("your custom message here");
  const [logs, setLogs] = useState([]);
  const [file, setFile] = useState(null);
  const [docs, setdocs] = useState([]);
  const [model, setmodel] = useState("");
  const [url, setUrl] = useState("");
  const [userName,setuserName] = useState("Admin");

  // to fetch current model used by the admin
  useEffect(() => {
    const fetchCurrentModel = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users/getCurrentModel", {
          headers: {
            'Authorization': apikey
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch current model");
        }
        const data = await response.json();
        setuserName(data.username)
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
      const response = await fetch ('http://localhost:5000/api/users/modify', {
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
      const res = await fetch('http://localhost:5000/api/users/logs', {
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
      const response = await fetch("http://localhost:5000/api/users/changeModel", {
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

  const uploadUrl = async () => {
    console.log(`url is ${url}`)
  try {
    console.log('upload url called')
    const response = await fetch("http://localhost:8000/upload-url", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": apikey,  
      },
      body: JSON.stringify({ url })  
    });

    if (!response.ok) {
      console.log('Fetch error:', response);
      alert('Failed to upload URL. Please make sure you enter a valid URL');
      return;
    }

    const result = await response.json();
    alert(result.message);
  } catch (error) {
    console.error('Upload error:', error);
    alert('Internal server error');
  }
  setUrl("");
};


  return (
    <div className="container py-5">
    <h1>Welcome, {userName}</h1>
      <div className="card mb-4">
        <div className="card-header">Upload to Knowledge Base</div>
        <div className="card-body">
        <div className="mb-3">
          <input
            type="file"
            className="form-control mb-3"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <button className="btn btn-info me-3" onClick={handleUpload}>Upload</button>
        </div>
        <div>
          <input type="text" className="url me-3" value={url} style={{width: '600px'}} placeholder="enter your URL here" onChange={(e)=>{setUrl(e.target.value)}}/>
          <button className="btn btn-info ml-3" onClick={() => {console.log("Button clicked");uploadUrl();}}>Upload</button>
        </div>
          <button className="btn btn-primary mt-4" onClick={fetchKnowledgeBase}>
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
          <h3> Current : {model} </h3>
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
