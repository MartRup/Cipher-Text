import React, { useState } from 'react';
import './EncryptionChat.css';

const EncryptionChat = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedCipher, setSelectedCipher] = useState('caesar');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [currentUser, setCurrentUser] = useState('User A');
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState([]);
  
  const cipherOptions = [
    { value: 'caesar', label: 'Caesar Cipher', description: 'Shift each letter by key positions' },
    { value: 'vigenere', label: 'Vigenere Cipher', description: 'Use repeating keyword shifts' },
    { value: 'railfence', label: 'Rail Fence Cipher', description: 'Rearrange characters by rails' },
    { value: 'playfair', label: 'Playfair Cipher', description: 'Encrypt using digraph substitution' }
  ];

  // Caesar Cipher Implementation
  const caesarEncrypt = (text, key) => {
    const shift = parseInt(key) || 0;
    return text.toUpperCase().split('').map(char => {
      if (char >= 'A' && char <= 'Z') {
        return String.fromCharCode((char.charCodeAt(0) - 65 + shift) % 26 + 65);
      }
      return char;
    }).join('');
  };

  const caesarDecrypt = (text, key) => {
    const shift = parseInt(key) || 0;
    return text.toUpperCase().split('').map(char => {
      if (char >= 'A' && char <= 'Z') {
        return String.fromCharCode((char.charCodeAt(0) - 65 - shift + 26) % 26 + 65);
      }
      return char;
    }).join('');
  };

  // Vigenere Cipher Implementation
  const vigenereEncrypt = (text, key) => {
    const keyUpper = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!keyUpper) return text.toUpperCase();
    
    let keyIndex = 0;
    return text.toUpperCase().split('').map(char => {
      if (char >= 'A' && char <= 'Z') {
        const keyChar = keyUpper[keyIndex % keyUpper.length];
        const shift = keyChar.charCodeAt(0) - 65;
        keyIndex++;
        return String.fromCharCode((char.charCodeAt(0) - 65 + shift) % 26 + 65);
      }
      return char;
    }).join('');
  };

  const vigenereDecrypt = (text, key) => {
    const keyUpper = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!keyUpper) return text.toUpperCase();
    
    let keyIndex = 0;
    return text.toUpperCase().split('').map(char => {
      if (char >= 'A' && char <= 'Z') {
        const keyChar = keyUpper[keyIndex % keyUpper.length];
        const shift = keyChar.charCodeAt(0) - 65;
        keyIndex++;
        return String.fromCharCode((char.charCodeAt(0) - 65 - shift + 26) % 26 + 65);
      }
      return char;
    }).join('');
  };

  // Rail Fence Cipher Implementation
  const railFenceEncrypt = (text, key) => {
    const rails = parseInt(key) || 3;
    if (rails < 2) return text.toUpperCase();
    
    const fence = Array(rails).fill().map(() => []);
    let rail = 0;
    let direction = 1;
    
    for (let i = 0; i < text.length; i++) {
      fence[rail].push(text[i]);
      rail += direction;
      if (rail === 0 || rail === rails - 1) direction *= -1;
    }
    
    return fence.flat().join('').toUpperCase();
  };

  const railFenceDecrypt = (text, key) => {
    const rails = parseInt(key) || 3;
    if (rails < 2) return text.toUpperCase();
    
    const fence = Array(rails).fill().map(() => []);
    let rail = 0;
    let direction = 1;
    
    // Mark positions
    for (let i = 0; i < text.length; i++) {
      fence[rail].push(null);
      rail += direction;
      if (rail === 0 || rail === rails - 1) direction *= -1;
    }
    
    // Fill with characters
    let index = 0;
    for (let r = 0; r < rails; r++) {
      for (let c = 0; c < fence[r].length; c++) {
        if (fence[r][c] === null) {
          fence[r][c] = text[index++];
        }
      }
    }
    
    // Read in zigzag pattern
    let result = '';
    rail = 0;
    direction = 1;
    for (let i = 0; i < text.length; i++) {
      result += fence[rail].shift();
      rail += direction;
      if (rail === 0 || rail === rails - 1) direction *= -1;
    }
    
    return result.toUpperCase();
  };

  // Playfair Cipher Implementation
  const generatePlayfairMatrix = (key) => {
    const keyUpper = key.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
    const alphabet = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
    const seen = new Set();
    const matrix = [];
    
    // Add key characters
    for (const char of keyUpper) {
      if (!seen.has(char)) {
        seen.add(char);
        matrix.push(char);
      }
    }
    
    // Add remaining alphabet
    for (const char of alphabet) {
      if (!seen.has(char)) {
        seen.add(char);
        matrix.push(char);
      }
    }
    
    return matrix;
  };

  const playfairEncrypt = (text, key) => {
    const matrix = generatePlayfairMatrix(key);
    const processedText = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
    
    // Prepare digraphs
    const digraphs = [];
    let i = 0;
    while (i < processedText.length) {
      let pair = processedText[i];
      i++;
      if (i < processedText.length && processedText[i] !== pair) {
        pair += processedText[i];
        i++;
      } else {
        pair += 'X';
      }
      digraphs.push(pair);
    }
    
    // Encrypt digraphs
    const result = digraphs.map(([a, b]) => {
      const posA = matrix.indexOf(a);
      const posB = matrix.indexOf(b);
      const rowA = Math.floor(posA / 5);
      const colA = posA % 5;
      const rowB = Math.floor(posB / 5);
      const colB = posB % 5;
      
      if (rowA === rowB) {
        // Same row
        return matrix[rowA * 5 + (colA + 1) % 5] + matrix[rowB * 5 + (colB + 1) % 5];
      } else if (colA === colB) {
        // Same column
        return matrix[((rowA + 1) % 5) * 5 + colA] + matrix[((rowB + 1) % 5) * 5 + colB];
      } else {
        // Rectangle
        return matrix[rowA * 5 + colB] + matrix[rowB * 5 + colA];
      }
    });
    
    return result.join('');
  };

  const playfairDecrypt = (text, key) => {
    const matrix = generatePlayfairMatrix(key);
    const processedText = text.toUpperCase().replace(/[^A-Z]/g, '');
    
    // Split into digraphs
    const digraphs = [];
    for (let i = 0; i < processedText.length; i += 2) {
      digraphs.push(processedText.substr(i, 2));
    }
    
    // Decrypt digraphs
    const result = digraphs.map(([a, b]) => {
      const posA = matrix.indexOf(a);
      const posB = matrix.indexOf(b);
      const rowA = Math.floor(posA / 5);
      const colA = posA % 5;
      const rowB = Math.floor(posB / 5);
      const colB = posB % 5;
      
      if (rowA === rowB) {
        // Same row
        return matrix[rowA * 5 + (colA + 4) % 5] + matrix[rowB * 5 + (colB + 4) % 5];
      } else if (colA === colB) {
        // Same column
        return matrix[((rowA + 4) % 5) * 5 + colA] + matrix[((rowB + 4) % 5) * 5 + colB];
      } else {
        // Rectangle
        return matrix[rowA * 5 + colB] + matrix[rowB * 5 + colA];
      }
    });
    
    return result.join('');
  };

  const encryptMessage = (text, cipher, key) => {
    switch (cipher) {
      case 'caesar':
        return caesarEncrypt(text, key);
      case 'vigenere':
        return vigenereEncrypt(text, key);
      case 'railfence':
        return railFenceEncrypt(text, key);
      case 'playfair':
        return playfairEncrypt(text, key);
      default:
        return text;
    }
  };

  const decryptMessage = (text, cipher, key) => {
    switch (cipher) {
      case 'caesar':
        return caesarDecrypt(text, key);
      case 'vigenere':
        return vigenereDecrypt(text, key);
      case 'railfence':
        return railFenceDecrypt(text, key);
      case 'playfair':
        return playfairDecrypt(text, key);
      default:
        return text;
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !encryptionKey.trim()) {
      alert('Please enter both message and encryption key');
      return;
    }

    const encrypted = encryptMessage(inputMessage, selectedCipher, encryptionKey);
    const decrypted = decryptMessage(encrypted, selectedCipher, encryptionKey);

    const newMessage = {
      id: Date.now(),
      sender: currentUser,
      original: inputMessage.toUpperCase(),
      encrypted: encrypted,
      decrypted: decrypted,
      cipher: selectedCipher,
      key: encryptionKey,
      timestamp: new Date().toLocaleTimeString(),
      type: currentUser === 'User A' ? 'sent' : 'received'
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
    
    // Switch user for next message
    setCurrentUser(currentUser === 'User A' ? 'User B' : 'User A');
  };

  const handleCipherSelect = (cipher) => {
    setSelectedCipher(cipher);
  };

  return (
    <div className="encryption-chat">
      <div className="chat-container">
        {/* Header */}
        <div className="header">
          <h1>Encryption Chat</h1>
          <p>Classical cipher encryption</p>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="lock-icon">🔒</div>
              <p>Start a conversation by encrypting a message</p>
            </div>
          ) : (
            <div className="messages-area">
              {messages.map((msg) => (
                <div key={msg.id} className="message-item">
                  <div className="message-header">
                    <span className="sender">{msg.sender}</span>
                    <span className="timestamp">{msg.timestamp}</span>
                  </div>
                  <div className="message-content">
                    <div className="original-text">
                      <span className="label">Original:</span> {msg.original}
                    </div>
                    <div className="encrypted-text">
                      <span className="label">Encrypted:</span> {msg.encrypted}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="input-section">
          <div className="cipher-buttons">
            {cipherOptions.map((option) => (
              <button
                key={option.value}
                className={`cipher-btn ${selectedCipher === option.value ? 'active' : ''}`}
                onClick={() => setSelectedCipher(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <div className="key-input">
            <input
              type="text"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder={selectedCipher === 'caesar' || selectedCipher === 'railfence' ? "Key (numbers only)" : "Key (letters only)"}
              className="key-field"
            />
          </div>
          
          <div className="message-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="message-field"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          
          <button 
            onClick={handleSendMessage} 
            className="send-btn"
            disabled={!inputMessage.trim() || !encryptionKey.trim()}
          >
            <span className="send-icon">✈️</span>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default EncryptionChat;
