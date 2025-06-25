import { useState } from 'react'
import './index.css'


function Widget() {

  const [messages, setmessages] = useState([]);
  const [input, setinput] = useState("");
  const [model, setmodel] = useState("gemini");
  const [loading, setloading] = useState(false);

  const handleText = async () => {

    // Validate whether input is empty
    if (input.trim() === "") {
      return;
    }

    const newMessage = {
      sender: "user",
      text: input
    };

    setmessages([...messages, newMessage]);

    setinput("");

    setloading(true);

    //get the API key from localstorage or something
    
    console.log('sending req to backend')
    
    try {
      const response = await fetch("http://127.0.0.1:8000/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": apikey
        },
        body: JSON.stringify({
        query: input,
        model : model
      })
    });
    console.log('recieved response from backend')
    const data = await response.json();

    const newResponse = {
      sender: "ai",
      text: data.response  
    };
    setmessages(prevMessages => [...prevMessages, newResponse]);

    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setloading(false);
    }
  };

const handleVoice = () => {
  console.log('handleVoice called');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Check if browser supports voice input
  if (!SpeechRecognition) {
    alert('Voice input not supported in your browser, please use text instead');
    console.warn('SpeechRecognition not supported');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  console.log('SpeechRecognition instance created');

  recognition.onstart = () => {
    console.log('Speech recognition started');
  };

  recognition.onresult = (event) => {
    console.log('Speech recognition result event:', event);

    // Transcript var contains the voice input in text
    const transcript = event.results[0][0].transcript;
    console.log('Transcript:', transcript);

    const newMessage = {
      sender: 'User',
      text: transcript
    };

    // Assuming setmessages and messages are defined in your React component
    setmessages([...messages, newMessage]);

    console.log('New message added:', newMessage);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
  };

  recognition.start();
  console.log('Speech recognition started (recognition.start called)');
};


  return (
    <div className="widget-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className="message">
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      {loading && <div className="loading">AI is thinking...</div>}
      </div>
      <input type="text" value={input} placeholder="enter message here..." onChange={(e) => setinput(e.target.value)} />
      <button onClick={handleText}>Send</button>
      <button onClick={handleVoice} disabled={loading}>Voice</button>
      <label> Model : </label>
      <select className="select-button" value={model} onChange={(e)=>{setmodel(e.target.value)}}>
        <option value="gemini">Gemini</option>
        <option value="deepseek">DeepSeek</option>
        <option value="Mistral">Mistral</option>
      </select>
    </div>
  );
}

export default Widget;
