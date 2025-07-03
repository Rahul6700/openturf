import { useState, useRef } from 'react'
import './index.css'

function Widget() {
  //temp api key to test
  const apikey = "1379e4b84850a7b0478053ab1ed904e03026a14308411f02fd9d7fb1d433576b"

  const [messages, setmessages] = useState([]);
  const [input, setinput] = useState("");
  const [model, setmodel] = useState("gemini");
  const [loading, setloading] = useState(false);
  const [isListening, setisListening] = useState(false)
  const [transcript, settranscript] = useState("")
  const recognitionRef = useRef(null)

  const handleText = async () => {
    //make sure input is not empty
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
    sendTextToBackend(input)
  };

  //for voice input
  const handleVoice = async () => {
    //check for browser support
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      alert('Web Speech API is not supported in your browser.');
      return;
    }

    //microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.error("Microphone permission denied:", error);
      alert('Microphone access is required for speech recognition. Please allow microphone access and try again.');
      return;
    }

    //stop any existing recognition thats already runnign
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; //use either of the API's
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.continuous = true;  
    recognition.maxAlternatives = 1;

    const timeoutId = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 5000) //set to 5 secons now, listening window

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setisListening(true);
    };

    recognition.onaudiostart = () => {
  console.log("Audio capturing started");
};

recognition.onspeechstart = () => {
  console.log("Speech has been detected");
};

recognition.onspeechend = () => {
  console.log("Speech has stopped being detected");
};

recognition.onaudioend = () => {
  console.log("Audio capturing ended");
};


    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      settranscript(currentTranscript);
      setinput(currentTranscript);

      if (finalTranscript.trim()) {
        handleSpeechComplete(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      console.error("Full error event:", event);

      clearTimeout(timeoutId);
      
      switch (event.error) {
        case 'no-speech':
          console.log('No speech detected, stopping recognition');
          break;
        case 'audio-capture':
          alert('No microphone found. Please check your microphone.');
          break;
        case 'not-allowed':
          alert('Microphone access denied. Please allow microphone access and reload the page.');
          break;
        case 'network':
          alert("either your browser dosnt suppoert webSpeechAPI or there is an Network Issue")
          console.log('Network error - this might be normal if no speech detected');
          break;
        case 'aborted':
          console.log('Speech recognition aborted');
          break;
        default:
          console.warn('Speech recognition error:', event.error);
      }
      
      setisListening(false);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      clearTimeout(timeoutId);
      setisListening(false);
    };

    //starting the actual recognintion
    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      alert("Failed to start speech recognition. Please try again.");
      setisListening(false);
      clearTimeout(timeoutId);
    }
  };

  // helper func for the handleVoice
  const handleSpeechComplete = (speechText) => {
    console.log('Speech complete:', speechText);
    
    const newMessage = {
      sender: "user",
      text: speechText
    };

    setmessages(prevMessages => [...prevMessages, newMessage]);
    setloading(true);
    sendTextToBackend(speechText);
  };

  const sendTextToBackend = async (text) => {
    console.log('sending req to backend:', text);
    try {
      const response = await fetch("http://127.0.0.1:8000/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": apikey
        },
        body: JSON.stringify({
          query: text,  
          model: model
        })
      });
      
      console.log('received response from backend');
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
  }

  return (
    <div className="widget-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
        {loading && <div className="loading">AI is thinking...</div>}
      </div>
      <input 
        type="text" 
        value={input} 
        placeholder="enter message here..." 
        onChange={(e) => setinput(e.target.value)} 
      />
      <button onClick={handleText}>Send</button>
      <button onClick={handleVoice} disabled={loading || isListening}>
        {isListening ? 'Listening...' : '🎙️'}
      </button>
      <label> Model : </label>
      <select className="select-button" value={model} onChange={(e)=>{setmodel(e.target.value)}}>
        <option value="gemini">Gemini</option>
        <option value="deepseek">DeepSeek</option>
        <option value="mistral">Mistral</option>
      </select>
    </div>
  );
}

export default Widget;
